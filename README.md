# Todo ABAC App  
**Role-Aware Task Management with Next.js, Better Auth & PostgreSQL**

A production-ready Todo application demonstrating **Attribute-Based Access Control (ABAC)** using **Next.js App Router**, **Better Auth**, **PostgreSQL (Neon)**, **shadcn/ui**, and **TanStack Query**.  
Designed and deployed following real-world authentication, authorization, and hosting best practices.

---
# 🚀 Todo ABAC App – Live Demo & Access Details

## 🌐 Live Application (Vercel)
👉 **https://todo-app-delta-cyan-39.vercel.app/**

---

## 🔐 Demo Accounts (Ready to Use)

You can either **sign up with a new account** or use the following **pre-created demo users**:

| Role     | Email              | Password   |
|----------|--------------------|------------|
| Admin    | admin@gmail.com    | abcd@1234  |
| Manager  | manager@gmail.com  | abcd@1234  |

> ✅ Users can also be created via the **Sign Up** page.

---

## 🚀 Tech Stack

### Frontend
- **Next.js** (App Router, React 19)
- **TypeScript**
- **shadcn/ui** + Tailwind CSS
- **TanStack Query (React Query)**

### Backend
- **Next.js Route Handlers** (Node.js runtime)
- **Better Auth** (Email/Password, JWT + Sessions)
- **PostgreSQL (Neon)**
- **pg** (node-postgres)

### Hosting & Environment
- **Vercel** (Node runtime – no Edge)
- Local development: **Windows + VS Code**
- Production database: **Neon PostgreSQL**
- ❌ No SQLite in production
- ❌ No Prisma (direct SQL via `pg`)

---

## ✨ Features

- Email & password authentication (Better Auth)
- Secure session handling with cookies
- Role-based and attribute-based access control (ABAC)
- Todo management with ownership enforcement
- Role-aware UI (actions shown/hidden based on permissions)
- Fully enforced authorization on:
  - Backend API routes
  - Frontend UI components
- Production-safe deployment on Vercel

---

## 👥 Roles & ABAC Rules

### Roles
- `user`
- `manager`
- `admin`

Role is stored **server-side** in the Better Auth user table and **cannot be modified by the client**.

### Permissions

#### **User**
- View **own** todos
- Create own todos
- Update own todos
- Delete own todos **only when status = `draft`**

#### **Manager**
- View **all users’** todos
- ❌ Cannot create, update, or delete todos

#### **Admin**
- View **all users’** todos
- Delete **any** todo (any status)
- ❌ Cannot create or update todos

> ⚠️ ABAC rules are enforced on **both backend APIs and frontend UI**.

---

## 🗄 Database Schema (PostgreSQL)

### `todos` table

| Column       | Type |
|--------------|------|
| id           | text (PK) |
| title        | text |
| description  | text |
| status       | `draft` \| `in_progress` \| `completed` |
| ownerId      | text → user.id |
| createdAt    | timestamp |
| updatedAt    | timestamp |

### `user` table (Better Auth)
- id
- email
- name
- role (`user | manager | admin`)

---

## 📂 Project Structure (Simplified)

```
/app
  /api
    /auth/[...all]/route.ts
    /todos/route.ts
    /todos/[id]/route.ts
  /sign-in
  /sign-up
  /todos
  page.tsx

/components
  /todos
    CreateTodoDialog.tsx
    EditTodoDialog.tsx
    ViewTodoDialog.tsx
    DeleteTodoDialog.tsx

/lib
  auth.ts            // Better Auth server config
  auth-client.ts     // Better Auth client
  db.ts              // PostgreSQL pool & helpers
  todos.api.ts
  todos.types.ts

/hooks
  useSession.ts
  useTodos.ts

/providers
  QueryProvider.tsx
```

---

## 🔐 Authentication Notes

- Better Auth is configured with:
  - Email & password login
  - JWT + session cookies
  - Custom session plugin injecting `user.role`
- Auth routes and database access **run on Node runtime**
- Origin validation is enabled and configured for:
  - Localhost
  - Vercel production domain
  - Vercel preview deployments (`*.vercel.app`)

---

## 🌍 Environment Variables

### Required (Vercel & Local)

```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=https://your-production-domain
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-production-domain
```

> Preview deployments automatically fall back to `VERCEL_URL`.

---

## ▶️ Running Locally

```bash
npm install
npm run dev
```

Open:  
👉 http://localhost:3000

---

## ☁️ Deployment

- Hosted on **Vercel**
- Database hosted on **Neon PostgreSQL**
- GitHub → Vercel CI/CD
- Fully compatible with Vercel Preview & Production environments

---

## 📌 Key Highlights

- Production-grade authentication & authorization
- No client-side role trust
- ABAC enforced at API and UI level
- No Edge runtime pitfalls
- No ORM overhead (direct SQL)
- Clean, scalable architecture suitable for real-world systems
