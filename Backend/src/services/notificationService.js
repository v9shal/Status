const transporter = require('./transporter');

async function sendMail(job) {
    const payload = JSON.parse(job.payload);
    const { email, incidentTitle, description, status, serviceId } = payload;

    await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Status Page" <noreply@example.com>',
        to: email,
        subject: `[Incident] ${incidentTitle} — ${status}`,
        text: `Incident: ${incidentTitle}\nStatus: ${status}\nService ID: ${serviceId}\n\n${description}`,
        html: `<h2>${incidentTitle}</h2><p><strong>Status:</strong> ${status}</p><p><strong>Service ID:</strong> ${serviceId}</p><p>${description}</p>`,
    });
}

module.exports = { sendMail };