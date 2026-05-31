import { redis } from '../redis';

const PREFIX = 'statuspage:cache';

export const keys = {
    status: (): string => `${PREFIX}:status`,
    incident: (id: string | number): string => `${PREFIX}:incident:${id}`,
    history: (): string => `${PREFIX}:history`,
};

export async function get<T = unknown>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
}

export async function set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function del(...keysToDelete: string[]): Promise<void> {
    if (keysToDelete.length === 0) return;
    await redis.del(...keysToDelete);
}

export async function invalidateStatus(): Promise<void> {
    await del(keys.status(), keys.history());
}

export async function invalidateIncident(id: string | number): Promise<void> {
    await del(keys.incident(id), keys.status(), keys.history());
}
