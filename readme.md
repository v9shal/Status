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



Phase 3 — Notification Pipeline
  ✅ notificationWorker.js — claims jobs, sends emails
  ✅ notificationService.js — nodemailer setup
  ☐ Test full flow: create incident → email received


## Notification Worker

The notification worker (`src/worker/notificationWorker.js`) is the processor function passed to a `Worker` instance. It handles notification jobs claimed from the `notifications` queue.

### What it does

1. **Receives a job** — The generic `Worker` class claims a job from Redis and passes it to the notification worker. The job payload contains: `email`, `subscriberId`, `incidentId`, `incidentTitle`, `description`, `status`, and `serviceId`.

2. **Sends an email** — Uses `notificationService` (nodemailer) to send an email to the subscriber with incident details (title, description, current status, which service is affected).

3. **Succeeds or fails** — If the email sends successfully, the `Worker` calls `queue.complete(jobId)` which removes the job from the processing queue and deletes the job hash from Redis. If it throws, the `Worker` calls `queue.fail(job)` which triggers the retry/DLQ logic.

### Retry behavior (handled by Queue, not the worker)

- On failure, the job is requeued to the delayed queue with exponential backoff (`backoff.js`: base 1s, cap 30s, with jitter).
- `claim.lua` increments `attempts` each time the job is claimed.
- When `attempts >= maxRetries`, the job is sent to the dead-letter queue (`failedQueue`) instead of being retried.

### Where it runs

- Instantiated in `index.js` inside the `server.listen` callback.
- Multiple workers can run concurrently (loop in same process) or across multiple server instances (horizontal scaling). All workers share the same Redis queue — `claim.lua` guarantees atomic job assignment.

### Flow

```
incidentService.js                    Redis                        notificationWorker.js
       |                                |                                  |
       |-- enqueue(payload) ----------->|  ZADD readyQueue                 |
       |                                |                                  |
       |                                |<--- Worker.start() polls --------|
       |                                |                                  |
       |                                |-- claim.lua (atomic) ----------->|
       |                                |   ZPOPMIN + HINCRBY attempts     |
       |                                |                                  |
       |                                |                   process(job) --|
       |                                |                   send email     |
       |                                |                                  |
       |                                |<-- complete(jobId) --------------|
       |                                |   ZREM processingQueue           |
       |                                |   DEL job:{id}                   |
```

Phase 4 — Subscribers
  ☐ routes/subscribers.js — subscribe, confirm, unsubscribe
  ☐ services/subscriberService.js — DB logic
  ☐ Confirmation email with token
  ☐ Test: subscribe → confirm → create incident → email received

Phase 5 — Public Status Page API
  ✅ routes/public.js — GET /api/status, GET /api/history
  ✅ Redis cache for /api/status
  ✅ Cache invalidation on incident update

Phase 6 — React Frontend
  
  ### 6.1 — Project Setup
  ☐ Create React app with Vite (`npm create vite@latest frontend -- --template react`)
  ☐ Install dependencies: `@reduxjs/toolkit`, `react-redux`, `socket.io-client`, `react-router-dom`, `axios`
  ☐ Set up folder structure: `src/app/`, `src/features/`, `src/components/`, `src/pages/`, `src/services/`
  ☐ Configure Vite proxy to forward `/api` and `/socket.io` to `http://localhost:3000`

  ### 6.2 — Redux Toolkit Store
  ☐ Create `src/app/store.js` — configure store with middleware
  ☐ Create `src/features/services/servicesSlice.js` — state: services list, status per service
  ☐ Create `src/features/incidents/incidentsSlice.js` — state: active incidents, history
  ☐ Create `src/features/websocket/websocketSlice.js` — state: connection status (connected/disconnected/reconnecting)
  ☐ Add async thunks: `fetchStatus`, `fetchHistory`, `fetchIncidentById`
  ☐ Wrap `<App>` with `<Provider store={store}>`

  ### 6.3 — API Service Layer
  ☐ Create `src/services/api.js` — axios instance with baseURL `/api`
  ☐ Add functions: `getStatus()`, `getHistory()`, `getIncidentById(id)`
  ☐ Add admin functions: `createIncident(data)`, `patchIncident(id, data)`, `createService(data)`, `updateService(id, data)`
  ☐ Add subscriber functions: `subscribe(email, serviceId)`, `unsubscribe(email, serviceId)`

  ### 6.4 — WebSocket Integration
  ☐ Create `src/services/socket.js` — socket.io-client instance connecting to `/` namespace
  ☐ Create `src/features/websocket/websocketMiddleware.js` — Redux middleware that:
      - On store init → connect socket
      - On `incident-updates` event → dispatch `incidentsSlice.actions.realTimeUpdate(payload)`
      - On `connect` → dispatch `websocketSlice.actions.connected()`
      - On `disconnect` → dispatch `websocketSlice.actions.disconnected()`
      - On `reconnect` → re-fetch status via `fetchStatus` thunk
  ☐ Register middleware in `store.js`
  ☐ Add connection status indicator component (green dot = connected, yellow = reconnecting, red = disconnected)

  ### 6.5 — Public Status Page
  ☐ Create `src/pages/StatusPage.jsx` — main public page
  ☐ Component: `ServiceList` — renders each service with colored status badge (operational/degraded/major outage)
  ☐ Component: `ActiveIncidents` — list of unresolved incidents with timeline
  ☐ Component: `IncidentCard` — title, status badge, description, timestamps
  ☐ Component: `SubscribeForm` — email input + service multi-select, calls `POST /api/subscriber`
  ☐ On mount → dispatch `fetchStatus` thunk
  ☐ On WebSocket `incident-updates` → update incident list in real-time (no page refresh)

  ### 6.6 — Incident History Page
  ☐ Create `src/pages/HistoryPage.jsx` — past 90 days of incidents
  ☐ Group incidents by date
  ☐ Component: `HistoryTimeline` — vertical timeline with incident cards
  ☐ On mount → dispatch `fetchHistory` thunk

  ### 6.7 — Admin Panel
  ☐ Create `src/pages/AdminDashboard.jsx` — overview of services + incidents
  ☐ Create `src/pages/AdminCreateIncident.jsx` — form: select service, title, description → POST /api/incidents
  ☐ Create `src/pages/AdminIncidentDetail.jsx` — post timeline updates, change status, resolve
  ☐ Create `src/pages/AdminServices.jsx` — create/edit services, change status
  ☐ Add basic route guards (can be simple localStorage flag for now, real auth is Phase 7+)

  ### 6.8 — Routing
  ☐ Set up `react-router-dom` routes:
      - `/` → StatusPage
      - `/history` → HistoryPage
      - `/admin` → AdminDashboard
      - `/admin/incidents/new` → AdminCreateIncident
      - `/admin/incidents/:id` → AdminIncidentDetail
      - `/admin/services` → AdminServices
  ☐ Create `src/components/Layout.jsx` — shared nav bar, footer
  ☐ Create `src/components/AdminLayout.jsx` — admin-specific sidebar nav

  ### 6.9 — Real-Time UX
  ☐ When WebSocket receives `incident-updates` → show toast/notification in the UI
  ☐ Animate incident status badge transitions (investigating → identified → resolved)
  ☐ Auto-scroll to new timeline entries on incident detail page
  ☐ Add optimistic updates on admin actions (show change immediately, revert on error)

Phase 7 — Polish
  ☐ Circuit breaker on SMTP calls
  ☐ k6 load test
  ☐ Measure cache hit rate
  ☐ README with architecture diagram