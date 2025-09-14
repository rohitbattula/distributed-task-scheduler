# 🗓️ Distributed Task Scheduler

A full-stack task scheduling platform inspired by services like AWS Batch + Cronhub.  
Users can create jobs that run **HTTP calls** or **local scripts** on schedules (cron), with retries, backoff, logs, and an inspector to preview schedules across timezones.

- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: Node.js + Express + MongoDB Atlas + Agenda (deployed on Render)
- **Worker**: Background process powered by Agenda, runs jobs continuously

---

## ✨ Features

- 🔐 Authentication (JWT)
- 👤 User roles (candidate / interviewer if extended)
- 📬 Password reset via email
- 📊 Dashboard with job list, run history
- ⚡ Create jobs of type:
  - **HTTP** – make API calls with custom headers/body
  - **Script** – run Node.js scripts (via `child_process`)
- 🔁 Retries & backoff
- ⏱️ Cron expression + timezone support
- 🔍 Inspector endpoint to preview next N occurrences (DST-aware)

---

## 🏗️ Architecture

Frontend (Vercel) → Backend API (Render Web Service)
|
└── Worker (Render Background Worker)
|
└── MongoDB Atlas (Replica Set)

markdown
Copy code

- **Frontend** talks only to `/api` on the backend.
- **Backend API** handles auth, jobs, runs, inspector endpoints.
- **Worker** connects to the same MongoDB, consumes Agenda jobs, executes them.
- **MongoDB Atlas** stores users, jobs, runs, reset tokens.

---

## 🚀 Getting Started (Local Dev)

### 1. Clone

```bash
git clone https://github.com/yourname/distributed-task-scheduler.git
cd distributed-task-scheduler
2. Backend

cd dts-backend
npm install
Environment variables (.env):

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/dts
JWT_SECRET=supersecret
APP_URL=http://localhost:5173
PORT=4000
Start API:


npm run dev     # or node src/server.js
Start Worker (separate terminal):

node src/worker/index.js
3. Frontend

cd ../dts-frontend
npm install
.env:

VITE_API_BASE=http://localhost:4000/api
Run dev server:

npm run dev
Visit http://localhost:5173.

📡 API Endpoints
Auth

POST /api/auth/register

POST /api/auth/login

POST /api/auth/forgot

POST /api/auth/reset

Jobs

GET /api/jobs

POST /api/jobs

GET /api/jobs/:id

PATCH /api/jobs/:id

DELETE /api/jobs/:id

Runs

GET /api/runs?jobId=<id>

Inspector

POST /api/inspector/preview → { cron, timezone, count }

GET /api/inspector/job/:id?count=10

🖥️ Example: Script Job
Add scripts/hello.js:


console.log("Hello from DTS worker at", new Date().toISOString());
process.exit(0);
Create a job:


{
  "type": "script",
  "name": "hello-script",
  "schedule": "*/2 * * * *",
  "timezone": "UTC",
  "script": {
    "command": "node",
    "args": ["scripts/hello.js"],
    "cwd": "./"
  }
}
Worker logs will show output every 2 minutes.

☁️ Deployment
Backend + Worker (Render)
Create two services in Render:

Web Service:

Root = dts-backend

Build = npm ci

Start = node src/server.js

Background Worker:

Root = dts-backend

Build = npm ci

Start = node src/worker/index.js

Set environment variables:

MONGODB_URI

JWT_SECRET

APP_URL=https://<your-frontend>.vercel.app

NODE_ENV=production

Health check path (Web Service): /api/health

Frontend (Vercel)
Import repo, set project root to dts-frontend.

Build command: npm run build

Output directory: dist

Environment variable:
VITE_API_BASE=https://<your-backend>.onrender.com/api
🛡️ Notes
MongoDB Atlas must allow connections from Render.

Agenda requires a replica set; Atlas provides this by default.

Password reset emails depend on your SMTP config (sendMail).
```
