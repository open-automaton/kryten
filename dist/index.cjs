"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IOSource = exports.IEOL = void 0;
Object.defineProperty(exports, "Personality", {
  enumerable: true,
  get: function () {
    return _personality.Personality;
  }
});
Object.defineProperty(exports, "PersonalityComponent", {
  enumerable: true,
  get: function () {
    return _personality.PersonalityComponent;
  }
});
var _speech = require("@environment-safe/speech");
var _ollama = require("@environment-safe/ollama");
var _eventEmitter = require("@environment-safe/event-emitter");
var _personality = require("./personality.cjs");
//import { Random } from '@environment-safe/random';
//import sift from 'sift';

//Input-Evaluate-Output Loop
class IEOL {
  constructor(options = {}) {
    this.options = options;
    this.ready = _speech.Speech.ready;
    this.llm = new _ollama.Ollama();
    this.analyzers = [];
    this.fields = [];
    this.commands = [];
    this.chatlog = [];
    this.personality = options.personality || new _personality.Personality();
    this.persona = this.personality.person();
    this.modelName = this.options.model || 'llama2';
    new _eventEmitter.ExtendedEmitter().onto(this);
    if (this.options.channels) {
      let channel = null;
      for (let lcv = 0; lcv < this.options.channels.length; lcv++) {
        channel = this.options.channels[lcv];
        this.addChannel(channel);
      }
    }
    /*this.ready.then(()=>{
        this.emit('voices', { voices: this.tts.voices });
    })*/
  }
  async respond(text, qid) {
    const futures = this.options.channels.map(channel => {
      const result = new Promise((resolve, reject) => {
        channel.once('response-end', {
          qid: {
            $eq: qid
          }
        }, event => {
          resolve();
        });
      });
      channel.emit('response', {
        message: text,
        qid
      });
      return result;
    });
    await Promise.all(futures);
  }
  listenForInput(loop = false) {
    let channel = null;
    for (let lcv = 0; lcv < this.options.channels.length; lcv++) {
      channel = this.options.channels[lcv];
      channel.listenForInput(loop);
    }
  }
  stopListeningForInput() {
    let channel = null;
    for (let lcv = 0; lcv < this.options.channels.length; lcv++) {
      channel = this.options.channels[lcv];
      channel.stopRunLoop();
    }
  }
  command(pattern, handler) {
    //object(name, type, content)
    this.commands.push({
      pattern,
      handler
    });
  }
  parseCommand(spoken) {
    let command = null;
    for (let lcv = 0; lcv < this.commands.length; lcv++) {
      command = this.commands[lcv];
      if (typeof command.pattern === 'string' && spoken.toLowerCase() === command.pattern) {
        return command;
      }
      if (command.pattern instanceof RegExp) {
        //const matches = [];
        //let match = null;
        /*
        while(match = command.pattern.exec(spoken.toLowerCase())){
            matches.push(match.groups);
        } //*/
        const match = command.pattern.exec(spoken.toLowerCase());
        if (match) {
          command.groups = match.groups;
          return command;
        }
      }
    }
  }
  addChannel(channel) {
    let command = null;
    //TODO: blend or intersect voices
    channel.on('voices', voices => {
      this.emit('voices', voices);
    });
    channel.on('query', async options => {
      const query = options.query;
      const qid = options.qid;
      const script = this.personality.build({
        query,
        chat: this.chatlog || []
      });
      this.chatlog.push({
        user: 'user',
        message: query
      });
      const prompt = `${script}${query}`;
      this.emit('request', {
        message: query
      });
      // eslint-disable-next-line no-cond-assign
      if (command = this.parseCommand(query)) {
        const terminate = await command.handler(command.groups, qid, this);
        if (terminate === true) {
          this.running = false;
          return;
        }
      } else {
        const data = await this.llm.generate({
          model: this.modelName,
          prompt
        });
        let res = data.response;
        if (res[0] === '"' && res[res.length - 1] === '"') {
          res = res.substring(1, res.length - 1);
        }
        if (this.options.alterText) {
          res = this.options.alterText(res);
        }
        this.chatlog.push({
          user: 'me',
          message: res
        });
        this.emit('response', {
          message: res,
          qid
        });
        await this.respond(res, qid);
      }
    });
  }
}
exports.IEOL = IEOL;
class IOSource {
  constructor(options = {}) {
    this.options = options;
    new _eventEmitter.ExtendedEmitter().onto(this);
  }
  async query(options) {
    const qid = Math.floor(Math.random() * 9999999999) + '';
    const eventName = options.interruptible ? 'response' : 'response-end';
    const response = new Promise((resolve, reject) => {
      this.once(eventName, {
        qid: {
          $eq: qid
        }
      }, event => {
        resolve(event.message); //TBD
      });
    });
    this.emit('query', {
      query: options.query,
      qid
    });
    return await response;
  }
  async setupRunLoop(looped = false, handler) {
    this.running = true;
    const loopFn = async (loop = false) => {
      const response = await handler();
      if (this.running && loop) setTimeout(() => {
        loopFn(loop);
      });
      if (!this.running) return null;
      return response;
    };
    return loopFn(looped);
  }
  async stopRunLoop() {
    this.running = false;
  }
  async listenForInput(loop = false) {
    throw new Error('.listenForInput() not implemented!');
  }
}

