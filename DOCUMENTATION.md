# Project Management System - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [Auth Endpoints](#auth-endpoints)
7. [Task Endpoints](#task-endpoints)
8. [Assignment Endpoints](#assignment-endpoints)
9. [Reporting Endpoints](#reporting-endpoints)
10. [Status Codes](#status-codes)

---

## Overview

The Project Management System API is a RESTful backend for managing tasks, assignments, and reporting in a lightweight project management tool similar to Microsoft Planner.

**Key Features:**
- Task management with fixed buckets and workflow states
- Role-based access control (Admin and Member)
- Task assignment (single, multiple, or everyone)
- Drag & drop support with position tracking
- Comprehensive reporting and filtering
- Email invitations for new users

**Technology Stack:**
- Node.js with Express.js
- MongoDB with Mongoose
- JWT-based authentication
- Bcryptjs for password hashing

---

## Authentication

### JWT Token Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

**How to get a token:**
1. Register: `POST /api/auth/register`
2. Login: `POST /api/auth/login`
3. Accept invite: `POST /api/auth/accept-invite`

**Token Format:**
- Encoded with user ID and email
- Expires in 7 days (configurable via JWT_EXPIRES_IN)
- Signed with JWT_SECRET

---

## Base URL

```
http://localhost:5000/api
```

All examples use this base URL. Replace with your production URL as needed.

---

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": []
  }
}
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate record |
| 422 | Unprocessable Entity | Validation error with details |
| 500 | Server Error | Internal server error |

### Common Error Messages

```json
{
  "error": {
    "message": "No token provided",
    "statusCode": 401
  }
}
```

```json
{
  "error": {
    "message": "Only admins can create tasks",
    "statusCode": 403
  }
}
```

---

# AUTH ENDPOINTS

## 1. Register User

Create a new user account via self-registration.

```http
POST /auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4b1a",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Member",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Validation Rules:**
- Email: Must be valid email format and unique
- Password: Minimum 6 characters
- Name: Required, trimmed

---

## 2. Login

Authenticate user and receive JWT token.

```http
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4b1a",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Member",
    "lastLogin": "2024-01-15T10:35:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 3. Get Current User

Retrieve authenticated user's profile.

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4b1a",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Member",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 4. Verify Token

Check if token is valid and active.

```http
GET /auth/verify
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4b1a",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Member"
  }
}
```

---

## 5. Invite User (Admin Only)

Send invitation email to new user.

```http
POST /auth/invite
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "name": "Jane Smith",
  "role": "Member"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitation sent to newuser@example.com",
  "inviteToken": "NjBkNWVjNDlmMWIyYzcyYjhjOGU0YjFhLTE3MDU....",
  "expiresIn": "7 days"
}
```

**Notes:**
- Email is sent to user with invitation link
- User has 7 days to accept the invite
- Role defaults to "Member" if not specified

---

## 6. Accept Invitation

Accept invite and set password.

```http
POST /auth/accept-invite
Content-Type: application/json
```

**Request Body:**
```json
{
  "inviteToken": "NjBkNWVjNDlmMWIyYzcyYjhjOGU0YjFhLTE3MDU....",
  "password": "newSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invite accepted and account activated",
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4b1a",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "role": "Member",
    "inviteAccepted": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 7. Update User Profile

Update user name and email.

```http
PATCH /auth/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "newemail@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "60d5ec49f1b2c72b8c8e4b1a",
    "email": "newemail@example.com",
    "name": "John Doe Updated",
    "role": "Member"
  }
}
```

**Notes:**
- Users can update their own profile
- Admins can update any user profile
- Email must be unique

---

# TASK ENDPOINTS

## 1. Create Task (Admin Only)

Create a new task in a specific bucket.

```http
POST /tasks
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication to the API",
  "bucket": "Feature Development",
  "status": "Not Started",
  "priority": "High",
  "dueDate": "2024-02-15T17:00:00Z",
  "tags": ["authentication", "security"],
  "assignedTo": ["60d5ec49f1b2c72b8c8e4b1a"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "_id": "60d5ec49f1b2c72b8c8e4b2b",
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication to the API",
    "bucket": "Feature Development",
    "status": "Not Started",
    "priority": "High",
    "dueDate": "2024-02-15T17:00:00Z",
    "assignedTo": ["60d5ec49f1b2c72b8c8e4b1a"],
    "assignedToAll": false,
    "position": 0,
    "createdBy": {
      "_id": "60d5ec49f1b2c72b8c8e4b0a",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Valid Buckets:**
- Feature Development
- Bug Fixes
- Improvements / Enhancements
- Technical Infrastructure
- QA / Testing & Release

**Valid Statuses:**
- Not Started
- In Progress
- Completed

**Valid Priorities:**
- Low
- Medium
- High
- Critical

---

## 2. Get All Tasks

Retrieve tasks (filtered by user role).

```http
GET /tasks?bucket=Feature Development&status=In Progress&sort=position
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| bucket | string | Filter by bucket name |
| status | string | Filter by status |
| assigned | string | Filter by assigned user ID (admin only) |
| sort | string | Sort field (default: position) |
| order | number | 1 for ascending, -1 for descending |

**Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "tasks": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4b2b",
      "title": "Implement user authentication",
      "bucket": "Feature Development",
      "status": "In Progress",
      "priority": "High",
      "assignedTo": ["60d5ec49f1b2c72b8c8e4b1a"],
      "position": 0,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Notes:**
- Members see only tasks assigned to them
- Admins see all tasks
- Results are populated with assignee details

---

## 3. Get Single Task

Retrieve task by ID.

```http
GET /tasks/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "task": {
    "_id": "60d5ec49f1b2c72b8c8e4b2b",
    "title": "Implement user authentication",
    "description": "Add JWT-based authentication to the API",
    "bucket": "Feature Development",
    "status": "Not Started",
    "priority": "High",
    "dueDate": "2024-02-15T17:00:00Z",
    "assignedTo": [
      {
        "_id": "60d5ec49f1b2c72b8c8e4b1a",
        "name": "John Doe",
        "email": "john@example.com"
      }
    ],
    "completedAt": null,
    "createdBy": {...},
    "updatedBy": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## 4. Update Task (Admin Only)

Update task details (title, description, bucket, priority, due date).

```http
PATCH /tasks/:id
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Implement JWT authentication system",
  "priority": "Critical",
  "dueDate": "2024-02-20T17:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "task": { ... }
}
```

---

## 5. Update Task Status

Change task status (Not Started → In Progress → Completed).

```http
PATCH /tasks/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "In Progress"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task status updated from 'Not Started' to 'In Progress'",
  "task": { ... }
}
```

**Notes:**
- Admins can change any task status
- Members can only change status of assigned tasks
- Changing to "Completed" auto-sets completedAt timestamp
- Status change notifications sent to assignees

---

## 6. Update Task Position (Drag & Drop)

Update task position for Kanban drag & drop support.

```http
PATCH /tasks/:id/position
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "position": 3,
  "bucket": "Bug Fixes"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task position updated",
  "task": { ... }
}
```

---

## 7. Delete Task (Admin Only)

Delete a task permanently.

```http
DELETE /tasks/:id
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## 8. Get Tasks by Bucket (Kanban View)

Get all tasks for a bucket grouped by status (for Kanban board).

```http
GET /tasks/bucket/Feature Development
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "bucket": "Feature Development",
  "statuses": {
    "Not Started": [
      { "title": "Task 1", "status": "Not Started", ... }
    ],
    "In Progress": [
      { "title": "Task 2", "status": "In Progress", ... }
    ],
    "Completed": [
      { "title": "Task 3", "status": "Completed", ... }
    ]
  }
}
```

---

# ASSIGNMENT ENDPOINTS

## 1. Assign Task (Admin Only)

Assign task to one or multiple users, or everyone.

```http
POST /tasks/:id/assign
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body (Specific Users):**
```json
{
  "userIds": ["60d5ec49f1b2c72b8c8e4b1a", "60d5ec49f1b2c72b8c8e4b1b"]
}
```

**Request Body (Assign to All):**
```json
{
  "assignToAll": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task assigned to 2 user(s)",
  "task": { ... }
}
```

---

## 2. Add Single Assignee

Add a user to task assignment.

```http
POST /tasks/:id/assign/add/:userId
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User John Doe assigned to task",
  "task": { ... }
}
```

---

## 3. Remove Assignee

Remove a user from task assignment.

```http
DELETE /tasks/:id/assign/:userId
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User John Doe removed from task assignment",
  "task": { ... }
}
```

---

## 4. Bulk Assign

Add multiple users to task (append to existing assignees).

```http
POST /tasks/:id/assign/bulk
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userIds": ["60d5ec49f1b2c72b8c8e4b1a", "60d5ec49f1b2c72b8c8e4b1b"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task assigned to 2 user(s)",
  "assignedCount": 3,
  "task": { ... }
}
```

---

## 5. Clear All Assignments

Remove all assignees from a task.

```http
DELETE /tasks/:id/assign
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "All assignments cleared from task",
  "task": { ... }
}
```

---

## 6. Get Task Assignees

Get list of users assigned to a task.

```http
GET /tasks/:id/assignees
Authorization: Bearer <token>
```

**Response (200 OK - Specific Users):**
```json
{
  "success": true,
  "assignedToAll": false,
  "count": 2,
  "assignees": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4b1a",
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "_id": "60d5ec49f1b2c72b8c8e4b1b",
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ]
}
```

**Response (200 OK - Assigned to All):**
```json
{
  "success": true,
  "assignedToAll": true,
  "count": 15,
  "assignees": [ /* all active users */ ]
}
```

---

# REPORTING ENDPOINTS

## 1. Get Overdue Tasks

Get tasks past due date and not completed.

```http
GET /reports/overdue?bucket=Feature Development
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| bucket | string | Filter by bucket |
| assigned | string | Filter by user ID (admin only) |

**Response (200 OK):**
```json
{
  "success": true,
  "count": 3,
  "tasks": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4b2b",
      "title": "Fix login bug",
      "dueDate": "2024-01-10T17:00:00Z",
      "status": "In Progress",
      "priority": "High",
      "bucket": "Bug Fixes",
      "assignedTo": [ ... ]
    }
  ]
}
```

---

## 2. Get Tasks Due Today

Get tasks with due date today (not completed).

```http
GET /reports/due-today
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "tasks": [ ... ]
}
```

---

## 3. Get Future-Dated Tasks

Get tasks with future due dates.

```http
GET /reports/future?days=14
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| days | number | Look ahead N days (optional) |
| bucket | string | Filter by bucket |

