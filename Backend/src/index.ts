import express from 'express';
import { createServer } from 'node:http';
import { initGateway } from './websocket/gateway';
import { redis, redisSubscriber } from './redis';
import { Queue } from './Queue/queue';
import { Worker } from './Queue/worker';
import { notify } from './worker/notificationWorker';

import servicesRouter from './routes/services';
import incidentsRouter from './routes/incidents';
import subscriberRouter from './routes/subscriber';
import publicRouter from './routes/public';

const app = express();
app.use(express.json());

app.use('/api', servicesRouter);
app.use('/api', incidentsRouter);
app.use('/api', subscriberRouter);
app.use('/api', publicRouter);

const server = createServer(app);

initGateway(server, redisSubscriber);

const port = parseInt(process.env.PORT || '3000', 10);
server.listen(port, async () => {
    const queue = new Queue('notifications', redis);
    await queue.register();

    for (let i = 0; i < 5; i++) {
        new Worker(queue, notify).start();
    }

    console.log(`Server running on port ${port}`);
});
