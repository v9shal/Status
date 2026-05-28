const Redis = require('ioredis')

const redis = new Redis(process.env.REDIS_URL)
const redisSubscriber = new Redis(process.env.REDIS_URL)




module.exports = { redis, redisSubscriber }