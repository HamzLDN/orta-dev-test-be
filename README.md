# 🚀 Shift Manager Backend API

This is the backend system for the **Shift Manager** application, built with **Node.js**, **Express**, and **MongoDB**. It supports:

- ✅ User registration and login with JWT authentication
- 🔐 Protected routes for shift management
- 🔁 Password reset via email with secure token flow
- 📄 Auto-generated API docs using Swagger (OpenAPI 3.0)

## New Features (CRUD capabilities)
- View added shifts and see if its either in progress, pending, or complete
- Create Shifts with a decorated form
- Edit shifts with a decorated form and confirmation
- A button to delete shifts no longer needed with confirmation
- Static clock-in and clock-out button

## Requests you can do on PortSwagger on /api/shifts
- GET
- POST
- PUT
- DELETE
---

## 📂 Folder Structure

```
orta-dev-test-be/
├── controllers/           # Route handlers (User, Shift, Forgot Password)
├── middleware/            # JWT authentication middleware
├── models/                # Mongoose schemas (User, Shift)
├── routes/                # API route definitions
├── scheduler/             # Optional job scheduler logic
├── swagger/               # Swagger config for auto docs
├── .env                   # Environment variables (not committed)
├── .gitignore
├── package.json
├── server.js              # Entry point
```

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone --branch feature/shift-crud --single-branch https://github.com/HamzLDN/orta-dev-test-be.git
cd orta-dev-test-be
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a `.env` file

Create a `.env` file in the root with the following variables:

```env
MONGO_URI=<your-mongodb-connection-uri>
PORT=8000
JWT_SECRET=secret1234
NODE_ENV=development
```

---

### 4. Run the server

```bash
npm run dev
```

> Server will run locally on: [http://localhost:8000](http://localhost:8000)

---

## 📁 API Documentation

Swagger UI is available at:

👉 **[https://orta-dev-test-be.onrender.com/api/docs](https://orta-dev-test-be.onrender.com/api/docs)**

---

## 🔐 Authenticated Endpoints

Use the `/user/login` route to get a JWT. Then include it in your requests:

```
Authorization: Bearer <token>
```

---

## 📄 License

MIT
