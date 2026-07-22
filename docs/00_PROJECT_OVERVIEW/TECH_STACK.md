# TECH_STACK.md

# El-bannawy Platform
## Official Technology Stack

Version: 1.0

---

> ⚠️ **Dual Architecture**: The original platform (NestJS + Prisma + PostgreSQL) is fully built and deployed. A Firebase migration is in progress for the operational database and identity layers. See `ARCHITECTURE_LOCK.md` and `docs/firebase/` for the migration architecture.

# Programming Language

- TypeScript (Strict Mode)

No JavaScript is allowed.

---

# Monorepo

- Turborepo

---

# Web Application

Framework:
- Next.js 15 (App Router)

Libraries:
- React
- Tailwind CSS
- shadcn/ui
- Zustand
- TanStack Query
- React Hook Form
- Zod
- Framer Motion

---

# Mobile Application

Framework:
- React Native
- Expo
- Expo Router

Libraries:
- Zustand
- TanStack Query

---

# Desktop Application

Framework:
- Electron

UI:
- Next.js

---

# Backend

Framework:
- NestJS

Architecture:
- Modular Monolith
- Clean Architecture
- Domain-Driven Design

---

# Database

## Operational Database

**Original (Deployed):**
- PostgreSQL
- Prisma ORM

**Migration Target (In Progress):**
- Cloud Firestore (flat root collections)
- Firebase Authentication (identity)

## Vector Search

- pgvector (unchanged, independent service)

---

# Cache

- Redis

---

# Queue System

- BullMQ

---

# File Storage

Production:
- Cloudflare R2

Development:
- MinIO

---

# Authentication

## Original (Deployed)

- JWT
- Refresh Tokens
- RBAC

## Migration Target (In Progress)

- Firebase Authentication
- Firebase Session Cookies
- Firebase Custom Claims (RBAC)

---

# Artificial Intelligence

- OpenAI API
- LangChain
- RAG
- pgvector

---

# Notifications

- Firebase Cloud Messaging
- WhatsApp Business API
- Resend Email

---

# Payments

- Paymob
- Fawry
- Stripe (Future)

---

# Real-time Communication

- Socket.IO

---

# Testing

- Jest
- Playwright

---

# Code Quality

- ESLint
- Prettier
- Husky
- lint-staged

---

# DevOps

- Docker
- GitHub Actions

---

# Monitoring

- Sentry

Analytics:
- PostHog

---

# Development Tools

- Visual Studio Code
- Git
- GitHub
- Postman
- Prisma Studio
- pgAdmin

---

# Design Standards

- Mobile First
- Responsive Design
- RTL Support
- Dark Mode
- Light Mode
- Glassmorphism
- Gamification UI

---

This technology stack is mandatory.

No technology may be replaced without an approved Architecture Decision Record (ADR).
