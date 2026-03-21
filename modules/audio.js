function findSoftRussianVoice(voices) {
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ru") && /female|milena|yana|alena|anna/i.test(voice.name)) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ru")) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith("en"))
  );
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
