# Med-Connect
Med-Connect is a secure, cross-platform healthcare platform that gives patients ownership of their medical history while enabling healthcare professionals to access patient data securely and on demand.

This repository contains the backend API (in `MedConnect-Back`) and a frontend (in `MedConnect-Front`). This README documents how to get the backend running locally and the REST + WebSocket APIs it exposes.

**Repository layout**
- `MedConnect-Back/`: TypeScript Express backend (APIs, services, DB config, scripts)
- `MedConnect-Front/`: Frontend app (mobile/web client)

**Quick links**
- Backend server code: MedConnect-Back
- DB setup scripts: MedConnect-Back/scripts/mysql_setup.sql and MedConnect-Back/scripts/mongodb_setup.js

## Quick start (backend)

1. Clone the repo:

	 git clone <repository-url> && cd MedConnect-Back

2. Install dependencies:

	 npm install

3. Create an `.env` file at the project root (see example below).

4. Start in development mode:

	 npm run dev

5. Production build:

	 npm run build
	 npm start

The backend runs on `PORT` from `.env` (default `3000`) and serves APIs under `/api/<API_VERSION>` (default `v1`).

Example base URL:

```
http://localhost:3000/api/v1
```

## Required environment variables (.env example)

Create a file named `.env` with at least the following variables (adjust values to your environment):

```
PORT=3000
NODE_ENV=development
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000,http://localhost:19006
JWT_SECRET=super_secret_jwt_key
JWT_EXPIRE=7d
MONGODB_URI=mongodb://localhost:27017/medconnect
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=medconnect
UPLOAD_DIR=./uploads
BASE_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=example@example.com
SMTP_PASS=your_smtp_password
FRONTEND_URL=http://localhost:19006
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## Database setup

- MySQL: run `MedConnect-Back/scripts/mysql_setup.sql` to create the required schema and sample data.
- MongoDB: a helper script is at `MedConnect-Back/scripts/mongodb_setup.js` — or simply start your MongoDB instance and set `MONGODB_URI`.

## How the server is structured

- Entry: `MedConnect-Back/src/server.ts`
- App config and routes: `MedConnect-Back/src/app.ts`
- Routes are grouped in `MedConnect-Back/src/routes`
- Controllers, services, and repositories implement the business logic in `src/controllers`, `src/services`, and `src/repositories` respectively

## REST API reference (base: `/api/{version}`)

Default version: `v1` (change via `API_VERSION` env).

Notes: `authenticate` means bearer JWT required. Where a role is listed, the JWT must carry that role.

- **Auth** (`/api/{v}/auth`)
	- POST `/register/patient` — Register a patient (public)
	- POST `/register/doctor` — Register a doctor (public)
	- POST `/login` — Login and receive JWT (public)
	- POST `/logout` — Logout (authenticated)
	- GET `/me` — Get current authenticated user (authenticated)
	- PUT `/change-password` — Change password (authenticated)

- **Patients** (`/api/{v}/patients`)
	- GET `/profile` — Get own profile (authenticated, patient)
	- PUT `/profile` — Update own profile (authenticated, patient)
	- DELETE `/profile` — Delete own profile (authenticated, patient)
	- GET `/` — Get all patients (admin)

- **Doctors** (`/api/{v}/doctors`)
	- GET `/search` — Search doctors (authenticated)
	- GET `/` — Get all doctors (authenticated)
	- GET `/profile` — Get own profile (authenticated, doctor)
	- PUT `/profile` — Update own profile (authenticated, doctor)
	- DELETE `/profile` — Delete own profile (authenticated, doctor)
	- PUT `/:doctorId/verify` — Verify a doctor (admin)

- **Doctor ratings** (`/api/{v}/doctors`) — rating endpoints are mounted on the doctors route
	- POST `/:doctorUserId/rate` — Rate a doctor (authenticated, patient)
	- GET `/:doctorUserId/ratings` — Get all ratings for a doctor (authenticated)
	- GET `/:doctorUserId/my-rating` — Get current patient's rating for doctor (authenticated, patient)

- **Records** (`/api/{v}/records`) (patient-only routes)
	- POST `/upload` — Upload a medical record (authenticated, patient), form field `file`
	- GET `/` — List own records (authenticated, patient)
	- GET `/search` — Search own records (authenticated, patient)
	- GET `/:recordId` — Get a record by id (authenticated)
	- PUT `/:recordId` — Update record metadata (authenticated, patient)
	- DELETE `/:recordId` — Delete a record (authenticated, patient)

- **Profile picture** (`/api/{v}/profile-picture`)
	- POST `/upload` — Upload profile picture (authenticated), form field `profile_picture`
	- DELETE `/` — Delete profile picture (authenticated)

- **Prescriptions** (`/api/{v}/prescriptions`)
	- POST `/` — Create prescription (authenticated, doctor)
	- GET `/` — Get my prescriptions (authenticated)
	- GET `/:prescriptionId` — Get a prescription (authenticated)
	- PUT `/:prescriptionId/status` — Update prescription status (authenticated, doctor)

- **Appointments** (`/api/{v}/appointments`)
	- POST `/` — Create appointment (authenticated, patient)
	- GET `/` — Get my appointments (authenticated)
	- GET `/:appointmentId` — Get appointment by id (authenticated)
	- PUT `/:appointmentId/status` — Update appointment status (authenticated)
	- PUT `/:appointmentId/reschedule` — Reschedule appointment (authenticated)
	- DELETE `/:appointmentId` — Cancel appointment (authenticated)

- **Password reset** (`/api/{v}/password-reset`)
	- POST `/request` — Request password reset (public)
	- POST `/reset` — Reset password with token (public)

- **Connections** (`/api/{v}/connections`)
	- POST `/request` — Patient requests connection to a doctor (authenticated, patient)
	- POST `/:connectionId/share` — Share selected records (authenticated, patient)
	- POST `/:connectionId/unshare` — Unshare selected records (authenticated, patient)
	- POST `/:connectionId/share-all` — Share all records with connection (authenticated, patient)
	- PUT `/:connectionId/approve` — Doctor approves connection (authenticated, doctor)
	- PUT `/:connectionId/reject` — Doctor rejects connection (authenticated, doctor)
	- PUT `/:connectionId/revoke` — Doctor revokes connection (authenticated, doctor)
	- GET `/patient/:patientUserId/records` — Doctor views patient records (authenticated, doctor)
	- GET `/` — Get my connections (authenticated)
	- GET `/:connectionId/shared-records` — Get records shared within a connection (authenticated)

- **Messages** (`/api/{v}/messages`)
	- POST `/` — Send a message (authenticated)
	- GET `/conversations` — Get conversations list (authenticated)
	- GET `/conversations/:userId` — Get a conversation with a user (authenticated)
	- PUT `/conversations/:userId/read` — Mark conversation read (authenticated)
	- GET `/unread-count` — Get unread message count (authenticated)

## WebSocket / Real-time messaging

The backend initializes a Socket.io server alongside the HTTP server. Use the same host/port as the API (e.g. `http://localhost:3000`). Authenticate the socket handshake by providing a valid JWT token either as `auth: { token: '<JWT>' }` when connecting or in the `Authorization: Bearer <JWT>` header.

