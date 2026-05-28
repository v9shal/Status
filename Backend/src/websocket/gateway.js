const { Server } = require('socket.io')

function initGateway(httpServer, redisSubscriber) {
    const io = new Server(httpServer, {
        cors: { origin: '*' }
    })

    io.on('connection', (socket) => {
        console.log('client connected:', socket.id)
        socket.on('disconnect', () => {
            console.log('client disconnected:', socket.id)
        })
    })

    redisSubscriber.subscribe('incident-updates')

    redisSubscriber.on('message', (channel, message) => {
        try {
            const parsed = JSON.parse(message)
            io.emit('incident-update', parsed)
        } catch (err) {
            console.error('Invalid message:', err)
        }
    })
}

module.exports = { initGateway }