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

- **Frontend** talks only to `/api` on the backend.
- **Backend API** handles auth, jobs, runs, inspector endpoints.
- **Worker** connects to the same MongoDB, consumes Agenda jobs, executes them.
- **MongoDB Atlas** stores users, jobs, runs, reset tokens.
