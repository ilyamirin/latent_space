function findSoftRussianVoice(voices) {
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ru") && /female|milena|yana|alena|anna/i.test(voice.name)) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ru")) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
  );
}


export class BackgroundMusicController {
  constructor(tracks = []) {
    this.tracks = tracks;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.wantsPlayback = false;
    this.onChange = () => {};
    this.baseVolume = 0.18;
    this.fadeDurationMs = 700;
    this.fadeToken = 0;
    this.resumeTime = 0;
    this.resumeListenersAttached = false;
    this.storageKey = "latent-space.background-music";
    this.audio = typeof Audio === "function" && tracks.length ? new Audio() : null;

    if (!this.audio) {
      return;
    }

    this.audio.preload = "none";
    this.audio.loop = false;
    this.audio.volume = this.baseVolume;

    this.audio.addEventListener("play", () => {
      this.isPlaying = true;
      this.onChange();
    });
    this.audio.addEventListener("pause", () => {
      this.isPlaying = false;
      this.onChange();
    });
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
    this.setTrack(this.currentIndex, this.resumeTime);

    if (this.wantsPlayback) {
      this.armResumeOnInteraction();
    }

    window.addEventListener("beforeunload", () => this.persistState());
  }

  setListener(listener) {
    this.onChange = listener;
  }

  async toggle() {
    if (!this.audio) {
      return;
    }

    if (this.wantsPlayback) {
      await this.pause();
      return;
    }

    await this.play();
  }

  async play() {
    this.wantsPlayback = true;
    this.persistState();
    this.onChange();
    await this.playIndex(this.currentIndex);
  }

  async pause() {
    if (!this.audio) {
      return;
    }

    this.wantsPlayback = false;
    this.disarmResumeOnInteraction();
    this.persistState();

    if (this.isPlaying) {
      await this.fadeTo(0, this.fadeDurationMs);
    }
    this.audio.pause();
    this.audio.volume = this.baseVolume;
    this.onChange();
  }

  async playIndex(index) {
    if (!this.audio || !this.tracks.length) {
      return;
    }

    this.currentIndex = ((index % this.tracks.length) + this.tracks.length) % this.tracks.length;
    this.setTrack(this.currentIndex, this.resumeTime);

    this.disarmResumeOnInteraction();
    this.audio.volume = 0;

    try {
      await this.audio.play();
    } catch (error) {
      this.audio.volume = this.baseVolume;
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

  setTrack(index, resumeTime = 0) {
    if (!this.audio || !this.tracks.length) {
      return;
    }

    const track = this.tracks[index];
    if (this.audio.dataset.track !== track) {
      this.audio.src = track;
      this.audio.dataset.track = track;
      this.audio.load();
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
      return { enabled: false, index: 0, time: 0 };
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return { enabled: false, index: 0, time: 0 };
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
      return { enabled: false, index: 0, time: 0 };
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
      if (!this.wantsPlayback || this.isPlaying) {
        return;
      }
      try {
        await this.playIndex(this.currentIndex);
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

    const startVolume = this.audio.volume;
    const startedAt = performance.now();
    const fadeToken = ++this.fadeToken;

    return new Promise((resolve) => {
      const step = (now) => {
        if (fadeToken !== this.fadeToken || !this.audio) {
          resolve();
          return;
        }

        const progress = Math.min(1, (now - startedAt) / durationMs);
        this.audio.volume = startVolume + (targetVolume - startVolume) * progress;

        if (progress >= 1) {
          resolve();
          return;
        }

        requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    });
  }
}


export class SpeechController {
  constructor() {
    this.supported = "speechSynthesis" in window;
    this.isPlaying = false;
    this.activeId = null;
    this.voices = [];
    this.onChange = () => {};

    if (this.supported) {
      this.voices = window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        this.voices = window.speechSynthesis.getVoices();
      });
    }
  }

  setListener(listener) {
    this.onChange = listener;
  }

  speak(text, activeId = "global") {
    if (!this.supported || !text) {
      return;
    }

    this.stop();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = findSoftRussianVoice(this.voices);

    utterance.rate = 0.92;
    utterance.pitch = 0.92;
    utterance.volume = 0.95;
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "ru-RU";
    }

    utterance.onstart = () => {
      this.isPlaying = true;
      this.activeId = activeId;
      this.onChange();
    };
    utterance.onend = () => {
      this.isPlaying = false;
      this.activeId = null;
      this.onChange();
    };
    utterance.onerror = () => {
      this.isPlaying = false;
      this.activeId = null;
      this.onChange();
    };

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (!this.supported) {
      return;
    }
    window.speechSynthesis.cancel();
    this.isPlaying = false;
    this.activeId = null;
    this.onChange();
  }
}
