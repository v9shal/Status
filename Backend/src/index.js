const express = require('express')
const { createServer } = require('node:http');
const { initGateway } = require('./websocket/gateway')
const { redis, redisSubscriber } = require('./redis')
const { Queue } = require('./Queue/queue');
const { Worker } = require('./Queue/worker');
const { notify } = require('./worker/notificationWorker');

const servicesRouter = require('./routes/services')
const incidentsRouter = require('./routes/incidents');
const subscriberRouter = require('./routes/subscriber');
const publicRouter = require('./routes/public');

const app = express()
app.use(express.json())

app.use('/api', servicesRouter)
app.use('/api', incidentsRouter)
app.use('/api', subscriberRouter)
app.use('/api', publicRouter)

const server = createServer(app);

initGateway(server, redisSubscriber)

server.listen(3000, async () => {

    const queue = new Queue('notifications', redis);
    await queue.register();

    for (let i = 0; i < 5; i++) {
        new Worker(queue, notify).start();
    }

    console.log('Server running on port 3000')
})