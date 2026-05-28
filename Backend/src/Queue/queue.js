const redis=require('../redis')

class Queue{
    constructor(redisClient,name){
        this.name=name;
        this.redis=redisClient;
    }
    async registerQueue(name,options={
        
    }){
        await this.redis.sadd(name);
    }
    async enqueue(queueName,data){
        await this.redis.zadd(queueName,Date.now(),JSON.stringify(data));
    }
}
module.exports={Queue}