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

## Code Quality & Linting

This project uses ESLint for code quality and consistency. ESLint is configured for TypeScript with recommended rules for Node.js/Express development.

### Running ESLint

Check for linting errors:

```bash
npm run lint
```

Auto-fix linting errors where possible:

```bash
npm run lint:fix
```

### ESLint Configuration

- Configuration file: `eslint.config.mjs`
- Ignored files: `dist/`, `node_modules/`, `migrations/`, config files
- Rules enforce:
  - TypeScript best practices
  - Code quality standards
  - Consistent code style (semicolons, quotes, indentation)
  - Best practices (strict equality, error handling, etc.)

### Pre-commit Linting

It's recommended to run `npm run lint` before committing code. Consider setting up a pre-commit hook (e.g., with husky) to automatically run linting.

## Testing

This project uses **Jest** and **Supertest** for API endpoint testing. All tests are located in `src/__tests__/`.

### Test Setup

**Important:** Tests require a separate test database or will use the same database as development. Make sure your database is set up and migrations are applied before running tests.

1. **Test Environment Variables** (Optional but recommended):
   
   Create a `.env.test` file for test-specific configuration:
   
   ```env
   NODE_ENV=test
   DB_NAME=caridatracker_test
   DB_USER=postgres
   DB_PASSWORD=your_password
   JWT_SECRET=test_secret_key
   ```
   
   If `.env.test` doesn't exist, tests will use your regular `.env` file.

2. **Test Database Setup:**
   
   Ensure your test database exists and migrations are applied:
   
   ```bash
   # Create test database (if using separate DB)
   createdb caridatracker_test
   
   # Apply migrations to test database
   # (Update DB_NAME in .env.test first)
   npm run migrate:up
   ```

### Running Tests

**Run all tests:**
```bash
npm test
```

**Run tests in watch mode** (automatically re-runs on file changes):
```bash
npm run test:watch
```

**Run tests with coverage report:**
```bash
npm run test:coverage
```

**Run a specific test file:**
```bash
npm test -- src/__tests__/auth.test.ts
```

**Run tests matching a pattern:**
```bash
npm test -- --testNamePattern="should register"
```

### Test Files

Current test coverage includes:

- ✅ `health.test.ts` - Health check endpoint
- ✅ `auth.test.ts` - Authentication endpoints (register, login, me)
- ✅ `troops.test.ts` - Troops CRUD operations
- ✅ `attendance.test.ts` - Attendance endpoints (sign up, cancel, list)
- ✅ `clubs.test.ts` - Club endpoints
- ✅ `organizations.test.ts` - Organization endpoints

### Test Structure

Tests use helper functions from `src/__tests__/helpers.ts`:

- `testRequest()` - Make unauthenticated API requests
- `createTestUser(options?)` - Create a test user and return auth token
- `authRequest(token)` - Make authenticated API requests
- `cleanupTestData()` - Clean up test data from database
- `closeDatabase()` - Close database connection

**Example test:**
```typescript
import { testRequest, createTestUser, authRequest } from './helpers';

describe('My API', () => {
  it('should do something', async () => {
    const user = await createTestUser();
    const response = await authRequest(user.token)
      .get('/api/endpoint');
    
    expect(response.status).toBe(200);
  });
});
```

### Test Configuration

- **Test Framework:** Jest with ts-jest preset
- **Test Environment:** Node.js
- **Test Location:** `src/__tests__/**/*.test.ts`
- **Setup File:** `src/__tests__/setup.ts` (loads test environment, sets timeout)
- **Coverage:** Excludes type definitions and server entry point

### Important Notes

1. **Database Cleanup:** Tests automatically clean up test data (users with `@test.com` emails, test troops, etc.) but be aware that tests may create temporary data.

2. **Test Isolation:** Each test file should clean up after itself using `cleanupTestData()` in `afterAll` hooks.

3. **Authentication:** Use `createTestUser()` helper to create authenticated test users. The helper returns a token that can be used with `authRequest()`.

4. **Test Timeout:** Default timeout is 10 seconds (configured in `setup.ts`). Increase if needed for slow database operations.

5. **Running in WSL:** If developing on Windows with WSL, run tests from within WSL to ensure proper database connectivity:
   ```bash
   cd /mnt/c/Users/riche/Development/CaridaTracker-api
   npm test
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
