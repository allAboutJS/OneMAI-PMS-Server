# Project Management System - Backend

A lightweight, scalable backend for a task management system similar to Microsoft Planner. Built with Node.js, Express, MongoDB, and JWT authentication.

## 🎯 Features

### ✅ Task Management
- Create, read, update, delete tasks
- 5 predefined buckets for organization:
  - Feature Development
  - Bug Fixes
  - Improvements / Enhancements
  - Technical Infrastructure
  - QA / Testing & Release
- 3-state workflow: Not Started → In Progress → Completed
- Priority levels: Low, Medium, High, Critical
- Due date tracking with automatic timestamp on completion
- Flexible tagging system
- Support for task descriptions and attachments (future feature)

### ✅ Task Assignment
- Assign tasks to individual users
- Bulk assignment support
- Assign to everyone (broadcast)
- Multiple assignees per task
- Email notifications on assignment
- Add/remove assignees individually or clear all

### ✅ Drag & Drop Support
- Position tracking for Kanban board
- Reorder tasks within buckets
- Bucket position field for flexibility

### ✅ Reporting & Analytics
- **Overdue Tasks**: Past due date, not completed
- **Due Today**: Tasks due on current date
- **Future Dated**: Upcoming tasks
- **Task Summary**: Aggregate view of all three categories
- **By Status**: Group tasks by workflow state
- **My Tasks**: Personal task inbox for each user
- Filter by bucket, date range, and user (admin only)

### ✅ Authentication & Authorization
- JWT-based token authentication
- User registration and login
- Email-based user invitations
- Role-based access control (RBAC):
  - **Admin**: Full access to all operations
  - **Member**: Limited to assigned tasks only
- Password hashing with bcryptjs
- User profile management
- Account activation via invitation system

### ✅ Role-Based Access Control
- **Admin Permissions**:
  - Create, read, update, delete all tasks
  - Assign/unassign tasks
  - Change any task status
  - Move tasks (drag & drop)
  - Invite new users
  - View all user data

- **Member Permissions**:
  - View only assigned tasks
  - Update status of assigned tasks
  - View own profile
  - See reports filtered to own tasks

### ✅ API Features
- RESTful API design
- Comprehensive input validation
- Centralized error handling
- Detailed error responses
- CORS support
- Health check endpoint
- API documentation endpoint

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js (v14+) |
| **Framework** | Express.js 4.x |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (jsonwebtoken) |
| **Password Security** | bcryptjs |
| **Environment Management** | dotenv |
| **Input Validation** | express-validator |

---

## 📋 Project Structure

```
server/
│
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection setup
│   │   └── environment.js       # Environment variables config
│   │
│   ├── models/
│   │   ├── user.js              # User schema (auth, roles)
│   │   └── task.js              # Task schema (with bucket, status, assignments)
│   │
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication middleware
│   │   ├── rbac.js              # Role-based access control
│   │   └── error-handler.js     # Global error handling
│   │
│   ├── controllers/
│   │   ├── auth.js              # Login, register, token generation
│   │   ├── task.js              # Task CRUD and status updates
│   │   ├── assignment.js        # Task assignment logic
│   │   └── report.js            # Reporting endpoints
│   │
│   ├── routes/
│   │   ├── auth-routes.js        # Auth endpoints
│   │   └── task-routes.js        # Task management routes
│   │
│   ├── utils/
│   │   ├── validators.js         # Input validation helpers
│   │   ├── error-handler.js      # Custom error classes
│   │   └── email-service.js      # Email invite stub (future enhancement)
│   │
│   └── index.js                  # Express app setup
│
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore file
└── package.json                  # Dependencies
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- MongoDB 4.4+ (or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project-management-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Local MongoDB
   mongod

   # Or use MongoDB Atlas cloud service
   ```

5. **Start the server**
   ```bash
   npm run dev    # Development with auto-reload
   npm start      # Production
   ```

6. **Verify installation**
   ```bash
   curl http://localhost:5000/health
   ```

---

## 📚 API Quick Reference

### Authentication Endpoints
```
POST   /api/auth/register           Register new user
POST   /api/auth/login              Login user
GET    /api/auth/me                 Get current user
GET    /api/auth/verify             Verify token
POST   /api/auth/invite             Invite user (Admin)
POST   /api/auth/accept-invite      Accept invitation
PATCH  /api/auth/:id                Update profile
```

### Task Endpoints
```
POST   /api/tasks                   Create task (Admin)
GET    /api/tasks                   Get all tasks
GET    /api/tasks/:id               Get task by ID
PATCH  /api/tasks/:id               Update task (Admin)
DELETE /api/tasks/:id               Delete task (Admin)
PATCH  /api/tasks/:id/status        Update status
PATCH  /api/tasks/:id/position      Update position (drag & drop)
GET    /api/tasks/bucket/:name      Get by bucket (Kanban)
```

### Assignment Endpoints
```
POST   /api/tasks/:id/assign        Assign task (Admin)
POST   /api/tasks/:id/assign/add/:userId      Add assignee (Admin)
DELETE /api/tasks/:id/assign/:userId          Remove assignee (Admin)
POST   /api/tasks/:id/assign/bulk   Bulk assign (Admin)
DELETE /api/tasks/:id/assign        Clear assignments (Admin)
GET    /api/tasks/:id/assignees     Get assignees
```

### Reporting Endpoints
```
GET    /api/reports/overdue         Overdue tasks
GET    /api/reports/due-today       Due today
GET    /api/reports/future          Future tasks
GET    /api/reports/summary         All summaries
GET    /api/reports/by-status       Group by status
GET    /api/reports/my-tasks        Current user's tasks
```

