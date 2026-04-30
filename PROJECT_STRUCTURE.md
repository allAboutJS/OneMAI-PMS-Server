# Project Management System - Backend Implementation

## Folder Structure

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

## Key Design Decisions

1. **Middleware Stack**: JWT auth → RBAC → Controller logic
2. **Task Assignments**: Store as array of user IDs (supports multiple assignees + "everyone")
3. **Position/Order**: Numeric `position` field on tasks for drag & drop
4. **Status Enum**: Validated at schema level to prevent invalid states
5. **Error Handling**: Centralized error middleware with custom error classes
6. **Role-Based Protection**: Middleware checks role before allowing controller action
