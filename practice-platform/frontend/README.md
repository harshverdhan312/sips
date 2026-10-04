# SIPS Practice Platform — Minimal Frontend

## Overview
Minimal React + Vite frontend for verifying Practice Platform connectivity, health status, and future practice/contest modules.

## Tech Stack
- React 18
- Vite
- Pure CSS / Modular Components

## Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Practice Platform Backend API Base URL | `http://localhost:5050` |

## Getting Started
```bash
npm install
npm run dev
```
Runs at `http://localhost:5174`.
