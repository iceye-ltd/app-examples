# ICEYE Tasking Demo

> Part of [ICEYE App Examples](https://github.com/iceye-ltd/app-examples) - Example applications demonstrating ICEYE API integration

A demo application showing how to integrate with ICEYE's satellite tasking APIs.

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Node](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

> **⚠️ Disclaimer:** This is a demo application for educational purposes. It is not intended for production use as-is. Before deploying to production, implement proper security measures, error handling, logging, monitoring, and follow your organization's security and compliance requirements.

---

## Overview

This demo application shows how to order satellite imagery from ICEYE using their Tasking API.

### How It Works

1. **Select Contract** → Choose from your available ICEYE contracts
2. **Create Task** → Pick a location on the map and set imaging parameters
3. **Monitor & Download** → Track your task status and download imagery when ready

**Use this to:** Learn the ICEYE API workflow, prototype your own application, or as a reference implementation.

---

## Quick Start

### Prerequisites
- Python 3.9+ (with pip)
- Node.js 18+ (with npm)
- ICEYE API credentials

**Note:** All Python dependencies (including uvicorn server) are installed via `pip install -r requirements.txt`

### 1. Clone & setup

```bash
git clone https://github.com/iceye-ltd/app-examples
cd app-examples/tasking-demo

# Backend Setup
cd backend
cp .env.example .env
# IMPORTANT: Edit .env with your ICEYE credentials before continuing
pip install -r requirements.txt
uvicorn api.main:app --reload

# Frontend Setup (new terminal)
cd frontend
npm install
npm run dev
```

### 2. Open Browser

Navigate to `http://localhost:5173`

**That's it!** 🎉

---

## Tech Stack

**Frontend:**
- React 18 + Vite
- Leaflet (interactive maps)
- OpenStreetMap (no API key required)

**Backend:**
- Python 3.9+ with FastAPI
- Uvicorn ASGI server
- OAuth2 client credentials flow
- Token caching

## Project Structure

```
tasking-demo/
├── backend/              # FastAPI backend
│   ├── .env.example     # Environment template (COPY TO .env)
│   ├── api/
│   │   ├── routes/      # API endpoints
│   │   └── main.py      # App entry point
│   └── requirements.txt
│
└── frontend/            # React frontend
    ├── src/
    │   ├── components/  # React components
    │   ├── lib/         # API client
    │   └── App.jsx      # Main app
    ├── vite.config.js   # Proxy config
    └── package.json
```

## Deployment

Ready to deploy? See **[DEPLOYMENT.md](DEPLOYMENT.md)** for production deployment options:

- **Option 1:** Same domain with reverse proxy (nginx, Docker, cloud providers)
- **Option 2:** Separate domains (requires frontend environment variable)
- Security checklist and troubleshooting guide

## Contributing

Contributions are welcome! 

**To contribute:**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Use Cases

This demo is perfect for:

- **Learning** - Understand how satellite tasking APIs work
- **Prototyping** - Build your own satellite ordering application
- **Reference** - See concrete patterns for API integration
- **Starting Point** - Customize for your specific needs

## License

MIT License - see [LICENSE](../LICENSE) file for details.

## Support

- **Issues:** [GitHub Issues](https://github.com/iceye-ltd/app-examples/issues)
- **ICEYE Docs:** https://docs.iceye.com/constellation/api/