Events (examples):
- `connected` — Emitted by server on successful connection
- `online_users` — Server sends an array of online user IDs
- `user_online` / `user_offline` — Broadcast on user connect/disconnect
- `send_message` — Client to server to send: `{ receiver_id, message_content }`
- `receive_message` — Server -> receiver with the message payload
- `message_sent` — Server -> sender confirmation
- `typing` / `stop_typing` — Typing indicators
- `mark_as_read` — Client requests marking conversation as read; server may emit `messages_read` to sender

Refer to `MedConnect-Back/src/utils/socketHandler.ts` for details.

## Files of interest
- App entry: `MedConnect-Back/src/server.ts`
- Route definitions: `MedConnect-Back/src/routes/*` (Auth, Patients, Doctors, Records, etc.)
- DB config: `MedConnect-Back/src/config/mysql.ts`, `MedConnect-Back/src/config/mongodb.ts`
- Uploads/public: `MedConnect-Back/uploads/`, `MedConnect-Back/public/`

## Running & testing tips
- Use `npm run dev` to run with `ts-node` and hot reload via `nodemon`.
- The API health check: `GET /health` (no auth)
- Use tools like Postman or HTTPie to call the endpoints. Include `Authorization: Bearer <token>` for protected routes.

## Contributing / next steps
- If you're adding endpoints, follow the existing structure: `routes` → `controllers` → `services` → `repositories`.
- Run `npm run typecheck` before pushing code.

If you'd like, I can also:
- Add a `README` specifically for `MedConnect-Back` with a `.env.example` file.
- Generate an OpenAPI (Swagger) spec from the routes.

---
Last updated: polished README with API list and startup instructions.

