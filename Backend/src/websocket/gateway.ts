import { Server } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import type Redis from 'ioredis';

export function initGateway(httpServer: HttpServer, redisSubscriber: Redis): void {
    const io = new Server(httpServer, {
        cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
        console.log('client connected:', socket.id);
        socket.on('disconnect', () => {
            console.log('client disconnected:', socket.id);
        });
    });

    redisSubscriber.subscribe('incident-updates');

    redisSubscriber.on('message', (_channel, message) => {
        try {
            const parsed = JSON.parse(message);
            io.emit('incident-update', parsed);
        } catch (err) {
            console.error('Invalid message:', err);
        }
    });
}
