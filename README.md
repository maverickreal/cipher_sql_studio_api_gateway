# CipherSqlStudio API Gateway

REST API backend for the [CipherSqlStudio](../cipher_sql_studio) online SQL learning platform. Handles assignment management, SQL execution job dispatch via BullMQ, and admin operations.

### **_I M P O R T A N T_** note for developers:

To test/run the entire backend locally, all you need do is:

1. Clone all the project repos:
   - https://github.com/maverickreal/cipher_sql_studio
   - https://github.com/maverickreal/cipher_sql_studio_sandbox
   - https://github.com/maverickreal/cipher_sql_studio_api_gateway
2. Run the following shell code, from within the orchestrator repo (cipher_sql_studio):
   ```sh
   chmod u+x ./init.dev.bash;
   ./init.dev.bash;
   ```
3. The postman collection file is present in the root dir of this project.

## Tech Stack

| Technology           | Purpose                                |
| -------------------- | -------------------------------------- |
| Node.js 22           | Runtime                                |
| TypeScript           | Language                               |
| Express.js 5.2       | HTTP framework                         |
| MongoDB / Mongoose 9 | Assignment metadata storage            |
| Redis                | Caching (10-min TTL) and rate limiting |
| BullMQ 5             | Job queue for SQL execution dispatch   |
| Zod 4                | Request validation                     |
| Pino                 | Structured logging                     |
| Helmet               | HTTP security headers                  |
| Vitest               | Testing                                |
| ESLint + Prettier    | Code quality and formatting            |

## Prerequisites

- Node.js 22+
- Running MongoDB, Redis, and PostgreSQL instances (or use the parent [cipher_sql_studio](../cipher_sql_studio) Docker Compose setup)

## Getting Started

### 1. Install Dependencies

```bash
npm ci
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in all values. See [Environment Variables](#environment-variables).

### 3. Run in Development

```bash
npm run dev
```

Starts the server with `nodemon` for automatic restarts on file changes.

### 4. Build and Run for Production

```bash
npm run build
npm run start
```

### Docker

```bash
docker build -t cipher-sql-studio-api-gateway .
docker run -p 8000:8000 --env-file .env cipher-sql-studio-api-gateway
```

The production image uses a multi-stage build and only includes compiled JavaScript with production dependencies.

## API Endpoints

### Public

| Method | Endpoint                                                 | Description                                  | Rate Limit |
| ------ | -------------------------------------------------------- | -------------------------------------------- | ---------- |
| `GET`  | `/api/v1/assignments`                                    | List all assignments (paginated, compressed) | 100/min    |
| `GET`  | `/api/v1/assignments/:id`                                | Get a single assignment by ID                | 100/min    |
| `POST` | `/api/v1/assignments/client-sql-code-run/execute`        | Submit SQL for execution (returns job ID)    | 10/min     |
| `GET`  | `/api/v1/assignments/client-sql-code-run/status/:taskId` | Poll job execution status and results        | 100/min    |

### Admin

| Method | Endpoint                    | Description                                       |
| ------ | --------------------------- | ------------------------------------------------- |
| `POST` | `/api/v1/admin/assignments` | Create a new assignment (triggers schema seeding) |

### Internal (Service-to-Service)

Authenticated via `x-internal-api-key` header.

| Method  | Endpoint                | Description                                     |
| ------- | ----------------------- | ----------------------------------------------- |
| `PATCH` | `/internal/confirm/:id` | Sandbox confirms assignment schema is ready     |
| `POST`  | `/internal/cleanup/:id` | Sandbox requests cleanup of a failed assignment |

## Environment Variables

| Variable                | Description                            | Example                                                |
| ----------------------- | -------------------------------------- | ------------------------------------------------------ |
| `CLIENT_URL`            | Allowed CORS origin                    | `http://localhost:3000`                                |
| `SERVER_PORT`           | Port the API listens on                | `8000`                                                 |
| `MONGO_URI`             | MongoDB connection string              | `mongodb://user:pass@localhost:27017/db?authSource=db` |
| `REDIS_URL`             | Redis connection URL                   | `redis://:password@localhost:6379`                     |
| `ENV_MODE`              | Environment mode                       | `DEV`, `STAGING`, `PROD`                               |
| `LOG_LEVEL`             | Pino log level                         | `info`                                                 |
| `LOG_DIR`               | Directory for log file output          | `/var/log/cipher_sql_studio`                           |
| `BULLMQ_SQL_QUEUE_NAME` | BullMQ queue name (must match sandbox) | `sql_exec_queue`                                       |
| `INTERNAL_API_KEY`      | Shared key for internal service auth   | --                                                     |

## Scripts

| Command              | Description                           |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Start dev server with nodemon         |
| `npm run build`      | Compile TypeScript to `dist/`         |
| `npm run start`      | Run compiled output (`dist/index.js`) |
| `npm run test`       | Run tests with Vitest                 |
| `npm run test:watch` | Run tests in watch mode               |
| `npm run lint`       | Lint source files with ESLint         |
| `npm run format`     | Format source files with Prettier     |

## Project Structure

```
src/
├── index.ts                    # Server bootstrap and graceful shutdown
├── app.ts                      # Express app setup (middleware chain)
├── config/
│   ├── env/                    # Environment variable parsing (Zod)
│   └── log/                    # Pino logger configuration
├── routes/
│   ├── api/v1/
│   │   ├── assignments/        # GET assignments, GET :id
│   │   │   └── execution/      # POST execute, GET status/:taskId
│   │   └── admin/              # POST create assignment
│   └── internal/               # PATCH confirm, POST cleanup
├── controllers/
│   ├── assignment/             # Assignment retrieval logic
│   ├── compiler/               # SQL execution job dispatch
│   ├── job/                    # Job status polling
│   ├── admin/                  # Assignment creation
│   └── internal/               # Schema confirm/cleanup handlers
├── services/
│   ├── assignment_cache/       # Redis caching layer for assignments
│   └── job_queue/              # BullMQ queue producer
├── data/
│   ├── cache/                  # Redis client
│   └── db/
│       ├── client/             # MongoDB/Mongoose connection
│       └── models/             # Mongoose schemas (Assignment, AssignmentSolution)
├── middleware/
│   ├── rate_limiter/           # Global (100/min) and execute (10/min) rate limits
│   ├── internal_auth/          # x-internal-api-key validation
│   ├── validate_objectid/      # MongoDB ObjectId parameter validation
│   ├── error_handler/          # Centralized error handling
│   └── api/
│       ├── api_compression/    # Response compression (level 6, 1KB threshold)
│       └── api_logger/         # Pino HTTP request logging
├── types/                      # Shared TypeScript interfaces
├── utils/
│   ├── constants/              # App-wide constants and enums
│   └── helpers/                # Utility functions
└── __tests__/
    ├── integration/            # API integration tests
    └── e2e/                    # End-to-end execution tests
```

## Key Design Details

- **Rate Limiting**: Backed by Redis. Global limit of 100 requests/minute. SQL execution endpoint limited to 10 requests/minute.
- **Caching**: Assignment data cached in Redis with a 600-second (10-minute) TTL. Cache keys prefixed with `client_sql_code_assignment:`.
- **Job Queue**: SQL execution requests are dispatched as BullMQ jobs. Job results have a 600-second TTL. The sandbox worker processes jobs asynchronously.
- **Pagination**: Default page size of 20, maximum of 100.
- **Request Body**: Limited to 1MB. User SQL code limited to 5,000 characters.
- **Compression**: Responses larger than 1KB are compressed at zlib level 6.
