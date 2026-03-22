export class BackgroundMusicController {
  constructor(tracks = []) {
    this.tracks = tracks;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isTrackReady = false;
    this.isTrackPrimed = false;
    this.wantsPlayback = false;
    this.userActivatedPlayback = Boolean(navigator.userActivation?.hasBeenActive);
    this.onChange = () => {};
    this.baseVolume = 0.28;
    this.fadeDurationMs = 700;
    this.fadeToken = 0;
    this.resumeTime = 0;
    this.resumeListenersAttached = false;
    this.storageKey = "latent-space.background-music";
    this.audio = typeof Audio === "function" && tracks.length ? new Audio() : null;

    if (!this.audio) {
      return;
    }

    this.audio.preload = "metadata";
    this.audio.loop = false;
    this.audio.playsInline = true;
    this.audio.volume = clampVolume(this.baseVolume);

    this.audio.addEventListener("play", () => {
      this.isPlaying = true;
      this.onChange();
    });
    this.audio.addEventListener("pause", () => {
      this.isPlaying = false;
      this.onChange();
    });
    this.audio.addEventListener("canplay", () => this.handleTrackReady());
    this.audio.addEventListener("canplaythrough", () => this.handleTrackReady());
    this.audio.addEventListener("waiting", () => this.handleTrackWaiting());
    this.audio.addEventListener("stalled", () => this.handleTrackWaiting());
    this.audio.addEventListener("timeupdate", () => this.persistStateIfNeeded());
    this.audio.addEventListener("ended", () => {
      this.resumeTime = 0;
      this.playIndex((this.currentIndex + 1) % this.tracks.length).catch((error) => {
        console.error("Background music failed to continue:", error);
      });
    });

    const restored = this.readPersistedState();
    this.wantsPlayback = restored.enabled;
    this.currentIndex = restored.index;
    this.resumeTime = restored.time;
    this.setTrack(this.currentIndex, this.resumeTime, false);

    window.addEventListener("beforeunload", () => this.persistState());
  }

  async startByDefault() {
    if (!this.audio) {
      return;
    }

    if (!this.wantsPlayback) {
      this.wantsPlayback = true;
      this.persistState();
    }

    this.userActivatedPlayback ||= Boolean(navigator.userActivation?.hasBeenActive);
    this.primeCurrentTrack();

    if (!this.userActivatedPlayback) {
      this.armResumeOnInteraction();
      this.onChange();
      return;
    }

    await this.maybeStartPlayback();
  }

  async playIndex(index) {
    if (!this.audio || !this.tracks.length) {
      return;
    }

    this.currentIndex = ((index % this.tracks.length) + this.tracks.length) % this.tracks.length;
    this.setTrack(this.currentIndex, this.resumeTime, true);

    if (!this.isReadyToPlay()) {
      if (!this.userActivatedPlayback) {
        this.armResumeOnInteraction();
      }
      this.onChange();
      return;
    }

    this.disarmResumeOnInteraction();
    this.audio.volume = 0;

    try {
      await this.audio.play();
    } catch (error) {
      this.audio.volume = clampVolume(this.baseVolume);
      if (this.wantsPlayback) {
        this.armResumeOnInteraction();
      }
      throw error;
    }

    await this.fadeTo(this.baseVolume, this.fadeDurationMs);
    this.persistState();
  }

  isPending() {
    return this.wantsPlayback && !this.isPlaying;
  }

  setTrack(index, resumeTime = 0, shouldLoad = true) {
    if (!this.audio || !this.tracks.length) {
      return;
    }

    const track = this.tracks[index];
    const trackChanged = this.audio.dataset.track !== track;
    if (trackChanged) {
      this.audio.src = track;
      this.audio.dataset.track = track;
      this.isTrackReady = false;
      this.isTrackPrimed = false;
    }

    if (shouldLoad && (!this.isTrackPrimed || trackChanged)) {
      this.audio.preload = "auto";
      this.audio.load();
      this.isTrackPrimed = true;
    }

    if (resumeTime > 0) {
      const targetTime = resumeTime;
      this.audio.addEventListener(
        "loadedmetadata",
        () => {
          this.audio.currentTime = Math.min(targetTime, Math.max(0, this.audio.duration || targetTime));
          this.resumeTime = 0;
        },
        { once: true },
      );
    }
  }

  readPersistedState() {
    if (!("localStorage" in window)) {
      return { enabled: true, index: 0, time: 0 };
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return { enabled: true, index: 0, time: 0 };
      }
      const parsed = JSON.parse(raw);
      const safeIndex = Number.isInteger(parsed.index) ? parsed.index : 0;
      const safeTime = Number.isFinite(parsed.time) ? parsed.time : 0;
      return {
        enabled: Boolean(parsed.enabled),
        index: safeIndex,
        time: safeTime,
      };
    } catch {
      return { enabled: true, index: 0, time: 0 };
    }
  }

  persistStateIfNeeded() {
    if (!this.audio || !this.wantsPlayback) {
      return;
    }

    const second = Math.floor(this.audio.currentTime);
    if (second > 0 && second % 5 === 0) {
      this.persistState();
    }
  }

  persistState() {
    if (!this.audio || !("localStorage" in window)) {
      return;
    }

    try {
      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify({
          enabled: this.wantsPlayback,
          index: this.currentIndex,
          time: this.wantsPlayback ? Number(this.audio.currentTime.toFixed(2)) : Number(this.audio.currentTime.toFixed(2)),
        }),
      );
    } catch {
      // Ignore localStorage failures in private mode or restricted environments.
    }
  }

  armResumeOnInteraction() {
    if (this.resumeListenersAttached || !this.wantsPlayback) {
      return;
    }

    this.resumeListenersAttached = true;
    const resume = async () => {
      this.userActivatedPlayback = true;
      if (!this.wantsPlayback || this.isPlaying) {
        return;
      }
      try {
        await this.maybeStartPlayback();
      } catch {
        this.armResumeOnInteraction();
      }
    };

    this.resumeListeners = [
      ["pointerdown", resume],
      ["keydown", resume],
      ["touchstart", resume],
    ];

    for (const [eventName, handler] of this.resumeListeners) {
      window.addEventListener(eventName, handler, { once: true, passive: true });
    }
  }

  disarmResumeOnInteraction() {
    if (!this.resumeListenersAttached) {
      return;
    }

    this.resumeListenersAttached = false;
    for (const [eventName, handler] of this.resumeListeners ?? []) {
      window.removeEventListener(eventName, handler);
    }
    this.resumeListeners = [];
  }

  fadeTo(targetVolume, durationMs) {
    if (!this.audio) {
      return Promise.resolve();
    }

    const startVolume = clampVolume(this.audio.volume);
    const safeTargetVolume = clampVolume(targetVolume);
    const startedAt = performance.now();
    const fadeToken = ++this.fadeToken;

    return new Promise((resolve) => {
      const step = (now) => {
        if (fadeToken !== this.fadeToken || !this.audio) {
          resolve();
          return;
        }

        const progress = Math.min(1, (now - startedAt) / durationMs);
        this.audio.volume = clampVolume(
          startVolume + (safeTargetVolume - startVolume) * progress,
        );

        if (progress >= 1) {
          resolve();
          return;
        }

        requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    });
  }

  primeCurrentTrack() {
    if (!this.audio || !this.tracks.length) {
      return;
    }

    this.setTrack(this.currentIndex, this.resumeTime, true);
  }

  handleTrackReady() {
    if (!this.audio) {
      return;
    }

    this.isTrackReady = this.audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA;
    this.onChange();
    if (this.isTrackReady && this.wantsPlayback) {
      this.maybeStartPlayback().catch((error) => {
        console.error("Background music failed to start after loading:", error);
      });
    }
  }

  handleTrackWaiting() {
    this.isTrackReady = false;
    this.onChange();
  }

  isReadyToPlay() {
    return Boolean(
      this.audio &&
        this.wantsPlayback &&
        this.isTrackReady &&
        this.userActivatedPlayback &&
        !this.isPlaying,
    );
  }

  async maybeStartPlayback() {
    if (!this.audio || !this.wantsPlayback || this.isPlaying) {
      return;
    }

    if (!this.isTrackReady) {
      this.primeCurrentTrack();
      this.onChange();
      return;
    }

    if (!this.userActivatedPlayback) {
      this.armResumeOnInteraction();
      this.onChange();
      return;
    }

    await this.playIndex(this.currentIndex);
    this.onChange();
  }
}


function clampVolume(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
