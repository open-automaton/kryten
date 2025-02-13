import { Kryten } from './bots/kryten.mjs';
import { ConsoleIO } from './src/console-io.mjs';
import { SpeechIO } from './src/speech-io.mjs';
import { Personality, PersonalityComponent } from './src/index.mjs';
import { isBrowser, isJsDom } from 'browser-or-node';

import * as url from 'url';
//import process from 'process';

const channels = [];
//if we're in the browser let's add a speech channel
if(isBrowser || isJsDom){
    channels.push(new SpeechIO({
        voice: {
            name:'Zarvox',
            pitch: 1.0,
            rate: 1.0
        }
    }));
}else{
    channels.push(new ConsoleIO({name: 'kryten'}));
}

export const loop = new Kryten({
    channels,
    alterText: (text) => text.replace(/\*.*?\*/g, '')
});

//if module is being run directly initiate loop
if(globalThis.process && process.argv[1] === url.fileURLToPath(import.meta.url)){
    loop.listenForInput(true);
}