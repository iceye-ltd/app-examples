# ICEYE Catalog Explorer

> Part of [ICEYE App Examples](https://github.com/iceye-ltd/app-examples) - Example applications demonstrating ICEYE API integration

A demo application showing how to integrate with ICEYE's Catalog API to browse, search, and purchase satellite imagery.

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Node](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

> **Disclaimer:** This is a demo application for educational purposes. It is not intended for production use as-is. Support is provided on a best-effort basis. Before deploying to production, implement proper security measures, error handling, logging, monitoring, and follow your organization's security and compliance requirements.

---

## Overview

This demo application shows how to work with the ICEYE Catalog API to discover, evaluate, and purchase satellite imagery.

**Companion Guide:** Follow along with the step-by-step tutorial: [Build a Catalog Application](https://docs.iceye.com/constellation/api/how-to/build-catalog-application/)

### How It Works

1. **Explore the Catalog** - Search the ICEYE public catalog by bounding box, date range, and collection. View results on an interactive map and inspect STAC item metadata.
2. **Get Pricing** - Check the price of a frame before purchasing.
3. **Purchase Frames** - Buy imagery directly from the catalog.
4. **My Images** - Browse your private image collection and view purchase history with product details.

**Use this to:** Learn the ICEYE Catalog API workflow, prototype your own application, or as a reference implementation.

---

## Quick Start

### Prerequisites

- Python 3.10+ (with pip)
- Node.js 18+ (with npm)
- ICEYE API credentials

**Note:** All Python dependencies (including uvicorn server) are installed via `pip install -r requirements.txt`

### 1. Clone & setup

```bash
git clone https://github.com/iceye-ltd/app-examples
cd app-examples/catalog-explorer

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

**That's it!**

---

## Tech Stack

**Frontend:**
- React 18 + Vite 7
- Leaflet (interactive maps)
- OpenStreetMap (no API key required)

**Backend:**
- Python 3.10+ with FastAPI
- Uvicorn ASGI server
- OAuth2 client credentials flow
- Token caching

## Project Structure

```
catalog-explorer/
├── backend/              # FastAPI backend
│   ├── .env.example     # Environment template (COPY TO .env)
│   ├── api/
│   │   ├── main.py      # App entry point
│   │   ├── config.py    # Environment variable loading
│   │   ├── errors.py    # Shared error handling
│   │   └── routes/      # API endpoints
│   │       ├── auth.py       # OAuth2 token management
│   │       ├── catalog.py    # Browse, search, pricing
│   │       ├── contracts.py  # Contract listing
│   │       └── purchases.py  # Purchase workflow
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

## API Endpoints Proxied

| Backend Route | ICEYE API | Description |
|---|---|---|
| `GET /api/contracts` | `GET /company/v1/contracts` | List contracts |
| `GET /api/catalog/items` | `GET /catalog/v2/items` | Browse catalog |
| `POST /api/catalog/search` | `POST /catalog/v2/search` | Search with filters |
| `GET /api/catalog/price` | `GET /catalog/v2/price` | Get frame price |
| `POST /api/purchases` | `POST /catalog/v2/purchases` | Purchase a frame |
| `GET /api/purchases` | `GET /catalog/v2/purchases` | List purchases |
| `GET /api/purchases/:id` | `GET /catalog/v2/purchases/:id` | Get purchase status |
| `GET /api/purchases/:id/products` | `GET /catalog/v2/purchases/:id/products` | List purchase products |

## Contributing

Contributions are welcome!

**To contribute:**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Use Cases

This demo is perfect for:

- **Learning** - Understand how the ICEYE Catalog API works
- **Prototyping** - Build your own catalog browsing application
- **Reference** - See concrete patterns for API integration
- **Starting Point** - Customize for your specific needs

## License

MIT License - see [LICENSE](../LICENSE) file for details.

## Support

- **Issues:** [GitHub Issues](https://github.com/iceye-ltd/app-examples/issues)
- **ICEYE Docs:** https://docs.iceye.com/constellation/api/
