# Deploy Your Financial Analysis Backend to Render

## ✅ Your Situation
- Local git repo already initialized
- GitHub account ready
- git installed
- Ready to push and deploy

---

## Step 1: Prep Your Local Project (2 minutes)

### 1.1 Create `.gitignore` in your project root

If you don't have one, create it now:

```
node_modules/
frontend/node_modules/
frontend/dist/
.env
.DS_Store
*.log
npm-debug.log*
```

**Why:** Keeps your repo small and prevents accidentally pushing secrets or build artifacts.

### 1.2 Verify your `package.json` has these keys

Your root `package.json` should have `"type": "module"` (since you use `import`):

```json
{
  "type": "module",
  "name": "ticker-analysis-backend",
  "version": "1.0.0",
  "description": "Financial ticker analysis with options strategies",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "yahoo-finance2": "^2.11.0"
  }
}
```

If you don't have a `package.json`, create one with the above (adjust version/description as needed).

### 1.3 Confirm `tickers.json` exists and is valid

Your `server.js` expects `tickers.json` in the project root. If you don't have one, create it:

```json
[
  "GLD",
  "SLV",
  "SILJ",
  "SPY",
  "QQQ",
  "IWM",
  "TLT"
]
```

Or with descriptions:

```json
[
  { "symbol": "GLD", "description": "Gold ETF" },
  { "symbol": "SLV", "description": "Silver ETF" },
  { "symbol": "SILJ", "description": "Junior Silver Miners ETF" },
  { "symbol": "SPY", "description": "S&P 500 ETF" },
  { "symbol": "QQQ", "description": "Nasdaq 100 ETF" },
  { "symbol": "IWM", "description": "Russell 2000 ETF" },
  { "symbol": "TLT", "description": "Long-Term Treasury Bond ETF" }
]
```

### 1.4 (Optional but recommended) Fix the Express 5 wildcard route bug

In your `server.js`, change this line:

```javascript
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'frontend/dist', 'index.html'));
});
```

To this (works on Express 4 and 5):

```javascript
app.get(/.*/, (req, res) => {
  res.sendFile(join(__dirname, 'frontend/dist', 'index.html'));
});
```

---

## Step 2: Build Your Frontend & Test Locally (5 minutes)

### 2.1 Install frontend dependencies and build

```bash
cd frontend
npm install
npm run build
cd ..
```

This creates `frontend/dist/` that your server serves.

### 2.2 Install root dependencies

```bash
npm install
```

### 2.3 Test locally

```bash
npm start
```

You should see:
```
Loaded X tickers from configuration.
Backend running on http://localhost:3001
```

Visit `http://localhost:3001/api/tickers` in your browser. If it returns JSON (even if some tickers fail to fetch), you're good. **Ctrl+C** to stop.

---

## Step 3: Push to GitHub (3 minutes)

### 3.1 Check your local repo status

```bash
git status
```

You should see your `server.js`, `package.json`, `tickers.json`, etc. listed as untracked or modified.

### 3.2 Stage and commit

```bash
git add .
git commit -m "Initial commit: ticker analysis backend with options strategies"
```

### 3.3 Create a new empty repo on GitHub

1. Go to **github.com** → top-right **+** → **New repository**
2. **Repository name:** `ticker-analysis` (or whatever you want)
3. **Description:** (optional) "Financial ticker analysis with options strategy recommendations"
4. **Public** or **Private** (your choice; Render works with both)
5. **DO NOT** check "Initialize this repository with a README"
6. Click **Create repository**

### 3.4 Connect and push

GitHub will show you instructions. Run these in your project folder:

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ticker-analysis.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**If you get a credential prompt:**
- Use a **Personal Access Token** (PAT) instead of your password
  - Go to github.com → Settings → Developer settings → **Personal access tokens** → **Tokens (classic)**
  - Generate new token with `repo` scope
  - Paste it as the password when `git push` asks

Done! Your code is now on GitHub.

---

## Step 4: Deploy to Render (5 minutes)