**Full documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🔒 Security Features

✅ **Implemented**
- JWT token-based authentication
- Password hashing with bcryptjs (10 salt rounds)
- Role-based access control at middleware level
- Input validation and sanitization
- CORS configuration
- Error handling (no sensitive info exposed)
- Request body size limits

**Recommended for Production**
- HTTPS/TLS enforcement
- Rate limiting (express-rate-limit)
- Request logging and monitoring
- Helmet.js for security headers
- Audit logging for sensitive operations
- Database encryption at rest
- API key rotation
- Regular security audits

---

## 📖 Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Installation and deployment guide
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Architecture overview

---

## 🔄 Data Models

### User Schema
```javascript
{
  email: String (unique, lowercase),
  name: String,
  password: String (hashed),
  role: String (Admin | Member),
  isActive: Boolean,
  lastLogin: Date,
  inviteToken: String,
  inviteTokenExpires: Date,
  inviteAccepted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Task Schema
```javascript
{
  title: String,
  description: String,
  bucket: String (Feature Development | Bug Fixes | Improvements | Infrastructure | QA),
  status: String (Not Started | In Progress | Completed),
  priority: String (Low | Medium | High | Critical),
  assignedTo: [ObjectId],          // Array of user IDs
  assignedToAll: Boolean,           // Assign to everyone
  dueDate: Date,
  completedAt: Date,                // Auto-set when status = Completed
  position: Number,                 // For ordering/drag & drop
  bucketPosition: Number,
  createdBy: ObjectId,
  updatedBy: ObjectId,
  tags: [String],
  attachments: [String],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🧪 Example Workflows

### Create and Assign a Task

```bash
# 1. Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
# Response includes: token

# 2. Create task
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix login bug",
    "bucket": "Bug Fixes",
    "priority": "High",
    "dueDate": "2024-02-15T17:00:00Z"
  }'
# Response includes: task._id

# 3. Assign to users
curl -X POST http://localhost:5000/api/tasks/<task_id>/assign \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userIds": ["<user_id_1>", "<user_id_2>"]}'

# 4. Update status
curl -X PATCH http://localhost:5000/api/tasks/<task_id>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "In Progress"}'
```

### Invite a New User

```bash
# 1. Admin invites user
curl -X POST http://localhost:5000/api/auth/invite \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "role": "Member"
  }'
# Response includes: inviteToken

# 2. User accepts invitation
curl -X POST http://localhost:5000/api/auth/accept-invite \
  -H "Content-Type: application/json" \
  -d '{
    "inviteToken": "<invite_token>",
    "password": "newPassword123"
  }'
# Response includes: token (user can now login)
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=5001
```

### MongoDB Connection Error
```bash
# Ensure MongoDB is running
mongod

# Or check connection string in .env
MONGODB_URI=mongodb://localhost:27017/project-management
```

### Token Expired
- Login again to get a fresh token
- Or increase JWT_EXPIRES_IN in .env

### Validation Error
- Check all required fields are present
- Verify field formats (email, dates, enums)
- Review error message for specific issues

---

## 📈 Performance Optimizations

Implemented:
- ✅ Database indexes on frequently queried fields (bucket, status, dueDate, assignedTo)
- ✅ Mongoose virtuals for computed fields
- ✅ Pagination-ready query structure
- ✅ Population of related documents only when needed

Recommended:
- Add pagination for large result sets
- Implement caching (Redis) for frequently accessed data
- Add request logging middleware
- Use connection pooling for database
- Monitor slow queries

---

## 🌐 Deployment

### Environment-Specific Configuration

**Development:**
```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/project-management
JWT_SECRET=dev_secret_key
DEBUG=*
```

**Production:**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/project-management
JWT_SECRET=<long-random-secret-key>
FRONTEND_URL=https://your-domain.com
```

### Deployment Platforms
- Heroku (with Procfile)
- AWS (EC2, Elastic Beanstalk)
- DigitalOcean (App Platform)
- Google Cloud (Cloud Run)
- Azure (App Service)
- Railway, Render, Fly.io

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed deployment instructions.

---

## 📝 License

MIT License - Feel free to use for personal and commercial projects.

---

## 🤝 Contributing

Contributions are welcome! Areas for enhancement:
- Email integration (SendGrid, AWS SES)
- File upload support
- Task comments and activity log
- Task dependencies and subtasks
- Team/project organization
- Notifications system
- Advanced search and filtering
- Webhooks for external integrations
- GraphQL API option
- Real-time updates with WebSockets

---

## 📞 Support

For questions or issues:
1. Check the [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoint details
2. Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) for common setup issues
3. Check error messages - they're descriptive
4. Verify environment variables are set correctly
5. Ensure MongoDB is running and accessible

---

## ✨ Future Enhancements

- [ ] Email notifications for task updates
- [ ] File attachments and uploads
- [ ] Task comments and activity history
- [ ] Task templates and automation
- [ ] Custom workflows and status
- [ ] Team/workspace support
- [ ] Advanced analytics and dashboards
- [ ] GraphQL API
- [ ] WebSocket for real-time updates
- [ ] Integration with Slack, GitHub, etc.
- [ ] Mobile app
- [ ] Bulk operations
- [ ] Task dependencies

---

## 🎉 Getting Started

1. Follow the [Quick Start](#-quick-start) section
2. Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoints
3. Try example workflows from [Example Workflows](#-example-workflows)
4. Deploy to your preferred platform

Happy task managing! 🚀

---

**Built with ❤️ for efficient project management**
