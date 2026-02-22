# PCLU School Management System

> A full-stack school management platform for **Polytechnic College of La Union** — covering academics, finance, communication, and mobile access.

## Architecture

```
school-management-system/
├── apps/
│   ├── api/        # NestJS backend (REST + WebSocket)
│   ├── web/        # Next.js 16 frontend (App Router)
│   └── mobile/     # React Native / Expo (Expo Router)
├── packages/
│   ├── database/   # Prisma schema + client
│   ├── types/      # Shared TypeScript types
│   └── config/     # Shared ESLint/TS config
├── turbo.json      # Turborepo pipeline
└── pnpm-workspace.yaml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS, Prisma, PostgreSQL, Socket.IO, JWT |
| **Web Frontend** | Next.js 16 (App Router), Tailwind CSS, Zustand, React Query |
| **Mobile** | React Native, Expo SDK 52, Expo Router, SecureStore |
| **Monorepo** | Turborepo, pnpm workspaces |

## Getting Started

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm --filter @sms/database db:push

# Seed the database
pnpm --filter @sms/api seed

# Start backend
pnpm --filter @sms/api dev

# Start web frontend
pnpm --filter @sms/web dev

# Start mobile app
cd apps/mobile && npx expo start
```

## Portals

### Admin Portal (`/admin`)
Dashboard, Students, Faculty, Subjects, Timetable, Finance, Announcements, Messages, Settings

### Teacher Portal (`/teacher`)
Dashboard, My Classes, Gradebook, QR Attendance Scanner, Messages

### Student Portal (`/student`)
Dashboard, Schedule, Grades, Finances, Messages

### Parent Portal (Mobile only)
Child overview, Grades, Finance, Messages

## Environment Variables

### Backend (`apps/api/.env`)
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/sms
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### Web Frontend (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

**© 2026 Polytechnic College of La Union**
