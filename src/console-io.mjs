import { IOSource } from './index.mjs';
import { isBrowser, isJsDom } from 'browser-or-node';
import * as mod from 'module';
let internalRequire = null;
if(typeof require !== 'undefined') internalRequire = require;
let ensureRequire = null;
let prompts = null;
export class ConsoleIO extends IOSource{
    constructor(options={}){
        super(options);
        const name = this.options.name || 'bob';
        if((!(isBrowser || isJsDom)) && !prompts){
            if(!ensureRequire) ensureRequire = ()=> (!internalRequire) && (internalRequire = mod.createRequire(import.meta.url));
            ensureRequire();
            prompts = internalRequire('prompts');
        }
        this.on('response', async (response)=>{
            console.log('  \u001b[1m'+name+'\u001b[22m'+`: ${response.message}`);
            this.emit('response-end', {qid: response.qid});
        });
    }
    
    async listenForInput(looped=false){
        const name = this.options.name || 'bob';
        this.setupRunLoop(looped, async ()=>{
            if(!(isBrowser || isJsDom)){
                const written = await prompts({
                    type: 'text',
                    name: 'query',
                    message: 'me'.padStart(name.length, ' ')+':',
                    initial: 'Give me a 1 page biography on your background.'
                });
                return await this.query(written);
            }else{
                //TBD
            }
        });
    }
}