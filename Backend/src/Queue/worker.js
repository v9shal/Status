const { Queue } = require('./queue');

class Worker {

    constructor(queue, processor) {
        this.queue = queue;
        this.processor = processor;
        this.running = false;
    }
    async start(){
        this.running =true;
        while(this.running){
            const job=await this.queue.claim();
            if(!job || !job.id){
                 await new Promise(r=>setTimeout(r,500));
                 continue;
            }
            await this.process(job);
        }
    }
    stop(){
        this.running=false;
    }
    async process(job) {
        try{
            await this.processor(job);
            await this.queue.complete(job.id);
        }
        catch(err){
            await this.queue.fail(job);
        }
    }
}

module.exports = { Worker };