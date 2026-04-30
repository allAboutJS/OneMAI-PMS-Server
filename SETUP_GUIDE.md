# Setup & Installation Guide

## Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
  - Or use **MongoDB Atlas** (Cloud): https://www.mongodb.com/cloud/atlas

---

## Installation Steps

### 1. Clone/Extract Project

```bash
# If using git
git clone <repository-url>
cd project-management-backend

# Or extract the files if downloaded as zip
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json`:
- express
- mongoose
- jsonwebtoken
- bcryptjs
- dotenv
- express-validator

### 3. Setup Environment Variables

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/project-management
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/project-management

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Email (stub for now)
EMAIL_FROM=noreply@projectmanagement.com
FRONTEND_URL=http://localhost:3000
```

### 4. Setup MongoDB

**Option A: Local MongoDB**

```bash
# On macOS (with Homebrew)
brew services start mongodb-community

# On Windows
# Start MongoDB service from Services app, or:
# "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"

# On Linux
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a cluster
4. Get connection string
5. Update `.env` with connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/project-management
   ```

### 5. Start the Server

```bash
# Development with auto-reload
npm run dev

# Or production
npm start
```

**Expected output:**
```
╔════════════════════════════════════════════════════════╗
║   Project Management System - Backend Server           ║
╠════════════════════════════════════════════════════════╣
║ Status:      ✓ Running                                 ║
║ Port:        5000                                       ║
║ Environment: development                               ║
║ Database:    MongoDB                                   ║
╚════════════════════════════════════════════════════════╝

Available endpoints:
  - Health Check:   GET  http://localhost:5000/health
  - API Docs:       GET  http://localhost:5000/api/docs
  - Auth:           POST http://localhost:5000/api/auth/login
  - Tasks:          GET  http://localhost:5000/api/tasks
  - Reports:        GET  http://localhost:5000/api/reports/summary
```

---

## Verify Installation

### 1. Health Check

```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. API Docs

```bash
curl http://localhost:5000/api/docs
```

### 3. Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User"
  }'
```

---

## Project Structure

```
project-management-backend/
│
├── src/
│   ├── config/
│   │   ├── database.js              # MongoDB connection
│   │   └── environment.js           # Env variables
│   │
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   └── Task.js                  # Task schema
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   ├── rbac.js                  # Role-based access control
│   │   └── errorHandler.js          # Error handling
│   │
│   ├── controllers/
│   │   ├── authController.js        # Auth logic
│   │   ├── taskController.js        # Task CRUD
│   │   ├── assignmentController.js  # Task assignment
│   │   └── reportController.js      # Reporting
│   │
│   ├── routes/
│   │   ├── authRoutes.js            # Auth endpoints
│   │   └── taskRoutes.js            # Task endpoints
│   │
│   ├── utils/
│   │   ├── validators.js            # Input validation
│   │   ├── errorHandler.js          # Error classes
│   │   └── emailService.js          # Email stub
│   │
│   └── app.js                       # Express setup
│
├── server.js                        # Entry point
├── package.json                     # Dependencies
├── .env.example                     # Env template
└── .gitignore
```

---

## Development Workflow

### Running Tests

Currently no test suite included. To add tests:

```bash
npm install --save-dev jest supertest
```

Create test files in `tests/` directory and update `package.json`:
```json
{
  "scripts": {
    "test": "jest --watch"
  }
}
```

### Code Quality

Consider adding:

```bash
npm install --save-dev eslint prettier
npx eslint --init
```

### Debugging

Enable detailed logging in development:

```env
NODE_ENV=development
DEBUG=*
```

Use VS Code debugger:

1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/server.js"
    }
  ]
}
```

2. Set breakpoints and run debugger

---

## Common Issues & Solutions

### Error: "MONGODB_URI is not defined"

**Solution:** Create `.env` file with `MONGODB_URI=...`

### Error: "connection refused"

**Solution:** Ensure MongoDB is running
```bash
# Check if MongoDB is running
mongosh   # or mongo
```

### Error: "Port 5000 already in use"

**Solution:** Change port in `.env`:
```env
PORT=5001
```

### Error: "JWT Secret is too short"

**Solution:** Use a longer secret string in `.env`:
```env
JWT_SECRET=your_very_long_secret_key_at_least_32_characters_long
```

### Token expired error

**Solution:** The token expires after 7 days by default. Login again to get a fresh token, or increase `JWT_EXPIRES_IN` in `.env`:
```env
JWT_EXPIRES_IN=30d
```

---

## Production Deployment

### Before Going Live:

1. **Environment Variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=<very-long-random-key>
   MONGODB_URI=<production-db-uri>
   FRONTEND_URL=<production-frontend-url>
   ```

2. **Security Headers** - Add helmet.js:
   ```bash
   npm install helmet
   ```
   In `app.js`:
   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```

3. **Rate Limiting** - Add express-rate-limit:
   ```bash
   npm install express-rate-limit
   ```

4. **HTTPS** - Deploy behind HTTPS reverse proxy (nginx, load balancer)

5. **Logging** - Implement proper logging (Winston, Bunyan)

6. **Monitoring** - Setup monitoring/alerting (PM2, New Relic, Datadog)

7. **Database** - Use MongoDB Atlas with encryption at rest

8. **Backup** - Setup automatic database backups

### Deployment Options:

- **Heroku** - Easy deployment with `Procfile`
- **AWS/EC2** - Full control, more setup required
- **DigitalOcean** - App Platform for simple deployment
- **Railway/Render** - Modern alternatives to Heroku
- **Docker** - Containerize with Dockerfile

### Example Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src ./src
COPY server.js .

EXPOSE 5000

CMD ["node", "server.js"]
```

---

## Database Seeding (Optional)

To populate sample data for testing:

Create `seeds.js`:

```javascript
import { connectDB, disconnectDB } from './src/config/database.js';
import { User } from './src/models/User.js';
import { Task } from './src/models/Task.js';

async function seed() {
  try {
    await connectDB();

    // Create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'Admin',
    });

    // Create member user
    const member = await User.create({
      email: 'member@example.com',
      password: 'member123',
      name: 'Member User',
      role: 'Member',
    });

    // Create sample tasks
    await Task.create({
      title: 'Fix login bug',
      bucket: 'Bug Fixes',
      assignedTo: [member._id],
      createdBy: admin._id,
    });

    console.log('✓ Database seeded successfully');
    await disconnectDB();
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
```

Run:
```bash
node seeds.js
```

---

## Additional Resources

- **Express.js Docs** - https://expressjs.com/
- **Mongoose Docs** - https://mongoosejs.com/
- **JWT Docs** - https://jwt.io/
- **MongoDB Docs** - https://docs.mongodb.com/
- **Node.js Best Practices** - https://nodejs.org/en/docs/guides/

---

## Support

If you encounter issues:

1. Check the error message carefully
2. Review the relevant section in this guide
3. Check `API_DOCUMENTATION.md` for endpoint details
4. Verify all environment variables are set
5. Ensure MongoDB is running
6. Check Node.js and npm versions are compatible

---

## Next Steps

1. ✓ Setup complete
2. Start the server with `npm run dev`
3. Create your first user via `/api/auth/register`
4. Create your first task via `/api/tasks` (as admin)
5. Connect your React frontend
6. Deploy to production

Enjoy managing your projects! 🚀
