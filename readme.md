# StatusPage

A real-time status page and incident management system. Monitor services, manage incidents, notify subscribers via email, and broadcast live updates over WebSockets.

## Architecture

```
Admin Panel (React)          Public Status Page (React)
      │                              │
      │ POST /api/incidents          │ WebSocket (Socket.IO)
      │                              │
      ▼                              ▼
┌─────────────────────────────────────────┐
│           Express API :3000             │
│                                         │
│  • Saves to PostgreSQL (Neon)           │
│  • Publishes to Redis Pub/Sub           │
│  • Enqueues notification jobs           │
│  • Serves cached /api/status            │
└──────────┬──────────────┬──────────────┘
           │              │
           ▼              ▼
    ┌──────────┐   ┌─────────────────┐
    │  Redis   │   │ PostgreSQL      │
    │          │   │ (Neon)          │
    │ Pub/Sub  │   │                 │
    │ Queue    │   │ services        │
    │ Cache    │   │ incidents       │
    └──────┬───┘   │ subscribers     │
           │       │ subscriptions   │
    ┌──────┴───┐   │ updates         │
    │          │   │ notifications   │
    ▼          ▼   └─────────────────┘
┌────────┐ ┌───────────┐
│ WS     │ │ Worker    │
│ Gate-  │ │ Pool (5x) │
│ way    │ │           │
│        │ │ Sends     │
│ Broad- │ │ emails    │
│ casts  │ │ via SMTP  │
└────────┘ └───────────┘
```

## Tech Stack

| Layer     | Technology                                      |
|-----------|------------------------------------------------|
| Frontend  | React 18, TypeScript, Redux Toolkit, Vite       |
| Backend   | Express 5, Node.js                               |
| Database  | PostgreSQL (Neon serverless)                      |
| Cache     | Redis (ioredis)                                  |
| Queue     | Custom Redis queue with Lua scripts              |
| Realtime  | Socket.IO + Redis Pub/Sub                        |
| Email     | Nodemailer (SMTP)                                |

## Features

- **Service monitoring** — Track services with 4 statuses: `operational`, `degraded`, `partial_outage`, `major_outage`
- **Incident management** — Create incidents, post timeline updates, resolve
- **Real-time updates** — WebSocket gateway broadcasts changes to all connected clients instantly
- **Email notifications** — Subscribers receive emails on incident updates via a Redis-backed worker pool
- **Redis caching** — Public status/history endpoints cached with 60s TTL and automatic invalidation
- **Retry with backoff** — Failed notification jobs retry with exponential backoff + jitter, dead-letter queue for exhausted retries
- **Atomic queue operations** — Lua scripts for transactional enqueue and claim

## Getting Started

### Prerequisites

- Node.js 18+
- Redis server running locally or remotely
- [Neon](https://neon.tech) PostgreSQL database (or any PostgreSQL with the connection string)

### Backend

```bash
cd Backend
npm install
```

Create `src/.env`:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
REDIS_URL=redis://localhost:6379

# SMTP (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Status Page <noreply@example.com>"
```

Start the server:

```bash
cd src
node index.js
```

The server runs on `http://localhost:3000`. On startup it:
1. Creates database tables (if they don't exist)
2. Registers the notification queue
3. Spawns 5 notification workers

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Vite dev server proxies `/api` and `/socket.io` to the backend on port 3000.

## API Endpoints

### Services

| Method | Endpoint             | Description             |
|--------|---------------------|-------------------------|
| GET    | `/api/services`      | List all services       |
| POST   | `/api/services`      | Create a service        |
| GET    | `/api/services/:id`  | Get service by ID       |
| PATCH  | `/api/services/:id`  | Update service          |

### Incidents

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/incidents`                | List all incidents       |
| POST   | `/api/incidents`                | Create an incident       |
| GET    | `/api/incidents/:id`            | Get incident details     |
| PATCH  | `/api/incidents/:id/resolve`    | Resolve an incident      |
| POST   | `/api/incidents/:id/updates`    | Add a timeline update    |

### Subscribers

| Method | Endpoint                       | Description                  |
|--------|-------------------------------|------------------------------|
| POST   | `/api/subscriber`              | Subscribe to a service       |
| GET    | `/api/subscriber/confirm`      | Confirm email (via token)    |
| DELETE | `/api/subscriber/unsubscribe`  | Unsubscribe from a service   |

### Public

| Method | Endpoint        | Description                                    |
|--------|----------------|------------------------------------------------|
| GET    | `/api/status`   | Current status + active incidents (cached)     |
| GET    | `/api/history`  | Past incidents (cached)                        |

## Real-Time Flow

```
Incident created/updated
  → Saved to PostgreSQL
  → Cache invalidated
  → Published to Redis "incident-updates" channel
  → WebSocket gateway broadcasts to all Socket.IO clients
  → Frontend Redux middleware receives event → UI re-renders
  → Notification jobs enqueued for affected subscribers
  → Worker pool claims jobs → sends emails via SMTP
```

## Notification Queue

Built on Redis sorted sets with atomic Lua scripts:

- **Enqueue** (`enqueue.lua`) — Checks queue size, adds job with priority/delay/affinity support
- **Claim** (`claim.lua`) — Atomically pops from ready queue, increments attempts, moves to processing queue with 30s visibility timeout
- **Retry** — Exponential backoff (1s base, 30s cap) with random jitter. Max 3 retries before dead-letter queue
- **Workers** — 5 concurrent workers poll the queue every 500ms

## Project Structure

```
Backend/
├── src/
│   ├── index.js              # Server entry point
│   ├── db.js                 # Neon PostgreSQL client
│   ├── redis.js              # Redis connections
│   ├── migrate.js            # Table creation
│   ├── lua/
│   │   ├── enqueue.lua       # Atomic enqueue script
│   │   └── claim.lua         # Atomic claim script
│   ├── Queue/
│   │   ├── queue.js          # Redis queue implementation
│   │   └── worker.js         # Generic worker
│   ├── routes/
│   │   ├── services.js
│   │   ├── incidents.js
│   │   ├── subscriber.js
│   │   └── public.js
│   ├── services/
│   │   ├── cacheService.js   # Redis cache layer
│   │   ├── incidentService.js
│   │   ├── notificationService.js
│   │   ├── serviceService.js
│   │   ├── subscriberService.js
│   │   ├── publicService.js
│   │   └── transporter.js    # Nodemailer config
│   ├── utils/
│   │   └── backoff.js        # Exponential backoff
│   ├── websocket/
│   │   └── gateway.js        # Socket.IO + Redis Pub/Sub
│   └── worker/
│       └── notificationWorker.js

Frontend/
├── src/
│   ├── App.tsx
│   ├── app/
│   │   ├── store.ts          # Redux store
│   │   └── hooks.ts
│   ├── components/
│   │   ├── ActiveIncidents.tsx
│   │   ├── ServiceList.tsx
│   │   ├── IncidentCard.tsx
│   │   ├── SubscribeForm.tsx
│   │   ├── ConnectionStatus.tsx
│   │   ├── HistoryTimeline.tsx
│   │   ├── Layout.tsx
│   │   ├── AdminLayout.tsx
│   │   └── Toast.tsx
│   ├── features/
│   │   ├── incidents/incidentsSlice.ts
│   │   ├── services/servicesSlice.ts
│   │   └── websocket/
│   │       ├── websocketMiddleware.ts
│   │       └── websocketSlice.ts
│   ├── pages/
│   │   ├── StatusPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminCreateIncident.tsx
│   │   ├── AdminIncidentDetail.tsx
│   │   └── AdminServices.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── socket.ts
│   └── types/
│       └── index.ts
```