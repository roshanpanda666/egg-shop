
# 🥚 Egg Shop — User Instructions

Welcome to **Egg Shop**, your all-in-one egg inventory and sales management app. This guide will walk you through every feature so you can get started quickly.

---

## Table of Contents

1. [Creating an Account](#1-creating-an-account)
2. [Logging In](#2-logging-in)
3. [Stock Management (Home Page)](#3-stock-management-home-page)
4. [Selling Eggs](#4-selling-eggs)
5. [Viewing Reports](#5-viewing-reports)
6. [Navigation & Logout](#6-navigation--logout)
7. [Tips & FAQs](#7-tips--faqs)

---

## 0. Developer Setup — Download & Run from GitHub

### Prerequisites

Make sure you have the following installed on your machine:

- **Node.js** (v18 or higher) — [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** — [Download here](https://git-scm.com/)
- A **MongoDB Atlas** account (free tier works) — [Sign up here](https://www.mongodb.com/cloud/atlas)

### Step 1: Clone the Repository

```bash
git clone https://github.com/roshanpanda666/egg-shop.git
cd egg-shop/my-app
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env.local` file in the `my-app` directory:

```bash
touch .env.local
```

Add the following variables to `.env.local`:

```env
MONGODB_USERNAME=your_mongodb_username
MONGODB_PASSWORD=your_mongodb_password
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000
```

> **How to get these values:**
> - **MONGODB_USERNAME / MONGODB_PASSWORD** — From your MongoDB Atlas cluster. Go to **Database Access** in Atlas and create a database user.
> - **NEXTAUTH_SECRET** — Generate a random secret by running:
>   ```bash
>   openssl rand -base64 32
>   ```
> - **NEXTAUTH_URL** — Use `http://localhost:3000` for local development.

### Step 4: Set Up MongoDB Atlas

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free cluster (if you haven't already).
3. Go to **Network Access** → Click **Add IP Address** → Add `0.0.0.0/0` (allows access from anywhere) or add your specific IP.
4. Go to **Database Access** → Create a user with **Read and Write** permissions.
5. Use that username and password in your `.env.local` file.

### Step 5: Run the App

```bash
npm run dev
```

Open your browser and go to **[http://localhost:3000](http://localhost:3000)**.

### Project Structure

```
my-app/
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth login & register endpoints
│   │   ├── eggs/          # Stock CRUD (add/delete crate entries)
│   │   ├── sell/          # Sales CRUD (record/delete sales)
│   │   ├── reports/       # Daily & monthly report generation
│   │   └── settings/      # User preferences (eggs per crate)
│   ├── models/            # Mongoose schemas (Egg, Sale, User)
│   ├── lib/               # Database connection helper
│   ├── components/        # Navbar, SessionProvider
│   ├── sell/              # Sell page
│   ├── reports/           # Reports page
│   ├── login/             # Login page
│   └── register/          # Register page
├── middleware.js           # Route protection (redirects unauthenticated users)
├── .env.local             # Environment variables (not tracked in git)
└── package.json           # Dependencies & scripts
```

### Deploying to Vercel (Optional)

1. Push your code to GitHub.
2. Import the repo in [Vercel Dashboard](https://vercel.com/dashboard).
3. Add the 4 environment variables above (set `NEXTAUTH_URL` to your Vercel domain, e.g. `https://your-app.vercel.app`).
4. In MongoDB Atlas → **Network Access** → allow `0.0.0.0/0` for Vercel's dynamic IPs.
5. Deploy! 🚀

---

## 1. Creating an Account

1. Open the app and click **"Create one"** on the login page (or navigate to `/register`).
2. Fill in the registration form:
   - **Name** — Your display name.
   - **Email** — A valid email address (used to log in).
   - **Password** — Must be at least **6 characters** long.
3. Click **"Create Account"**.
4. You'll be redirected to the login page upon success.

> **Note:** Each user's data is completely separate — your stock, sales, and reports are private to your account.

---

## 2. Logging In

1. Go to the login page (`/login`).
2. Enter your **Email** and **Password**.
3. Click **"Sign In"**.
4. You'll be taken to the **Stock Management** home page.

---

## 3. Stock Management (Home Page)

The home page (`/`) is where you track egg crate purchases.

### Adding a Stock Entry

Fill in the **"Add New Stock Entry"** form:

| Field | Description | Example |
|---|---|---|
| **Crate Price (₹)** | The price you paid per crate | 195.00 |
| **Crates Got** | Number of crates purchased | 5 |
| **Eggs Per Crate** | How many eggs are in each crate (default: 30) | 30 |
| **Date** | The date of purchase (defaults to today) | 2026-02-14 |

- A **Calculation Preview** will appear showing:
  - **Total Eggs** — Crates × Eggs per Crate
  - **Per Egg** — Cost per individual egg
  - **Total Cost** — Grand total for the purchase
- Click **"Add Entry"** to save.

### Viewing & Deleting Entries

- All your stock entries appear in the **"Recent Entries"** table below the form.
- Each row shows: Date, Crate Price, Crates, Eggs/Crate, Total Eggs, Per Egg cost, and Total cost.
- To delete an entry, click the 🗑️ **trash icon** on the right side of the row and confirm the deletion.

---

## 4. Selling Eggs

Navigate to **Sell** from the top navigation bar (or go to `/sell`).

### Current Stock Indicator

At the top of the page, you'll see your **current egg stock**:
- Total eggs available
- Approximate number of crates
- A ⚠️ warning if stock is running low (≤ 30 eggs)
- A ✕ message if stock is empty

### Recording a Sale

The **"Record Sale"** form supports three types of sales:

#### Crate Sales
- **Crates** — Number of full crates being sold
- **Price / Crate (₹)** — Selling price per crate

#### Individual Egg Sales
- **Loose Eggs** — Number of individual eggs being sold
- **Price / Egg (₹)** — Selling price per egg

#### Mixed Sales
You can sell **both crates and loose eggs** in a single transaction!

> **Example:** Selling 3 crates at ₹210/crate + 10 loose eggs at ₹7/egg in one go.

### Sale Preview

Before submitting, a **Sale Preview** shows:
- **Total Eggs** being sold
- **Avg / Egg** — effective price per egg
- **Total Revenue** from the sale

Set the **Date** and click **"Record Sale"** to save.

### Sales History

All past sales are displayed in the **"Sales History"** table showing:
- Date, Crates sold, Loose Eggs sold, Total Quantity, Avg per Egg, and Revenue.
- Click the 🗑️ **trash icon** to delete any sale entry.

---

## 5. Viewing Reports

Navigate to **Reports** from the top navigation bar (or go to `/reports`).

### Generating a Report

1. Choose the **Report Type**:
   - 📅 **Daily** — Report for a specific date
   - 🗓️ **Monthly** — Report for an entire month
2. Select the **date or month** using the date picker.
3. Click **"Generate Report"**.

### Report Summary Cards

The report displays key metrics in summary cards:

| Metric | Description |
|---|---|
| 📦 Crates Purchased | Number of crates bought in the period |
| 🥚 Eggs Purchased | Total eggs purchased |
| 💸 Purchase Cost | Total money spent on purchases |
| 🏷️ Avg Cost/Egg | Average cost per egg purchased |
| 🛒 Crates Sold | Number of crates sold |
| 🥚 Eggs Sold | Total eggs sold |
| 💰 Revenue | Total sales revenue |
| 🏷️ Avg Sale/Egg | Average selling price per egg |
| 📈 Profit / Loss | Revenue minus Purchase Cost |
| 🥚 Current Stock | Remaining eggs in inventory |

### Detailed Tables

Below the summary, you'll see:
- **Purchases Table** — Breakdown of all purchases in the period
- **Sales Table** — Breakdown of all sales in the period

### Downloading as PDF

Click the **"Download PDF"** button next to the report title to save a formatted PDF of the report for your records.

---

## 6. Navigation & Logout

The **navigation bar** at the top of every page contains links to:
- 🏠 **Home** (Stock Management)
- 💰 **Sell** (Sell Eggs)
- 📊 **Reports** (View Reports)
- 🚪 **Logout** button

On **mobile devices**, tap the ☰ **hamburger menu icon** to expand the navigation links.

---

## 7. Tips & FAQs

### 💡 Tips
- **Eggs Per Crate** defaults to 30 but can be changed per entry if your supplier uses different crate sizes.
- Use the **Calculation/Sale Preview** to double-check numbers before submitting.
- Generate **monthly reports** at the end of each month to track your overall profit.
- Download PDFs to keep offline records for accounting.

### ❓ FAQs

**Q: Can I edit an entry after saving it?**
A: Currently, you can only delete and re-add entries. Click the trash icon to delete, then add a new corrected entry.

**Q: Is my data shared with other users?**
A: No. Each account has fully isolated data. Other users cannot see your stock, sales, or reports.

**Q: What happens if I sell more eggs than I have in stock?**
A: The app tracks your stock and prevents sales when stock is empty. You'll see a warning when stock is running low.

**Q: Can I use this app on my phone?**
A: Yes! The app is fully responsive and works on mobile browsers. Use the hamburger menu to navigate.

---

*Happy selling! 🥚🎉*