**Response (200 OK):**
```json
{
  "success": true,
  "count": 12,
  "tasks": [ ... ]
}
```

---

## 4. Get Task Summary

Get summary of all tasks (overdue, due today, future).

```http
GET /reports/summary
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "overdue": {
    "count": 3,
    "tasks": [ ... ]
  },
  "dueToday": {
    "count": 5,
    "tasks": [ ... ]
  },
  "future": {
    "count": 12,
    "tasks": [ ... ]
  },
  "total": 20
}
```

---

## 5. Get Tasks by Status

Get tasks grouped by status (dashboard view).

```http
GET /reports/by-status?bucket=Feature Development
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "notStarted": {
    "count": 5,
    "tasks": [ ... ]
  },
  "inProgress": {
    "count": 3,
    "tasks": [ ... ]
  },
  "completed": {
    "count": 2,
    "tasks": [ ... ]
  },
  "total": 10
}
```

---

## 6. Get My Tasks

Get all tasks assigned to current user.

```http
GET /reports/my-tasks?status=In Progress&bucket=Bug Fixes
Authorization: Bearer <token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| bucket | string | Filter by bucket |
| sort | string | Sort field (default: dueDate) |

**Response (200 OK):**
```json
{
  "success": true,
  "count": 7,
  "tasks": [ ... ]
}
```

---

# STATUS CODES REFERENCE

| Code | Scenario |
|------|----------|
| 200 | ✓ Successful GET, PATCH, DELETE |
| 201 | ✓ Successful POST (resource created) |
| 400 | ✗ Bad request (invalid input, validation error) |
| 401 | ✗ Unauthorized (missing/invalid token) |
| 403 | ✗ Forbidden (insufficient permissions) |
| 404 | ✗ Not found (resource doesn't exist) |
| 409 | ✗ Conflict (duplicate record, state conflict) |
| 422 | ✗ Unprocessable entity (validation error with details) |
| 500 | ✗ Server error (internal issue) |

---

## Quick Start Example

**1. Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**3. Create Task (as Admin):**
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My first task",
    "bucket": "Feature Development",
    "assignedTo": ["<user_id>"]
  }'
```

