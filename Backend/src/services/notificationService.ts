import transporter from './transporter';
import type { Job } from '../Queue/queue';

interface NotificationPayload {
    email: string;
    subscriberId?: number;
    incidentId?: number;
    incidentTitle: string;
    description: string;
    status: string;
    serviceId: number;
}

export async function sendMail(job: Job): Promise<void> {
    const payload = JSON.parse(job.payload) as NotificationPayload;
    const { email, incidentTitle, description, status, serviceId } = payload;

    await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Status Page" <noreply@example.com>',
        to: email,
        subject: `[Incident] ${incidentTitle} — ${status}`,
        text: `Incident: ${incidentTitle}\nStatus: ${status}\nService ID: ${serviceId}\n\n${description}`,
        html: `<h2>${incidentTitle}</h2><p><strong>Status:</strong> ${status}</p><p><strong>Service ID:</strong> ${serviceId}</p><p>${description}</p>`,
    });
}