/*
export class Kryten{
    constructor(options={}){
        this.options = options;
        this.ready = Speech.ready;
        this.llm = new Ollama();
        this.analyzers = [];
        this.fields = [];
        this.commands = [];
        this.chatlog = [];
        this.personality = options.personality || new Personality();
        this.persona = this.personality.person();
        this.modelName = this.options.model || 'llama2';
        (new ExtendedEmitter()).onto(this);
        if(this.options.voice && this.options.voice.name){
            (async ()=>{
                await this.ready;
                this.currentVoice({
                    name: this.options.voice.name,
                    lang: 'en-US'
                });
                this.emit('voices', {
                    voices: this.voices()
                });
            })();
        }
    }
    
    analyzer(analyzer){ //fn(query)
        this.analyzers.push(analyzer);
    }
    
    state(seed){ //fn(query)
        const result = {};
        return result;
    }
    
    formatter(format){ //object(name, type, content)
        
    }
    
    command(pattern, handler){ //object(name, type, content)
        this.commands.push({
            pattern,
            handler
        });
    }
    
    //TODO: validate hard requirements
    //validation(validator){ }
    
    voices(criteria){
        if(criteria){
            const filter = sift(criteria);
            const filtered = this.voices().filter(filter);
            return filtered;
        }
        return Speech.voices;
    }
    
    currentVoice(criteria){
        if(criteria){
            this.current = this.voices(criteria)[0];
            this.emit('voice', { voice: this.current });
        }
        return this.current || this.voices()[0];
    }
    
    parseCommand(spoken){
        let command = null;
        for(let lcv=0; lcv< this.commands.length; lcv++){
            command = this.commands[lcv];
            if(typeof command.pattern === 'string' && spoken.toLowerCase() === command.pattern){
                return command;
            }
            if(command.pattern instanceof RegExp){
                //const matches = [];
                //let match = null;
                
                //while(match = command.pattern.exec(spoken.toLowerCase())){
                //    matches.push(match.groups);
                //}
                const match = command.pattern.exec(spoken.toLowerCase());
                if(match){
                    command.groups = match.groups;
                    return command;
                }
            }
        }
    }
    
    async say(speakable){
        const voice = this.currentVoice();
        await Speech.speak(speakable, { voice });
    }
    
    async hesl(greeting){
        await this.ready;
        const voice = this.currentVoice();
        await Speech.speak(greeting, { voice });
        let command = null;
        let running = true;
        //const persona = this.persona;
        this.emit('start', { });
        const listenAndRespond = async ()=>{
            if(!running) return;
            await Speech.listen(async (spoken)=>{
                this.chatlog.push({
                    user: 'user',
                    message: spoken
                });
                if(!running) return;
                const script = this.personality.build({
                    query: spoken,
                    chat: this.chatlog 
                });
                const prompt = `${script}${spoken}`;
                this.emit('request', { message: spoken });
                // eslint-disable-next-line no-cond-assign
                if(command = this.parseCommand(spoken)){
                    const terminate = await command.handler(command.groups);
                    if(terminate === true){
                        running = false;
                        return;
                    }
                }else{
                    const data = await this.llm.generate({
                        model: this.modelName,
                        prompt
                    });
                    let res = data.response;
                    if(res[0] === '"' && res[res.length-1] === '"'){
                        res = res.substring(1, res.length-1);
                    }
                    if(this.options.alterText){
                        res = this.options.alterText(res);
                    }
                    this.chatlog.push({
                        user: 'me',
                        message: res
                    });
                    this.emit('response', { message: res });
                    await Speech.speak(res, { voice });
                }
                if(!running) return;
                listenAndRespond();
            }, {});
        };
        await listenAndRespond();
        return ()=>{
            running = false;
            this.emit('stop', { });
        };
    }
    
    repl(){
    }
}*/
exports.IOSource = IOSource;