### 4.1 Sign up for Render (if needed)

Go to **render.com** → **Sign up** → use your GitHub account. Authorize it to see your repos.

### 4.2 Create a Web Service

1. Dashboard → **New** → **Web Service**
2. **Repository:** Find and select `ticker-analysis` (or your repo name)
3. Click **Connect**

### 4.3 Configure deployment settings

Fill in these fields:

| Field | Value |
|-------|-------|
| **Name** | `ticker-analysis` (or your preferred app name) |
| **Environment** | `Node` |
| **Build Command** | `npm install && cd frontend && npm install && npm run build && cd ..` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

Leave everything else as default.

### 4.4 Deploy

Click **Create Web Service** at the bottom. Render will:
1. Clone your repo
2. Run the build command
3. Start your server
4. Assign you a public URL like `https://ticker-analysis.onrender.com`

Watch the **Logs** tab. You should see:
```
Loaded 7 tickers from configuration.
Backend running on http://localhost:????
```

(The port is internal; Render sets `PORT` automatically.)

### 4.5 Test your deployment

Once it says **"Live"** at the top, visit:

```
https://ticker-analysis.onrender.com/api/tickers
```

You should get JSON back. **Success!**

---

## Step 5: Know the Gotchas (Important)

### ⚠️ Render's free tier spins down after 15 min of inactivity
- First request after spin-down takes 30 seconds
- Not a problem for production use, annoying for testing
- Upgrade to paid ($7/month) to avoid this

### ⚠️ Yahoo Finance may rate-limit or block your IP
- Render's cloud IPs sometimes trigger Yahoo's anti-bot measures
- If your `/api/tickers` starts returning errors in production but works locally, that's why
- Mitigation options:
  - Use a **residential proxy** (costs money)
  - Cache results in a database (Redis, Postgres) instead of calling Yahoo every time
  - Add retry logic with exponential backoff

### ⚠️ Cold starts are slow
- Your first API call after Render spins down might time out (30s limit)
- Add a "keep-alive" request every 10 minutes (use Uptimerobot.com — free tier works)

### ✅ Environment variables
- Your code reads `process.env.PORT` — Render sets this automatically
- If you add secrets later (API keys, DB URLs), add them in Render dashboard → **Environment**

---

## Step 6: Iterate (as needed)

### Push updates to GitHub
```bash
# Make changes locally
git add .
git commit -m "Your commit message"
git push origin main
```

Render automatically redeploys on every push to `main`.

### Redeploy manually
Render dashboard → your service → **Deployments** → **Manual deploy** → **Deploy latest commit**

---

## Your Public URL
Once live, your backend will be at:

```
https://ticker-analysis.onrender.com
```

API endpoints:
- `GET /api/tickers` — Analyze all tickers
- `GET /api/ticker/:symbol` — Analyze one ticker (e.g., `/api/ticker/SPY`)

---

## Troubleshooting

**"Build failed: npm install"**
- Check your `package.json` syntax (JSON needs valid commas, quotes)
- Run `npm install` locally first to ensure it works

**"Start command failed"**
- Check the logs in Render dashboard
- Ensure `node server.js` runs locally with `npm start`
- Verify `frontend/dist` was built (should be in `.gitignore` but still exist after build)

**"API returns empty array or errors"**
- Yahoo Finance is likely rate-limiting
- Check Render logs: `curl https://ticker-analysis.onrender.com/api/ticker/SPY` from your terminal
- Wait a few minutes and retry (or upgrade to paid tier for better IP reputation)

**"Can't connect to Render URL"**
- Wait 2-3 minutes after deployment — it's still spinning up
- Check the Logs tab in Render dashboard for errors
- Ensure build command actually ran `npm run build` for frontend

---

## Next Steps

1. **Monitor logs** in Render dashboard regularly
2. **Set up caching** if Yahoo Finance becomes unreliable
3. **Add a frontend** or connect this API to your React app
4. **Store data** in a database if you want historical analysis snapshots
5. **Add authentication** if you want to limit API access

Good luck! 🚀
