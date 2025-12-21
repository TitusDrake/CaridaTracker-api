# CaridaTracker API

Node.js REST API for CaridaTracker mobile application.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Validation:** express-validator

## Security Features

- Helmet.js for security headers
- CORS protection
- Rate limiting
- Input validation and sanitization
- Bcrypt password hashing (10 salt rounds)
- JWT token-based authentication

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Create a PostgreSQL database:

```bash
createdb caridatracker
```

Run the schema:

```bash
psql -d caridatracker -f database/schema.sql
```

**OR** use migrations (recommended):

```bash
npm run migrate:up
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=caridatracker
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:8081
```

**IMPORTANT:** Change `JWT_SECRET` to a strong random string in production!

### 4. Run the Server

Development mode (with hot reload):

```bash
npm run dev
```

Production mode:

```bash
npm run build
npm start
```

## API Endpoints

### Health Check

```
GET /health
```

Returns server status.

### Authentication

#### Register

```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User

```
GET /api/auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "username"
}
```

## Project Structure

```
CaridaTracker-api/
├── src/
│   ├── config/          # Database and app configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware (auth, etc.)
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions (JWT, etc.)
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── database/
│   ├── schema.sql       # Database schema (reference)
│   └── migrations/      # Database migration files
├── migrations/          # Database migration files (node-pg-migrate)
├── .env.example         # Example environment variables
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Validation Rules

### Registration
- Email: Must be valid email format
- Username: 3-30 characters, alphanumeric and underscores only
- Password: Minimum 8 characters

### Login
- Email: Must be valid email format
- Password: Required

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

Or for validation errors:

```json
{
  "errors": [
    {
      "msg": "Error message",
      "param": "fieldName",
      "location": "body"
    }
  ]
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP address on `/api/*` routes

## Database Migrations

This project uses `node-pg-migrate` for database schema management. Migrations are tracked automatically, ensuring only new migrations are applied.

### Create a New Migration

```bash
npm run migrate:create <migration-name>
```

Example:
```bash
npm run migrate:create add-user-profile-fields
```

This creates a new migration file in the `migrations/` directory with the current timestamp.

### Apply Migrations

Apply all pending migrations:

```bash
npm run migrate:up
```

Apply a specific number of migrations:

```bash
npm run migrate:up 1
```

### Rollback Migrations

Rollback the last migration:

```bash
npm run migrate:down
```

Rollback multiple migrations:

```bash
npm run migrate:down 2
```

### Migration File Structure

Migration files use CommonJS exports with `up` and `down` functions:

```javascript
exports.up = (pgm) => {
  // Apply changes (create tables, add columns, etc.)
  pgm.createTable('my_table', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });
};

exports.down = (pgm) => {
  // Revert changes
  pgm.dropTable('my_table');
};
```

### Migration Best Practices

- Always write both `up` and `down` functions
- Test migrations in development before applying to production
- Keep migrations small and focused on a single change
- Never modify existing migrations that have been applied to production
- Use descriptive names for migrations

### Migration Tracking

Applied migrations are tracked in the `pgmigrations` table. Don't modify this table manually.

## Development

Run in development mode with auto-reload:

```bash
npm run dev
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Set up proper PostgreSQL credentials
4. Build the TypeScript:
   ```bash
   npm run build
   ```
5. Run the production server:
   ```bash
   npm start
   ```

## License

ISC
