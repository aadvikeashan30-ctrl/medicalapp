# DocClinic Pro - All-in-One Doctor Clinic Management App

> Smart, Affordable Clinic Management for Modern Doctors - Web + Mobile

## Features

### Core
- Patient Management — digital records, search, medical history, soft delete
- Appointment Booking — token system, daily queue, slot-conflict check, status tracking
- Digital Prescriptions — vitals, medicine list, templates, follow-up dates
- Billing & Invoicing — items, discount, tax, payment status (cash/UPI/card/online/insurance)
- WhatsApp Reminders — Twilio integration with daily cron + on-demand send
- Dashboard Analytics — KPIs and 6-month revenue chart
- File Uploads — multer-backed image/PDF uploads (clinic logo, reports)
- Medicine Library — per-doctor reusable medicine master

### Specialty Support
General Physician, Dentist, Ophthalmologist, Orthopedic, Pediatrician,
Dermatologist, ENT, Cardiology, Gynecology.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20, Express 4, MongoDB 7, Mongoose 7 |
| Security | helmet, express-rate-limit, express-mongo-sanitize, validator |
| Web | React 18, Vite 5, Tailwind 3, react-router 6, chart.js 4 |
| Mobile | React Native (Expo 49), React Navigation |
| Auth | JWT + bcrypt |
| Messaging | Twilio WhatsApp Business API |
| Logging | winston + morgan |
| DevOps | Docker, docker-compose, GitHub Actions |

## Project Structure

```
Medicalapp/
├── backend/                  # Node.js API
│   ├── src/
│   │   ├── middleware/       # auth, role, errorHandler
│   │   ├── models/           # Mongoose models + Counter (atomic IDs)
│   │   ├── routes/           # auth, patients, appointments, prescriptions, billing,
│   │   │                     # dashboard, whatsapp, medicines, uploads
│   │   ├── services/         # whatsappService (Twilio + stub fallback)
│   │   ├── utils/            # logger, env validator
│   │   └── server.js
│   ├── Dockerfile
│   └── .env.example
├── web/                      # React + Vite dashboard
│   └── src/
│       ├── components/       # Layout, Loader, EmptyState, RevenueChart
│       ├── hooks/useApi.js
│       ├── pages/            # Login, Register, Forgot, Dashboard, Patients, ...
│       └── utils/            # api.js, auth.js
├── mobile/                   # React Native (Expo)
│   └── src/
│       ├── screens/
│       └── utils/            # api.js (AsyncStorage), auth.js
├── docker-compose.yml
├── .github/workflows/ci.yml
└── package.json              # workspaces root
```

## Quick Start (local)

```bash
# 1. Install everything
npm run install:all

# 2. Configure backend env
cp backend/.env.example backend/.env
# edit MONGODB_URI, JWT_SECRET, (optional) TWILIO_*, ALLOWED_ORIGINS

# 3. Start backend + web together
npm run dev
# Backend: http://localhost:5000  |  Web: http://localhost:3000
```

For mobile:
```bash
cd mobile
npm install
npx expo start
# Set EXPO_PUBLIC_API_URL if your backend isn't on localhost:5000
# (e.g. EXPO_PUBLIC_API_URL=http://192.168.1.50:5000/api npx expo start)
```

## Demo data (one command)

After the backend is configured and MongoDB is running:

```bash
npm run seed                # creates demo doctor + sample data
npm run seed -- --reset     # also wipes and reseeds the demo doctor's data
```

Then log in with:
- **Email:** `demo@docclinic.com`
- **Password:** `demo1234`

The seed creates 5 patients, 6 appointments (today + tomorrow), 3 prescriptions, 4 bills, and a 5-medicine library, so the dashboard, queue, and revenue chart all populate immediately.

## Quick Start (Docker)

```bash
# Set required env in your shell or a .env file at the repo root
export JWT_SECRET=$(openssl rand -hex 32)

docker compose up -d --build
# Backend: http://localhost:5000/api/health
# MongoDB: localhost:27017 (data persisted in named volume)
```

## Environment Variables (backend)

