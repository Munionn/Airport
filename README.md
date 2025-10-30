# Airport Management System (AMS)
Full‑stack monorepo implementing an airport management platform: flights, passengers, aircraft, terminals, tickets, analytics, and admin operations.

## Project Overview
This project is a learning and demonstration system that covers end‑to‑end development:
- PostgreSQL schema design, constraints, triggers and stored procedures
- NestJS backend (REST API)
- React + TypeScript frontend (admin dashboard and user flows)

The focus is on realistic CRUD, domain logic (gates, delays, ticket numbers), and clean integration between DB, backend, and client.

## Monorepo Structure
- `client/` – React + Vite + TypeScript application
- `server/` – NestJS REST API with PostgreSQL
- SQL and docs at repo root (`*.sql`, `*.md`)

## Tech Stack
- Frontend: React, TypeScript, Vite, Tailwind
- Backend: Node.js, NestJS, pg
- Database: PostgreSQL 12+
- Tooling: pnpm/npm, ESLint, Jest (ORM package), curl test scripts

## Key Features Implemented
- Admin Dashboard with real data: flights, passengers, users, aircraft, tickets, revenue snapshot
- Passengers: list, create, update, delete; forms match DB schema
- Users: update routes and forms; protected routes with role checks
- Flights: create/update; status updates; delay handling; gate assignment; cancellation
- Tickets: registration via procedure, seat availability checks, load percentage
- Database triggers/procedures: status auto‑updates, gate auto‑assign/release, ticket number generation
- Robust error handling; removal of invalid `updated_at` references; infinite loop fixes in React hooks

## Recent Work Highlights
- Fixed React blinking screen caused by `useEffect` dependency loops
- Integrated real API calls across admin pages; removed mock data
- Adjusted DTOs and services to align exactly with DB schema
- Flight creation now derives airports from `routes` via `route_id`
- Added procedures/functions in `triggers_and_procedures.sql` and removed unused ones
- Ticket number generator made idempotent and regex‑safe
- SQL window function example to show total tickets alongside rows:
  ```sql
  SELECT *, COUNT(*) OVER() AS total_tickets
  FROM tickets
  ORDER BY ticket_id;
  ```

## Database Artifacts (root)
- `database_schema.md` – entities and relations
- `physical_model_postgresql.sql`, `database-schema.sql` – DDL
- `triggers_and_procedures.sql` – active triggers/procedures used by backend
- `query_pool.sql`, `complex_queries_pool.sql` – example queries
- `test_data_insert.sql`, `demo_examples.sql` – sample data

## Active Triggers/Procedures
Defined in `triggers_and_procedures.sql` and integrated in backend services:
- `update_flight_status()` + `trigger_update_flight_status` (BEFORE UPDATE on `flights`)
- `auto_assign_gate()` + `trigger_auto_assign_gate` (BEFORE INSERT on `flights`)
- `auto_release_gate()` + `trigger_auto_release_gate` (AFTER UPDATE on `flights`)
- `register_passenger_for_flight(passenger_id, flight_id, seat_number, class, user_id)`
- `is_seat_available(flight_id, seat_number)`
- `calculate_flight_load_percentage(flight_id)`
- `generate_ticket_number()` – regex‑safe incremental numbers

## Backend (NestJS)
- Location: `server/`
- Important modules: `flights`, `tickets`, `passengers`, `users`, `auth`, `airports`, `analytics`
- Key files edited:
  - `src/flights/flights.service.ts` – creation via route lookup; status, delay, gate ops; new helpers for registration/seat/load
  - `src/flights/flights.controller.ts` – fixed param passing; added new endpoints
  - `src/passengers/*.ts` – DTO alignment; removed unused fields
  - `src/auth/*.ts` – updates to routes as needed

### Run API
```bash
cd server
pnpm i   # or npm i
pnpm start:dev
```

Environment (example):
```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/airport_management_system
PORT=3000
```

### Quick API checks
```bash
curl http://localhost:3000/flights
curl http://localhost:3000/passengers
```

## Frontend (React)
- Location: `client/`
- Admin pages under `src/pages/admin/*`
- Reusable forms in `src/components/admin/*`
- API clients in `src/api/*`

### Run Web App
```bash
cd client
pnpm i   # or npm i
pnpm dev
```
Vite dev server will print a local URL (default `http://localhost:5173`). Configure API base URL in `client/src/api/index.ts` if needed.

## How to Use: Passengers
- Go to `Admin → Passengers` (`/admin/passengers`)
- Features: list, search, create, edit, delete
- Forms map to DB columns: `first_name`, `last_name`, `date_of_birth`, `gender`, `phone`, `email`, `passport_number`, `nationality`, `special_requirements`
- Backend routes: `GET/POST/PUT/DELETE /passengers` and `GET /passengers/:id`

## Scripts and Utilities
- Root SQL helpers: `setup_postgresql.sh`, `test-booking-flow.js`, `test-ticket-creation.js`
- Server test scripts: `server/test-api.js`, `server/test-booking-flow.js`

## Common Issues Fixed
- Invalid `updated_at` references removed where columns don’t exist
- Controller → Service param mismatches (e.g., flight id) corrected
- Ticket number casting issue fixed with regex extraction
- Window function used for total counts without extra queries

## Getting Started (Database)
1) Create DB and load schema:
```bash
createdb airport_management_system
psql -d airport_management_system -f server/database-schema.sql
psql -d airport_management_system -f triggers_and_procedures.sql
psql -d airport_management_system -f test_data_insert.sql
```
2) Start backend and frontend as above.

## License
For educational purposes; no warranty. Adapt freely for coursework.
