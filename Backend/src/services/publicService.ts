import { sql } from '../db';
import * as cache from './cacheService';

const STATUS_TTL = 30;
const HISTORY_TTL = 300;

export async function getStatus() {
    const cached = await cache.get(cache.keys.status());
    if (cached) return cached;

    const services = await sql`SELECT id, name, description, status FROM services ORDER BY id`;
    const activeIncidents = await sql`
        SELECT id, service_id, title, description, status, created_at
        FROM incidents
        WHERE status != 'resolved'
        ORDER BY created_at DESC
    `;

    const payload = {
        services,
        activeIncidents,
        generatedAt: new Date().toISOString(),
    };

    await cache.set(cache.keys.status(), payload, STATUS_TTL);
    return payload;
}

export async function getHistory() {
    const cached = await cache.get(cache.keys.history());
    if (cached) return cached;

    const incidents = await sql`
        SELECT id, service_id, title, description, status, created_at, resolved_at
        FROM incidents
        WHERE created_at >= NOW() - INTERVAL '90 days'
        ORDER BY created_at DESC
    `;

    const payload = { incidents, generatedAt: new Date().toISOString() };
    await cache.set(cache.keys.history(), payload, HISTORY_TTL);
    return payload;
}
