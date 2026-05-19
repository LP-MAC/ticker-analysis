# Quick-Start Deployment Checklist

## ✅ Before pushing to GitHub

- [ ] `.gitignore` exists in project root (copy from outputs if needed)
- [ ] `package.json` has `"type": "module"` and `"start"` script
- [ ] `npm install` runs without errors locally
- [ ] `tickers.json` exists in project root with valid JSON
- [ ] `frontend/` directory exists with its own `package.json`
- [ ] `npm start` runs locally without crashing
- [ ] Test: `curl http://localhost:3001/api/tickers` returns JSON

## ✅ Push to GitHub

```bash
# Add and commit
git add .
git commit -m "Initial commit: ticker analysis backend"

# Create repo on github.com, then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ticker-analysis.git
git push -u origin main
```

## ✅ Deploy to Render

1. Go to **render.com** (sign up with GitHub)
2. **New** → **Web Service**
3. Select your `ticker-analysis` repo
4. Fill in:
   - **Build Command:** `npm install && cd frontend && npm install && npm run build && cd ..`
   - **Start Command:** `node server.js`
   - Everything else: defaults
5. Click **Create Web Service**
6. Wait for "Live" status
7. Test: Visit `https://YOUR-APP.onrender.com/api/tickers`

## ⚠️ Known Issues & Fixes

### If build fails:
- Check `package.json` syntax (valid JSON)
- Ensure `frontend/package.json` also exists and has `npm run build` script

### If app crashes on startup:
- Check logs in Render dashboard
- Fix the Express wildcard route (see deploy-guide.md)
- Ensure `frontend/dist/` was built

### If API returns errors:
- Yahoo Finance rate-limiting (wait 5 minutes, retry)
- Check Render logs for details
- Local test: `npm start` works but Render fails? Could be IP-blocking by Yahoo

## 📞 Common Commands

```bash
# Local testing
npm start                    # Start server
npm run dev                  # Start with file watcher

# Git workflow
git status                   # Check changes
git add .                    # Stage all
git commit -m "message"      # Commit
git push origin main         # Push to GitHub

# Render monitoring
# Dashboard → Logs → watch for errors in real-time
```

## 🎯 Your Public URL
After deploy: `https://YOUR-APP.onrender.com`

Endpoints:
- `GET /api/tickers` — All tickers
- `GET /api/ticker/SPY` — Single ticker

---

Good luck! Any issues, check the deploy-guide.md for troubleshooting details.