**4. Update Task Status:**
```bash
curl -X PATCH http://localhost:5000/api/tasks/<task_id>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "In Progress"}'
```

---

## Environment Variables

Required `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/project-management
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
EMAIL_FROM=noreply@projectmanagement.com
FRONTEND_URL=http://localhost:3000
```

---

## Rate Limiting

Not currently implemented. Consider adding for production:
- Implement rate limiting middleware (express-rate-limit)
- Limit API calls per IP/user
- Protect against brute force attacks

---

## Security Considerations

✓ **Implemented:**
- JWT token authentication
- Password hashing (bcryptjs)
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Error handling (no sensitive info in errors)

**Recommended for Production:**
- HTTPS/TLS enforcement
- Rate limiting
- Request logging and monitoring
- Input size limits
- SQL/NoSQL injection prevention (Mongoose helps)
- CSRF protection
- Helmet.js for security headers
- API key rotation
- Audit logging

---

## Troubleshooting

**"No token provided":**
- Add Authorization header with Bearer token
- Format: `Authorization: Bearer <your_token>`

**"Token has expired":**
- Login again to get a fresh token
- Increase JWT_EXPIRES_IN if needed

**"User not found":**
- User account may have been deleted
- Or token contains old/invalid user ID

**"Validation Error":**
- Check required fields
- Validate format of email, dates, enums
- See error details for specific issues

---

## Support & Contributions

For issues, questions, or contributions:
- Check error messages carefully
- Verify all required fields are present
- Ensure tokens are valid and not expired
- Check user role permissions
