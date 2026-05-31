import type { Queue, Job } from './queue';

export type Processor = (job: Job) => Promise<void>;

export class Worker {
    public readonly queue: Queue;
    public readonly processor: Processor;
    public running: boolean;

    constructor(queue: Queue, processor: Processor) {
        this.queue = queue;
        this.processor = processor;
        this.running = false;
    }

    async start(): Promise<void> {
        this.running = true;
        while (this.running) {
            const job = await this.queue.claim();
            if (!job || !job.id) {
                await new Promise((r) => setTimeout(r, 500));
                continue;
            }
            await this.process(job);
        }
    }

    stop(): void {
        this.running = false;
    }

    async process(job: Job): Promise<void> {
        try {
            await this.processor(job);
            await this.queue.complete(job.id);
        } catch {
            await this.queue.fail(job);
        }
    }
}
