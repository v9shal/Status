const express = require('express')
const  { createServer } =require( 'node:http');
const { initGateway } = require('./websocket/gateway')
const { redisSubscriber } = require('./redis')
const { createTable } = require('./migrate')

const servicesRouter = require('./routes/services')
const incidentsRouter = require('./routes/incidents')

const app = express()
app.use(express.json())

app.use('/api', servicesRouter)
app.use('/api', incidentsRouter)

const server = createServer(app);

initGateway(server, redisSubscriber)

server.listen(3000, async () => {
    console.log('Server running on port 3000')
})