"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SpeechIO = void 0;
var _index = require("./index.cjs");
var _speech = require("@environment-safe/speech");
class SpeechIO extends _index.IOSource {
  constructor(options = {}) {
    super(options);
    this.on('response', async response => {
      const voice = _speech.Speech.voices[0];
      await _speech.Speech.speak(response.message, {
        voice
      });
      this.emit('response-end', {
        qid: response.qid
      });
    });
    (async () => {
      await _speech.Speech.ready;
      this.emit('voices', {
        voices: _speech.Speech.voices
      });
    })();
  }
  async listenForInput(looped = false) {
    this.setupRunLoop(looped, async () => {
      const spoken = await _speech.Speech.hear();
      return await this.query(spoken);
    });
  }
}
exports.SpeechIO = SpeechIO;