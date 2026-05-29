const { sql } = require('./db');

async function createTable() {
  await sql`
     CREATE TABLE IF NOT EXISTS services (
            id          SERIAL PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT,
            status      TEXT NOT NULL DEFAULT 'operational',
            created_at  TIMESTAMP DEFAULT NOW()
        ) `;

   await sql`   CREATE TABLE IF NOT EXISTS subscribers (
        id          SERIAL PRIMARY KEY,
        email       TEXT NOT NULL UNIQUE,
        confirmed   BOOLEAN DEFAULT false,
        token       TEXT UNIQUE,
        created_at  TIMESTAMP DEFAULT NOW()
    ) `;

    await sql`       CREATE TABLE IF NOT EXISTS subscriptions (
            id          SERIAL PRIMARY KEY,
            subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
            service_id    INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
            created_at    TIMESTAMP DEFAULT NOW(),
            UNIQUE(subscriber_id, service_id)
        )`;

    await sql`
    CREATE TABLE IF NOT EXISTS incidents (
    id          SERIAL PRIMARY KEY,
    service_id  INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'investigating',
    created_at  TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
        ) `;
    await sql`     CREATE TABLE IF NOT EXISTS updates (
            id          SERIAL PRIMARY KEY,
            incident_id  INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
            description TEXT,
            status      TEXT NOT NULL DEFAULT 'investigating',
            created_at  TIMESTAMP DEFAULT NOW()
        ) `;
     
    await sql`    CREATE TABLE IF NOT EXISTS notifications (
    id            SERIAL PRIMARY KEY,
    subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
    incident_id   INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    update_id     INTEGER NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
    sent_at       TIMESTAMP DEFAULT NOW()
) `;
  console.log("Table created (or already exists)");
}
createTable()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err)
        process.exit(1)
    })

module.exports = { createTable };