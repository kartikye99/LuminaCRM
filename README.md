# ✨ LuminaCRM — AI-Native Mini CRM

An AI-native dashboard built with **React, Vite, Express/Hono, and PostgreSQL** to manage customer data, dynamically segment shoppers, generate campaign ideas using AI (Gemini), and track delivery performance via asynchronous callback simulation loops.

---

## 📂 Project Directory Structure

To help you easily locate the files you need, here is the organized structure of the project:

```text
anything/
│
├── 🗄️ database/                  # DATABASE DIRECTORY
│   ├── schema.sql                # PostgreSQL table schema definitions
│   └── seed.sql                  # Initial mock customer insert statements
│
├── 🖥️ apps/
│   └── web/                      # MAIN WEB APP REPOSITORY
│       ├── __create/             # Hono web server runner config
│       │   ├── index.ts          # Server entry point & startup hooks
│       │   └── route-builder.ts  # Automatic route scanning logic
│       │
│       ├── src/
│       │   ├── app/
│       │   │   ├── api/          # ⚙️ BACKEND API DIRECTORY (Hono Routes)
│       │   │   │   ├── analytics/     # Analytics aggregator route
│       │   │   │   ├── callback/      # Delivery webhook status callback route
│       │   │   │   ├── campaigns/     # Campaign management and send simulation loop
│       │   │   │   ├── customers/     # Customer list and ingest routes
│       │   │   │   ├── segments/      # Segments management & Gemini Strategist suggest
│       │   │   │   └── utils/         # Database drivers (pg wrapper) & auto-migrations
│       │   │   │
│       │   │   ├── dashboard/     # 🖥️ FRONTEND PAGES DIRECTORY (React Components)
│       │   │   │   └── page.jsx   # Fully responsive CRM dashboard UI
│       │   │   │
│       │   │   ├── root.tsx       # Root layout, head tags, and global style wrappers
│       │   │   └── routes.ts      # React Router file-based configuration
│       │   │
│       │   ├── index.css          # Core styles & Tailwind imports
│       │   └── main.tsx           # Client entrypoint
│       │
│       ├── .env                  # Environment secrets (DATABASE_URL, GEMINI_API_KEY)
│       ├── package.json          # Node dependencies
│       └── vite.config.ts        # Bundler configuration
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or above)
- **PostgreSQL** (running locally on port `5432`)

### 2. Database Setup
Create a local database named `luminacrm` inside your PostgreSQL server:
```sql
CREATE DATABASE luminacrm;
```
*(On initial launch, the Hono backend server automatically runs schema migrations and seeds the database with 50 mock customer profiles, so no manual imports are required).*

### 3. Environment Variables Config
Create or edit `apps/web/.env` and add your database and AI configurations:
```env
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/luminacrm
GEMINI_API_KEY=your_google_gemini_api_key_here
```
*(If no Gemini API key is configured, the application falls back to a rules-based smart strategist segment builder).*

### 4. Running the Development Server
Install dependencies and run the server:
```bash
# Navigate to web app
cd apps/web

# Install packages
npm install

# Run dev server
npm run dev
```
Open **`http://localhost:4000/`** in your browser to view the application.

---

## 🛠️ Stack Breakdown

### Frontend UI (React + Vite)
- **Dashboard UI**: Located in `apps/web/src/app/dashboard/page.jsx`. Built to be fully responsive for narrow and wide screens (with hamburger toggles, adaptive grids, and scrollable data tables).
- **Navigation Tabs**: Features **Overview** (real-time stats & charts), **Segments** (AI strategist segment builder), **Campaigns** (lists and launch triggers), and **Insights** (customer database browser).

### Backend (Hono)
- **Colocated APIs**: Located in `apps/web/src/app/api/`. Uses Hono for high-performance serverless-style routing.
- **Mock Delivery Simulation**: Triggers a webhook dispatch callback loop in the background, simulating delivery rates (`delivered`, `opened`, `clicked`) with randomized delays.

### Database (PostgreSQL)
- **Connection Driver**: Uses the standard Node.js `pg` driver for reliable TCP connections.
- **Timezone Safety**: Relative log feeds ("just now", "10s ago") are calculated timezone-agnostically using database-level `EPOCH` intervals.
