# EuPay Backend

<div align="center">

![EuPay Backend](https://img.shields.io/badge/EuPay-Backend-10b981?style=for-the-badge)

**REST API & Soroban Integration Layer**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Stellar](https://img.shields.io/badge/Built%20on-Stellar-7D00FF?logo=stellar)](https://stellar.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://typescriptlang.org)

[Overview](#-overview) • [Quick Start](#-quick-start) • [API Reference](#-api-reference) • [Contributing](#-contributing)

</div>

---

## 📖 Overview

EuPay Backend is the REST API and integration layer for the EuPay payroll protocol. It bridges the frontend and mobile apps with Soroban smart contracts on the Stellar network, providing stream management, employer dashboard data, and worker claim endpoints.

---

## ✨ Features

- **Stream Management** — Create, cancel, and query payroll streams
- **Employer API** — Treasury balance and workforce overview endpoints
- **Worker API** — Earnings claims and stream history
- **Soroban RPC Integration** — Direct contract calls via `@stellar/stellar-sdk`
- **Input Validation** — All inputs validated with Zod schemas
- **Health Checks** — `/health` endpoint for uptime monitoring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend / Mobile Clients           │
└──────────────────┬──────────────────────────┘
                   │ HTTP REST
┌──────────────────▼──────────────────────────┐
│         EuPay Backend (Express.js)          │
│   • /api/streams  — Stream CRUD            │
│   • /api/employers — Treasury data         │
│   • /api/workers  — Claims & history       │
│   • /health       — Service status         │
└──────────────────┬──────────────────────────┘
                   │ Soroban RPC
┌──────────────────▼──────────────────────────┐
│         Stellar Network (Testnet/Mainnet)   │
│   • PayrollStream Contract                 │
│   • TreasuryVault Contract                 │
└─────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Framework | Express.js 4 |
| Language | TypeScript 5 |
| Validation | Zod |
| Blockchain | Stellar / Soroban SDK |
| Process Manager | PM2 (production) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- A Stellar testnet account with deployed contracts

### Installation

```bash
# Clone the repository
git clone https://github.com/EuStellar-Pay/EuPay-backend.git
cd EuPay-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your contract addresses and Stellar config

# Start development server
npm run dev
```

Server runs at **http://localhost:3001**

### Environment Variables

```env
PORT=3001
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_NETWORK=TESTNET
CONTRACT_PAYROLL_STREAM=<your-contract-id>
CONTRACT_TREASURY_VAULT=<your-contract-id>
```

---

## 📡 API Reference

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |

### Streams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/streams` | List all streams |
| POST | `/api/streams` | Create a new payroll stream |
| GET | `/api/streams/:id` | Get stream by ID |
| DELETE | `/api/streams/:id` | Cancel a stream |

### Employers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employers` | List employers |
| GET | `/api/employers/:address/treasury` | Get treasury balance |

### Workers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/workers/:address/streams` | Get worker's streams |
| POST | `/api/workers/:address/claim` | Claim earned salary |

---

## 📁 Project Structure

```
src/
├── routes/
│   ├── health.ts       # Health check endpoint
│   ├── streams.ts      # Payroll stream CRUD
│   ├── employers.ts    # Employer data endpoints
│   └── workers.ts      # Worker claim endpoints
├── services/
│   └── stellarService.ts  # Soroban RPC integration
└── index.ts            # Express app bootstrap
```

---

## 🤝 Contributing

See [Contributing Guide](../CONTRIBUTING.md).

---

## 📜 License

Apache 2.0 — see [LICENSE](LICENSE)

---

## 👥 Past Contributors

| GitHub | Role |
|--------|------|
| [@Uchechukwu-Ekezie](https://github.com/Uchechukwu-Ekezie) | Past Contributor |
| [@bakarezainab](https://github.com/bakarezainab) | Past Contributor |
| [@Gbangbolaoluwagbemiga](https://github.com/Gbangbolaoluwagbemiga) | Past Contributor |
| [@Wilfred007](https://github.com/Wilfred007) | Past Contributor |
| [@meshackyaro](https://github.com/meshackyaro) | Past Contributor |
| [@ogazboiz](https://github.com/ogazboiz) | Past Contributor |
| [@Godbrand0](https://github.com/Godbrand0) | Past Contributor |
| [@Christopherdominic](https://github.com/Christopherdominic) | Past Contributor |
| [@Olowodarey](https://github.com/Olowodarey) | Past Contributor |
| [@emdevelopa](https://github.com/emdevelopa) | Past Contributor |
| [@pope-h](https://github.com/pope-h) | Past Contributor |
| [@DeborahOlaboye](https://github.com/DeborahOlaboye) | Past Contributor |
| [@Rampop01](https://github.com/Rampop01) | Past Contributor |
| [@LaGodxy](https://github.com/LaGodxy) | Past Contributor |
| [@AbelOsaretin](https://github.com/AbelOsaretin) | Past Contributor |
| [@7maylord](https://github.com/7maylord) | Past Contributor |
| [@Jayy4rl](https://github.com/Jayy4rl) | Past Contributor |
| [@CMI-James](https://github.com/CMI-James) | Past Contributor |
| [@edehvictor](https://github.com/edehvictor) | Past Contributor |

<div align="center">

**Built with ❤️ on Stellar**

[EuStellar-Pay Organization](https://github.com/EuStellar-Pay) • [Frontend](https://github.com/EuStellar-Pay/EuPay-frontend) • [Mobile](https://github.com/EuStellar-Pay/EuPay-mobile) • [Smart Contracts](https://github.com/EuStellar-Pay/EuPay-smartcontract)

</div>

## Development Status
Active development — see [issues](https://github.com/EuStellar-Pay/EuPay-backend/issues) for roadmap.
