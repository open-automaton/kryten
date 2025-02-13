import { IOSource } from './index.mjs';
import { Speech } from '@environment-safe/speech';

export class SpeechIO extends IOSource{
    constructor(options={}){
        super(options);
        this.on('response', async (response)=>{
            const voice = Speech.voices[0];
            await Speech.speak(response.message, { voice });
            this.emit('response-end', {qid: response.qid});
        });
        (async ()=>{
            await Speech.ready;
            this.emit('voices', {voices: Speech.voices});
        })();
    }
    
    async listenForInput(looped=false){
        this.setupRunLoop(looped, async ()=>{
            const spoken = await Speech.hear();
            return await this.query(spoken);
        });
    }
}