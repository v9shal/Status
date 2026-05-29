const { redis } = require('../redis');

const PREFIX = 'statuspage:cache';

const keys = {
    status: () => `${PREFIX}:status`,
    incident: (id) => `${PREFIX}:incident:${id}`,
    history: () => `${PREFIX}:history`,
};

async function get(key) {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
}

async function set(key, value, ttlSeconds = 60) {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

async function del(...keysToDelete) {
    if (keysToDelete.length === 0) return;
    await redis.del(...keysToDelete);
}

async function invalidateStatus() {
    await del(keys.status(), keys.history());
}

async function invalidateIncident(id) {
    await del(keys.incident(id), keys.status(), keys.history());
}

module.exports = { keys, get, set, del, invalidateStatus, invalidateIncident };
