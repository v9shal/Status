import { sendMail } from '../services/notificationService';
import type { Job } from '../Queue/queue';

export async function notify(job: Job): Promise<void> {
    console.log('Processing job', job.id);
    await sendMail(job);
}
