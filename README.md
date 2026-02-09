# Personal Expense Tracker

A web-based expense tracker that supports HDFC Bank statement uploads, auto-categorization, manual entry, and spending analytics.

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Recharts, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT-based authentication with bcrypt

## Project Structure

```
expense-tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.ts            # Default categories & rules
│   └── src/
│       ├── index.ts            # Express server entry
│       ├── middleware/auth.ts   # JWT auth middleware
│       ├── routes/             # API routes
│       ├── parsers/            # Bank statement parsers
│       ├── services/           # Business logic
│       └── utils/              # Shared utilities
├── frontend/
│   └── src/
│       ├── components/         # Reusable components
│       ├── context/            # Auth context
│       ├── lib/                # API client
│       └── pages/              # Page components
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database (or use Neon.tech free tier)

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

The backend runs on `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to the backend.

## Deployment

### Database (Neon.tech)

1. Create a free PostgreSQL database at neon.tech
2. Copy the connection string to your backend `.env`

### Backend (Render/Railway/Fly.io)

1. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `PORT`
2. Build command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
3. Start command: `npm start`

### Frontend (Vercel)

1. Set `VITE_API_URL` to your backend URL (e.g., `https://your-backend.onrender.com/api`)
2. Build command: `npm run build`
3. Output directory: `dist`

## Features

- **Statement Upload**: Upload HDFC Bank XLS statements with duplicate detection
- **Auto-Categorization**: Rule-based keyword matching with confidence scores
- **Learning**: User corrections improve future categorization
- **Manual Entry**: Add cash and other transactions manually
- **Dashboard**: Spending charts (line + pie), category breakdowns, period filters
- **Filters**: Filter by date range, category, payment mode, and type

## Extensibility

Bank-specific parsing logic is isolated in `backend/src/parsers/`. To add a new bank:

1. Create a new parser implementing the `BankParser` interface in `parsers/`
2. Add a new upload route in `routes/upload.ts`
3. Add the bank to the `TransactionSource` enum in the Prisma schema