| Var | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | |
| `PORT` | no | `5000` | |
| `MONGODB_URI` | **yes** | — | |
| `JWT_SECRET` | **yes** | — | Use a long random string in production |
| `JWT_EXPIRY` | no | `30d` | |
| `ALLOWED_ORIGINS` | no | `http://localhost:3000` | Comma-separated origin allowlist |
| `LOG_LEVEL` | no | `info` | |
| `RATE_LIMIT_WINDOW_MINUTES` | no | `15` | |
| `RATE_LIMIT_MAX` | no | `300` | |
| `TWILIO_ACCOUNT_SID` | no | — | When unset, WhatsApp runs in stub mode |
| `TWILIO_AUTH_TOKEN` | no | — | |
| `TWILIO_WHATSAPP_NUMBER` | no | `whatsapp:+14155238886` | |

## API Endpoints

### Auth
- `POST /api/auth/register` — create doctor account (returns token)
- `POST /api/auth/login` — issue token
- `GET /api/auth/profile` — current user (auth)
- `PUT /api/auth/profile` — update profile (auth, password/email locked)
- `POST /api/auth/change-password` — change password (auth)
- `POST /api/auth/forgot-password` — request reset token

### Patients
- `GET /api/patients?search=&page=&limit=` — list (auth)
- `GET /api/patients/:id` — get one
- `POST /api/patients` — create (validated)
- `PUT /api/patients/:id` — update
- `DELETE /api/patients/:id` — soft delete

### Appointments
- `GET /api/appointments?date=YYYY-MM-DD&status=` — list
- `GET /api/appointments/queue/today` — today's active queue
- `POST /api/appointments` — book (slot-conflict checked)
- `PUT /api/appointments/:id` — update / change status
- `DELETE /api/appointments/:id` — cancel

### Prescriptions
- `GET /api/prescriptions?patientId=` — list
- `GET /api/prescriptions/templates` — saved templates
- `POST /api/prescriptions` — create
- `POST /api/prescriptions/template` — save as template
- `GET /api/prescriptions/:id` — get one (with patient)
- `DELETE /api/prescriptions/:id` — delete

### Billing
- `GET /api/billing?patientId=&status=&startDate=&endDate=` — list
- `POST /api/billing` — create (server recomputes totals)
- `PUT /api/billing/:id` — update payment, recomputes status
- `GET /api/billing/revenue/summary` — today / week / month / total

### Dashboard
- `GET /api/dashboard/stats`
- `GET /api/dashboard/recent`
- `GET /api/dashboard/analytics` — last 6 months revenue + new patients

### WhatsApp
- `POST /api/whatsapp/send` — `{ phone, message }`
- `POST /api/whatsapp/remind` — single appointment reminder
- `POST /api/whatsapp/prescription` — share prescription URL
- `POST /api/whatsapp/run-reminders` — manually trigger daily reminder job

### Medicines
- `GET /api/medicines?search=&limit=` — search doctor's library
- `POST /api/medicines` — add to library
- `PUT /api/medicines/:id` / `DELETE /api/medicines/:id`

### Uploads
- `POST /api/uploads` — `multipart/form-data` with `file` field. Returns `{ url, filename, size, mimetype }`. Limit 5 MB. Allowed: image/jpeg, png, webp, application/pdf.

### Health
- `GET /api/health` — DB-aware. Returns 200 when connected, 503 otherwise.

## Pricing Plans

| Plan | Price | Target |
|---|---|---|
| Basic | INR 499/month | Single doctor clinic |
| Pro | INR 1,499/month | 2-3 doctor clinic |
| Enterprise | INR 4,999/month | Multi-branch hospital |

## Production Notes

- **Never** ship without a strong `JWT_SECRET` and an `ALLOWED_ORIGINS` allowlist.
- Atomic ID counters (`PAT-`, `RX-`, `INV-`, daily token) live in the `Counter` collection — back it up with the rest of your data.
- Mount `/app/uploads` to durable storage (or replace multer disk storage with S3/Cloudinary).
- Set up TLS at the load balancer; the app trusts `X-Forwarded-*` (`trust proxy = 1`).
- The reminder cron runs at 08:00 server time. Use a single replica or move to an external scheduler if you horizontally scale.

## License

[MIT](./LICENSE)
