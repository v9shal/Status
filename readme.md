Admin Panel (React)          Public Status Page (React)
      |                              |
      | POST /api/incidents          | WebSocket connection
      |                              |
      ▼                              ▼
┌─────────────────────────────────────────┐
│           Express API :3000             │
│                                         │
│  - saves to PostgreSQL                  │
│  - publishes to Redis Pub/Sub           │
│  - enqueues notification jobs           │
│  - serves cached /api/status            │
└──────────┬──────────────┬──────────────┘
           │              │
           ▼              ▼
    ┌──────────┐   ┌─────────────────┐
    │  Redis   │   │   PostgreSQL    │
    │          │   │                 │
    │ Pub/Sub  │   │ incidents       │
    │ Queue    │   │ services        │
    │ Cache    │   │ subscribers     │
    └──────┬───┘   └─────────────────┘
           │
    ┌──────┴────────────────┐
    │                       │
    ▼                       ▼
┌──────────────┐   ┌─────────────────┐
│  WebSocket   │   │  Notification   │
│  Gateway     │   │  Worker         │
│              │   │                 │
│ broadcasts   │   │ sends emails    │
│ to browsers  │   │ to subscribers  │
└──────────────┘   └─────────────────┘


routes:

POST /api/incident - creates the incident in the db 
GET /api/incident - gets all the incident from the db (Paginated)
GET /api/incident/:id - gets a particular incident and all its details
PATCH /api/incident/:id - update the status or any details about the incident (auth needed)
PATCH /api/incidents/:id/resolve — resolve incident

//services
GET /api/services - list all the services
POST /api/services - create a new service
PATCH /api/service/:id - update the status of the service ()

//subscriber
POST /api/subscribers — subscribe email, send confirmation
GET /api/subscribers/confirm — confirm subscription via token
DELETE /api/subscribers/unsubscribe — unsubscribe


// public routes 
GET /api/status — current status of all services + active incidents, Redis cached
GET /api/history — past 90 days of incidents


statuspage/
├── src/
│   ├── index.js
│   ├── db.js
│   ├── redis.js
│   ├── migrate.js
│   ├── circuitBreaker.js
│   │
│   ├── queue/
│   │   ├── Queue.js
│   │   ├── Worker.js
│   │   └── scripts/
│   │       └── claim.lua
│   │
│   ├── routes/
│   │   ├── services.js
│   │   ├── incidents.js
│   │   ├── subscribers.js
│   │   └── public.js
│   │
│   ├── services/
│   │   ├── incidentService.js
│   │   ├── notificationService.js
│   │   └── cacheService.js
│   │
│   ├── workers/
│   │   └── notificationWorker.js
│   │
│   └── websocket/
│       └── gateway.js
│
├── .env
├── .env.example
├── package.json
└── README.md