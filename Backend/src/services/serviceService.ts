import { sql } from '../db';
import * as cache from './cacheService';

export async function getAllServices() {
    try {
        const result = await sql`SELECT * FROM services`;
        return result;
    } catch (err) {
        console.error('Error fetching services:', err);
        throw err;
    }
}

export async function createService(name: string, description?: string | null) {
    try {
        const result = await sql`
            INSERT INTO services (name, description)
            VALUES (${name}, ${description ?? null})
            RETURNING *
        `;
        await cache.invalidateStatus();
        return result[0];
    } catch (err) {
        console.error('Error creating service:', err);
        throw err;
    }
}

export async function getServiceById(id: string | number) {
    try {
        const result = await sql`SELECT * FROM services WHERE id = ${id}`;
        return result[0];
    } catch (err) {
        console.error('Error fetching service by id:', err);
        throw err;
    }
}

export async function updateService(
    id: string | number,
    name?: string | null,
    description?: string | null,
    status?: string | null
) {
    try {
        const result = await sql`
            UPDATE services
            SET
                name        = COALESCE(${name ?? null}, name),
                description = COALESCE(${description ?? null}, description),
                status      = COALESCE(${status ?? null}, status)
            WHERE id = ${id}
            RETURNING *
        `;
        await cache.invalidateStatus();
        return result[0];
    } catch (err) {
        console.error('Error updating service:', err);
        throw err;
    }
}
