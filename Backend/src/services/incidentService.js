    // Creating an incident:

    // INSERT into incidents — title, service_id, status='investigating'
    // INSERT into updates — first timeline entry with description
    // Fetch confirmed subscribers for that service_id
    // For each subscriber — enqueue notification job with idempotency key
    // Return created incident

    // Posting a timeline update:

    // INSERT into updates — new timeline entry
    // UPDATE incidents SET status = new status
    // Fetch confirmed subscribers for that service's incident
    // For each subscriber — enqueue notification job with idempotency key
    // Return created update

    // Resolving an incident:

    // UPDATE incidents SET status='resolved', resolved_at=NOW()
    // Fetch confirmed subscribers
    // Enqueue final notification
    // Return updated incident

const { Queue } = require('../queue/Queue')
const { redis } = require('../redis')
    const { sql } = require('../db');
    const notificationQueue = new Queue('notifications', redis)
    async function getAllIncident(){
        try{
            const result=await sql`SELECT * FROM incidents`;
            return result;

        }
        catch(err){
            console.error("Error fetching incidents:",err);
            throw err;
        }
    }
    async function 
    createIncident(service_id,title,description){
        try{
        const result = await sql `
            INSERT INTO incidents (service_id,title,description)
            VALUES (${service_id},${title},${description})
            returning *
            `
            const updatesResult=await sql`
            INSERT INTO updates (incident_id, description, status)
            VALUES (${result[0].id}, ${description}, ${result[0].status})
            returning *
            `
            const fetchSubscribersResult=await sql`
            SELECT s.email,s.id FROM services srv
            LEFT JOIN subscriptions sub ON sub.service_id = srv.id
            LEFT JOIN subscribers s ON s.id = sub.subscriber_id
            WHERE srv.id = ${service_id} AND s.confirmed = true
            `
            // Enqueue notification jobs for each subscriber (not implemented here) 
            console.log("Subscribers to notify:", fetchSubscribersResult);

            await redis.publish('incident-updates',JSON.stringify({
                incidentId: result[0].id,
                message: description,
                status: result[0].status,
                timestamp: Date.now()
            }))
           for (const subscriber of fetchSubscribersResult) {
    await notificationQueue.enqueue({
        email: subscriber.email,
        subscriberId: subscriber.id,
        incidentId: result[0].id,
        incidentTitle: result[0].title,
        description: description,
        status: result[0].status,
        serviceId: service_id
    }, {
        priority: 1,
        idempotencyKey: `notification:${subscriber.id}:${updatesResult[0].id}`
    })
}
            return {incident: result[0], update: updatesResult[0] };
        }
        catch(err){
            console.error("Error creating incident:",err);
            throw err;
        }
    }
    async function TimelinePost(id,description,status){
        try{
            const IncidentUpdatedResult=await sql`
            UPDATE incidents
            SET
            description=COALESCE(${description},description),
            status=COALESCE(${status},status)
            WHERE id=${id}
            returning *
            `
            const updateResult=await sql`
            INSERT INTO updates (incident_id, description, status)
            VALUES (${id}, ${description}, ${status})
            returning *
            `
            const fetchSubscribersResult=await sql`
            SELECT s.email FROM services srv
            LEFT JOIN subscriptions sub ON sub.service_id = srv.id
            LEFT JOIN subscribers s ON s.id = sub.subscriber_id
            WHERE srv.id = ${IncidentUpdatedResult[0].service_id} AND s.confirmed = true
            `
            // Enqueue notification jobs for each subscriber (not implemented here) 
            console.log("Subscribers to notify:", fetchSubscribersResult);
             await redis.publish('incident-updates',JSON.stringify({
                incidentId: IncidentUpdatedResult[0].id,
                message: description,
                status: IncidentUpdatedResult[0].status,
                timestamp: Date.now()
            }))
            return { incident: IncidentUpdatedResult[0], update: updateResult[0] };


        }
        catch(err){
            console.error("Error posting timeline update:",err);
            throw err;
        }
    }
    async function getIncidentById(id){
        try{
            const result=await sql`SELECT * FROM incidents WHERE id=${id}`;
            return result[0];
        }
        catch(err){
            console.error("Error fetching incident by id:",err);
            throw err;
        }
    }
    async function patchIncident(id,title,description,status,resolved_at){
        try{
            const result = await sql`
            UPDATE incidents
            SET 
            title=COALESCE(${title},title),
            description=COALESCE(${description},description),
            status=COALESCE(${status},status),
            resolved_at=COALESCE(${resolved_at},resolved_at)
            WHERE id=${id}
            returning *
            `
            const updateResult=await sql`
            INSERT INTO updates (incident_id, description, status)
            VALUES (${id}, ${description}, ${status})
            returning *
            `
            const fetchSubscribersResult=await sql`
            SELECT s.email,s.id FROM services srv
            LEFT JOIN subscriptions sub ON sub.service_id = srv.id
            LEFT JOIN subscribers s ON s.id = sub.subscriber_id
            WHERE srv.id = ${result[0].service_id} AND s.confirmed = true
            `
            // Enqueue notification jobs for each subscriber (not implemented here) 
            console.log("Subscribers to notify:", fetchSubscribersResult);
             await redis.publish('incident-updates',JSON.stringify({
                incidentId: result[0].id,
                message: description,
                status: result[0].status,
                timestamp: Date.now()
            }))
         for (const subscriber of fetchSubscribersResult) {
    await notificationQueue.enqueue({
        email: subscriber.email,
        subscriberId: subscriber.id,
        incidentId: result[0].id,
        incidentTitle: result[0].title,
        description: description,
        status: result[0].status,
        serviceId: result[0].service_id
    }, {
        priority: 1,
        idempotencyKey: `notification:${subscriber.id}:${updateResult[0].id}`
    })
}
            return result;
        }
        catch(err){
            console.error("Error patching incident:",err);
            throw err;
        }
    }
    module.exports={
        getAllIncident,
        createIncident,
        getIncidentById,
        patchIncident,
        TimelinePost
    }