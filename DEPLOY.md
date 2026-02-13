# Vercel Deployment Guide

Your Egg Shop application is ready for deployment! Follow these steps to host it on Vercel.

## 1. Push to GitHub
If you haven't already, push your code to a GitHub repository:

```bash
# Initialize git (already done)
git add .
git commit -m "Ready for deployment"

# Create a new repository on GitHub (https://github.com/new)
# Then link it here:
git remote add origin https://github.com/YOUR_USERNAME/egg-shop.git
git branch -M main
git push -u origin main
```

## 2. Import Project in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New...** > **Project**
3. Select your `egg-shop` repository and click **Import**

## 3. Configure Environment Variables
On the configuration screen, expand **Environment Variables** and add the following:

| Variable Name | Value | Description |
|---|---|---|
| `MONGODB_USERNAME` | `roshan` | Your MongoDB Atlas username |
| `MONGODB_PASSWORD` | `eggpwd` | Your MongoDB Atlas password |
| `NEXTAUTH_SECRET` | `(generate new)` | Run `openssl rand -base64 32` in terminal to generate |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` | The URL Vercel assigns to your app (add this after deployment if unknown) |

> **Note**: Do NOT add `USERNAME` or `PASSWORD` variables as they conflict with Linux system variables on Vercel. We renamed them to `MONGODB_USERNAME` and `MONGODB_PASSWORD`.

## 4. Deploy
Click **Deploy**. Vercel will build your application.

### ⚠️ Important: MongoDB Network Access
If your build fails or the app can't connect to the database:
1. Go to your [MongoDB Atlas Dashboard](https://cloud.mongodb.com)
2. Go to **Network Access**
3. Add IP Address: `0.0.0.0/0` (Allow Access from Anywhere)
   * This is required because Vercel uses dynamic IP addresses.
