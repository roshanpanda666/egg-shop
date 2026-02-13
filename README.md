# 🥚 Egg Shop

A full-stack **egg inventory & sales management** application built with Next.js, MongoDB, and NextAuth. Track crate purchases, manage individual and bulk egg sales, and generate financial reports — all with multi-user support.

## Features

- **🔐 Multi-User Auth** — Secure login/register with NextAuth (JWT + bcrypt). Each user's data is fully isolated.
- **📦 Stock Management** — Track crate purchases with configurable eggs-per-crate.
- **💰 Sales System** — Sell by crate, individual eggs, or both in a single transaction.
- **📊 Reports** — Daily/monthly summaries with profit/loss, averages, and PDF download.
- **🗑️ Entry Management** — Delete any stock or sale entry with one click.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | MongoDB Atlas + Mongoose |
| Auth | NextAuth.js (Credentials Provider) |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account

### Setup

```bash
# Clone the repo
git clone https://github.com/roshanpanda666/egg-shop.git
cd egg-shop/my-app

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local   # then fill in your values
```

### Environment Variables

Create a `.env.local` file with:

```env
MONGODB_USERNAME=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000
```

> Generate a secret with: `openssl rand -base64 32`

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import in [Vercel Dashboard](https://vercel.com/dashboard)
3. Add the 4 environment variables above (set `NEXTAUTH_URL` to your Vercel URL)
4. In MongoDB Atlas → **Network Access** → allow `0.0.0.0/0` for Vercel's dynamic IPs

## Project Structure

```
my-app/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth login/register
│   │   ├── eggs/          # Stock CRUD
│   │   ├── sell/          # Sales CRUD
│   │   ├── reports/       # Daily/monthly reports
│   │   └── settings/      # User preferences
│   ├── models/            # Mongoose schemas (Egg, Sale, User)
│   ├── lib/               # DB connection
│   ├── components/        # Navbar, SessionProvider
│   ├── sell/              # Sell page
│   ├── reports/           # Reports page
│   ├── login/             # Login page
│   └── register/          # Register page
└── middleware.js           # Route protection
```
