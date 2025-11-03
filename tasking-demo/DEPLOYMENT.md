# Deployment Guide

This guide explains what you need to change in this demo app to deploy it to production.

> **⚠️ Important:** This demo is designed for educational purposes. Before deploying to production, implement proper security measures, monitoring, and follow your organization's security and compliance requirements.

---

## Understanding the Development Setup

During development (`npm run dev`), the Vite proxy automatically forwards API requests:

```
Frontend: http://localhost:5173
Backend:  http://localhost:8000
Vite proxy: /api/* → http://localhost:8000/api/*
```

**The Vite proxy only works during development.** For production, you need to choose one of two approaches:

---

## Option 1: Same domain (recommended - No code changes)

Deploy both frontend and backend on the same domain using a reverse proxy.

**Example:**
```
https://yourdomain.com/          → Frontend (static files)
https://yourdomain.com/api/*     → Backend (FastAPI)
```

**What you need to do:**
1. Build the frontend: `cd frontend && npm run build`
2. Configure your reverse proxy (nginx, Caddy, cloud provider, etc.) to:
   - Serve frontend static files from `frontend/dist/`
   - Forward `/api/*` requests to your backend server
3. Update `backend/.env` with your production frontend URL:
   ```
   FRONTEND_URL=https://yourdomain.com
   ```

**That's it!** No code changes needed in the demo app.

---

## Option 2: Separate domains (requires code changes)

Deploy frontend and backend on different domains.

**Example:**
```
Frontend: https://app.yourdomain.com
Backend:  https://api.yourdomain.com
```

### Required changes:

#### 1. Update Frontend API Client

Edit `frontend/src/lib/api.js`:

```javascript
// Change this line:
const API_BASE = '/api'

// To this:
const API_BASE = import.meta.env.VITE_API_URL || '/api'
```

#### 2. Set Environment Variable

Create `frontend/.env.production`:
```
VITE_API_URL=https://api.yourdomain.com/api
```

Or set it during build:

```bash
VITE_API_URL=https://api.yourdomain.com/api 
npm run build
```

#### 3. Update Backend CORS

Edit `backend/.env`:
```
FRONTEND_URL=https://app.yourdomain.com
```

---

## Environment Variables for Production

### Backend (`backend/.env`)

```bash
# ICEYE API Credentials (provided by ICEYE)
ICEYE_CLIENT_ID=your-client-id
ICEYE_CLIENT_SECRET=your-client-secret

# ICEYE API URLs (provided by ICEYE - customer-specific)
ICEYE_API_URL=https://platform.iceye.com/api
ICEYE_AUTH_URL=your-oauth-token-url-here

# Your production frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com
```

### Frontend (Only for Option 2)

Create `frontend/.env.production`:
```bash
# Backend API URL (only needed if deploying on separate domain)
VITE_API_URL=https://api.yourdomain.com/api
```

---

## Testing Your Deployment

1. **Check backend is accessible:**
   ```bash
   curl https://yourdomain.com/api/contracts
   ```

2. **Check frontend loads:**
   ```bash
   curl https://yourdomain.com/
   ```

3. **Test in browser:**
   - Open your frontend URL
   - Open browser console (F12)
   - Try selecting a contract
   - Check for any CORS or connection errors

---

## Common Issues

### "Failed to fetch contracts"

**Cause:** Frontend can't reach backend

**Check:**
- **Option 1:** Is your reverse proxy correctly forwarding `/api/*` to the backend?
- **Option 2:** Is `VITE_API_URL` set correctly and is the backend URL accessible?
- Open browser console and check the actual URL being called

### CORS Errors

**Cause:** Backend doesn't allow requests from your frontend domain

**Fix:**
- Update `backend/.env`: `FRONTEND_URL=https://your-actual-frontend-domain.com`
- Restart the backend
- Clear browser cache

### Authentication Fails

**Cause:** Invalid ICEYE credentials or URLs

**Fix:**
- Verify `ICEYE_CLIENT_ID`, `ICEYE_CLIENT_SECRET`, and `ICEYE_AUTH_URL` in `backend/.env`
- These values are customer-specific and provided by ICEYE


---

## Non exhaustive security checklist

Before deploying to production:

- [ ] Use HTTPS for both frontend and backend
- [ ] Never commit `.env` files to git
- [ ] Set `FRONTEND_URL` to your actual domain (not `*`)
- [ ] Use a secrets manager for sensitive credentials (not `.env` files)
- [ ] Review and restrict CORS settings in `backend/api/main.py` if needed
- [ ] Add rate limiting to your backend
- [ ] Set up logging and monitoring
- [ ] Follow your organization's security and compliance requirements

---

## Summary

**For Option 1 (Same domain):**
- ✅ No code changes needed
- ✅ Configure your reverse proxy
- ✅ Update `FRONTEND_URL` in backend `.env`

**For Option 2 (Separate domains):**
- ✅ Add environment variable support to `frontend/src/lib/api.js`
- ✅ Set `VITE_API_URL` during frontend build
- ✅ Update `FRONTEND_URL` in backend `.env`

The rest (hosting, infrastructure, scaling, etc.) is up to your deployment environment and requirements.
