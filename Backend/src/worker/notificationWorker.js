const { sendMail } = require('../services/notificationService');

async function notify(job) {
    console.log('Processing job', job.id);
    await sendMail(job);
}

module.exports = { notify };