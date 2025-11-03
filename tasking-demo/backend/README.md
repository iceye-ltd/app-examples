# ICEYE Tasking Demo - Backend

FastAPI backend that proxies requests to ICEYE APIs and handles OAuth2 authentication.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your ICEYE credentials
```

### 3. Run the Server

```bash
uvicorn api.main:app --reload
```

Server runs on `http://localhost:8000`

API docs available at `http://localhost:8000/docs`

---

## Environment Variables

```bash
# ICEYE API Credentials
ICEYE_CLIENT_ID=your-client-id
ICEYE_CLIENT_SECRET=your-client-secret

# ICEYE API Endpoints
ICEYE_API_URL=https://platform.iceye.com/api
ICEYE_AUTH_URL=your-oauth-token-url-here

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173
```

---

## API Endpoints

### Contracts
- `GET /api/contracts` - List all contracts
- `GET /api/contracts/{id}` - Get contract details
- `GET /api/contracts/{id}/summary` - Get contract summary

### Tasks
- `POST /api/tasks` - Create new task
- `GET /api/tasks/{id}` - Get task status
- `GET /api/tasks/{id}/products` - Get task products
- `GET /api/tasks/{id}/scene` - Get scene details
- `PATCH /api/tasks/{id}` - Cancel task

Full API documentation: `http://localhost:8000/docs`

---

## Project Structure

```
backend/
├── api/
│   ├── routes/
│   │   ├── auth.py         # OAuth2 token handling
│   │   ├── contracts.py    # Contract endpoints
│   │   └── tasks.py        # Task endpoints
│   └── main.py             # FastAPI app
├── .env.example            # Template
├── .env                    # Your configuration (not tracked)
└── requirements.txt        # Dependencies
```

---

## Troubleshooting

### "Authentication failed"
- Check `ICEYE_CLIENT_ID` and `ICEYE_CLIENT_SECRET`
- Verify `ICEYE_AUTH_URL` is correct
- Test credentials manually:
```bash
curl -X POST "$ICEYE_AUTH_URL" \
  -u "$ICEYE_CLIENT_ID:$ICEYE_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

### "Failed to fetch contracts"
- Verify `ICEYE_API_URL=https://platform.iceye.com/api`
- Check backend logs for detailed error

### CORS errors
- Verify `FRONTEND_URL=http://localhost:5173` in `.env`

---

## Security

- ✅ Never commit `.env` files with credentials
- ✅ Use environment variables in production deployment
