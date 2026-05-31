import { Queue } from '../Queue/queue';
import { redis } from '../redis';
import { sql } from '../db';
import * as cache from './cacheService';

let notificationQueue: Queue | null = null;
function getNotificationQueue(): Queue {
    if (!notificationQueue) {
        notificationQueue = new Queue('notifications', redis);
    }
    return notificationQueue;
}

export async function getAllIncident() {
    try {
        const result = await sql`SELECT * FROM incidents`;
        return result;
    } catch (err) {
        console.error('Error fetching incidents:', err);
        throw err;
    }
}

export async function createIncident(
    service_id: number | string,
    title: string,
    description?: string | null
) {
    try {
        const result = await sql`
            INSERT INTO incidents (service_id, title, description)
            VALUES (${service_id}, ${title}, ${description ?? null})
            RETURNING *
        `;
        const updatesResult = await sql`
            INSERT INTO updates (incident_id, description, status)
            VALUES (${result[0].id}, ${description ?? null}, ${result[0].status})
            RETURNING *
        `;
        const fetchSubscribersResult = await sql`
            SELECT s.email, s.id FROM services srv
            LEFT JOIN subscriptions sub ON sub.service_id = srv.id
            LEFT JOIN subscribers s ON s.id = sub.subscriber_id
            WHERE srv.id = ${service_id} AND s.confirmed = true
        `;

        await cache.invalidateIncident(result[0].id);
        await redis.publish(
            'incident-updates',
            JSON.stringify({
                incidentId: result[0].id,
                message: description,
                status: result[0].status,
                timestamp: Date.now(),
            })
        );

        for (const subscriber of fetchSubscribersResult) {
            await getNotificationQueue().enqueue(
                {
                    email: subscriber.email,
                    subscriberId: subscriber.id,
                    incidentId: result[0].id,
                    incidentTitle: result[0].title,
                    description,
                    status: result[0].status,
                    serviceId: service_id,
                },
                {
                    priority: 1,
                    idempotencyKey: `notification:${subscriber.id}:${updatesResult[0].id}`,
                }
            );
        }

        return { incident: result[0], update: updatesResult[0] };
    } catch (err) {
        console.error('Error creating incident:', err);
        throw err;
    }
}

export async function TimelinePost(
    id: number | string,
    description: string,
    status: string
) {
    try {
        const IncidentUpdatedResult = await sql`
            UPDATE incidents
            SET
                description = COALESCE(${description}, description),
                status      = COALESCE(${status}, status)
            WHERE id = ${id}
            RETURNING *
        `;
        const updateResult = await sql`
            INSERT INTO updates (incident_id, description, status)
            VALUES (${id}, ${description}, ${status})
            RETURNING *
        `;
        const fetchSubscribersResult = await sql`
            SELECT s.email FROM services srv
            LEFT JOIN subscriptions sub ON sub.service_id = srv.id
            LEFT JOIN subscribers s ON s.id = sub.subscriber_id
            WHERE srv.id = ${IncidentUpdatedResult[0].service_id} AND s.confirmed = true
        `;

        await cache.invalidateIncident(id);
        await redis.publish(
            'incident-updates',
            JSON.stringify({
                incidentId: IncidentUpdatedResult[0].id,
                message: description,
                status: IncidentUpdatedResult[0].status,
                timestamp: Date.now(),
            })
        );

        // fetchSubscribersResult intentionally unused beyond logging in original
        void fetchSubscribersResult;

        return { incident: IncidentUpdatedResult[0], update: updateResult[0] };
    } catch (err) {
        console.error('Error posting timeline update:', err);
        throw err;
    }
}

export async function getIncidentById(id: number | string) {
    try {
        const cached = await cache.get(cache.keys.incident(id));
        if (cached) return cached;
        const result = await sql`SELECT * FROM incidents WHERE id = ${id}`;
        if (result[0]) {
            await cache.set(cache.keys.incident(id), result[0], 3600);
        }
        return result[0];
    } catch (err) {
        console.error('Error fetching incident by id:', err);
        throw err;
    }
}

export async function patchIncident(
    id: number | string,
    title: string | null,
    description: string | null,
    status: string | null,
    resolved_at: Date | null
) {
    try {
        const result = await sql`
            UPDATE incidents
            SET
                title       = COALESCE(${title}, title),
                description = COALESCE(${description}, description),
                status      = COALESCE(${status}, status),
                resolved_at = COALESCE(${resolved_at}, resolved_at)
            WHERE id = ${id}
            RETURNING *
        `;
        const updateResult = await sql`
            INSERT INTO updates (incident_id, description, status)
            VALUES (${id}, ${description}, ${status})
            RETURNING *
        `;
        const fetchSubscribersResult = await sql`
            SELECT s.email, s.id FROM services srv
            LEFT JOIN subscriptions sub ON sub.service_id = srv.id
            LEFT JOIN subscribers s ON s.id = sub.subscriber_id
            WHERE srv.id = ${result[0].service_id} AND s.confirmed = true
        `;

        await redis.publish(
            'incident-updates',
            JSON.stringify({
                incidentId: result[0].id,
                message: description,
                status: result[0].status,
                timestamp: Date.now(),
            })
        );
        await cache.invalidateIncident(id);

        for (const subscriber of fetchSubscribersResult) {
            await getNotificationQueue().enqueue(
                {
                    email: subscriber.email,
                    subscriberId: subscriber.id,
                    incidentId: result[0].id,
                    incidentTitle: result[0].title,
                    description,
                    status: result[0].status,
                    serviceId: result[0].service_id,
                },
                {
                    priority: 1,
                    idempotencyKey: `notification:${subscriber.id}:${updateResult[0].id}`,
                }
            );
        }

        return result;
    } catch (err) {
        console.error('Error patching incident:', err);
        throw err;
    }
}
