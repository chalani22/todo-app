# Todo ABAC App (Next.js + Better Auth + Prisma)

A role-based Todo application that demonstrates Attribute-Based Access Control (ABAC) using Next.js App Router, Better Auth, Prisma (SQLite), shadcn/ui, and TanStack React Query.

## Tech Stack
- Next.js (App Router)
- Better Auth (email/password + sessions)
- Prisma + SQLite
- shadcn/ui
- TanStack React Query

## Features
- Register/Login/Logout
- Todo CRUD
- ABAC enforcement for three roles: user, manager, admin
- Protected routes (redirect to `/login` if not authenticated)
- Role-aware UI (buttons shown/hidden based on role)

## ABAC Rules (Summary)
- **User**: view own todos; create; update own; delete only own when status = `draft`
- **Manager**: view all todos; cannot create/update/delete
- **Admin**: view all todos; can delete any todo regardless of status; cannot create/update

## Live Demo
Deployed on Vercel: https://todo-app-delta-cyan-39.vercel.app/

## Test Accounts
> Password for all accounts: `abcd@1234`

- **User:** `chalani@gmail.com`
- **Manager:** `manager@gmail.com`
- **Admin:** `admin@gmail.com`

## How to Run
```bash
npm install
npx prisma migrate dev
npm run dev



