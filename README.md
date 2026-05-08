# Roomzy — Roommate Finding Platform

A full-stack MERN app for finding compatible roommates using smart compatibility scoring and a layered trust verification system.

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)

### 1. Backend

```bash
cd backend
cp .env.example .env          # Fill in your values
npm install
npm run dev                   # Starts on :5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # Starts on :5173
```

Open `http://localhost:5173`.

---

## Architecture

```
roomzy/
├── backend/
│   ├── blockchain/        # SHA-256 hash + Ethereum storage
│   ├── config/            # MongoDB connection
│   ├── middleware/        # JWT auth, trust gate, admin guard
│   ├── models/            # User, Match, Chat, Review, Report
│   ├── routes/            # All API endpoints
│   ├── sockets/           # Socket.io chat handler
│   ├── tests/             # Jest + Supertest (backend)
│   └── utils/             # AI summary, PDF, trust score, compatibility
└── frontend/
    └── src/
        ├── api/           # Axios client — every backend route mapped 1:1
        ├── components/    # Navbar, UI primitives, ProtectedRoute
        ├── context/       # AuthContext, ToastContext
        ├── hooks/         # useSocket (Socket.io)
        ├── pages/         # Home, Auth, Matches, Chat, Profile, Trust, Admin
        └── test/          # Vitest + MSW (frontend)
```

---

## API Reference

### Auth  `/api/auth`
| Method | Path | Body | Auth |
|--------|------|------|------|
| POST | `/register` | `{ name, email, password, city, intent }` | — |
| POST | `/login` | `{ email, password }` | — |
| GET | `/me` | — | ✓ |
| GET | `/verify-email/:token` | — | — |
| POST | `/resend-verification` | `{ email }` | — |
| POST | `/forgot-password` | `{ email }` | — |
| POST | `/reset-password/:token` | `{ password }` | — |

### Profile  `/api/profile`
| Method | Path | Body | Auth |
|--------|------|------|------|
| GET | `/me` | — | ✓ |
| GET | `/:id` | — | ✓ |
| PUT | `/profile` | `{ name, phone, city, area, bio, dateOfBirth, gender, intent }` | ✓ |
| PUT | `/preferences` | `{ preferences, moveInDate, city, area, intent }` | ✓ |
| PUT | `/weights` | `{ budget, sleepTime, cleanliness, … }` | ✓ |
| PUT | `/photo` | `FormData: profilePhoto` | ✓ |

### Matches  `/api/matches`
| Method | Path | Notes | Auth |
|--------|------|-------|------|
| GET | `/suggestions` | Top 20, opposite intent, same city, ±15d | ✓ |
| GET | `/` | Confirmed matches only | ✓ |
| POST | `/like/:userId` | Mutual like → `isNowMatched: true` | ✓ |
| POST | `/pass/:userId` | Mark rejected | ✓ |

### OTP  `/api/otp`
| Method | Path | Body |
|--------|------|------|
| POST | `/send` | `{ phoneNumber }` — Indian format `[6-9]\d{9}` |
| POST | `/verify` | `{ phoneNumber, otp }` |
| GET | `/status` | — |

### Liveness  `/api/liveness`
| POST | `/capture` | `FormData: selfie` |
| POST | `/verify` | — (runs liveness check, awards +20 pts) |
| GET | `/status` | — |

### Social  `/api/social`
| POST | `/save` | `{ linkedin, instagram, collegeEmail, companyEmail }` |
| GET | `/my-links` | Returns links + trust contribution |

### Verification  `/api/verification`
| POST | `/upload-id` | `FormData: idDocument, idDocumentType, idDocumentNumber` |
| POST | `/verify-id` | Generates blockchain hash |
| GET | `/status` | — |

### Reviews  `/api/reviews`
| POST | `/` | `{ reviewedUserId, ratings, comment, wouldRecommend }` |
| GET | `/user/:userId` | Public endpoint |

### Reports  `/api/reports`
| POST | `/` | `{ reportedUserId, reason, description }` |
| POST | `/block/:userId` | — |
| DELETE | `/unblock/:userId` | — |
| GET | `/blocked` | — |

### Agreements  `/api/agreements`
| POST | `/create` | `{ matchId, rent, rentSplit, rules, moveInDate }` |
| GET | `/download/:matchId` | Returns PDF blob |

### Admin  `/api/admin`  *(admin token required)*
| GET | `/users` | All users |
| GET | `/reports` | All reports |
| PUT | `/reports/:id` | Update report status |
| GET | `/stats` | Platform metrics |

---

## Trust Score System

| Layer | Points | Trigger |
|-------|--------|---------|
| Email verified | +10 | On registration |
| Phone OTP | +20 | `POST /api/otp/verify` |
| Selfie liveness | +20 | `POST /api/liveness/verify` |
| Social links | +2.5 each (max 4) | Manual review |
| Roommate reviews | +10 each (max 3) | `POST /api/reviews` |
| Govt. ID (optional) | +10 | `POST /api/verification/verify-id` |

**30+ points required** to chat and interact with matches.

---

## Socket.io Events

```js
// Client → Server
socket.emit('join', userId)
socket.emit('sendMessage', { senderId, receiverId, content })
socket.emit('markRead', { chatId, userId })
socket.emit('typing', { senderId, receiverId })

// Server → Client
socket.on('newMessage', { chatId, message })
socket.on('messageSent', { chatId, message })
socket.on('messagesRead', { chatId })
socket.on('userTyping', { senderId })
socket.on('error', { message, trustScore? })
```

---

## Running Tests

### Backend Tests (Jest + Supertest + MongoDB Memory Server)

```bash
cd backend
npm install
npm test                    # All tests
npm run test:coverage       # With coverage report
```

**Test files:**
- `tests/unit.compatibility.test.js` — 30+ tests for the scoring engine
- `tests/unit.trustScore.test.js` — 20+ tests for the trust system
- `tests/integration.auth.test.js` — Full auth flow (register, login, verify, reset)
- `tests/integration.matches.test.js` — Matches, OTP, social, reviews

### Frontend Tests (Vitest + Testing Library + MSW)

```bash
cd frontend
npm install
npm test                    # All tests
npm run test:coverage       # With coverage
npm run test:ui             # Interactive UI
```

**Test files:**
- `src/test/unit.api.test.js` — Every API function against MSW mocks (80+ assertions)
- `src/test/integration.pages.test.jsx` — Component render + user interaction tests

---

## Bugs Fixed

| # | File | Bug | Severity |
|---|------|-----|----------|
| 1+2 | `utils/compatibility.js` | `Math.roundScores()` doesn't exist — crashed every match | CRITICAL |
| 3 | `routes/match.js` | Duplicate `$ne`/`$nin` — blocked users never excluded | HIGH |
| 4 | `routes/profile.js` | `user.phone` → `user.phoneNumber` field mismatch | MEDIUM |
| 5+9 | `routes/verification.js` | Wrong blockchain import path + missing export | HIGH |
| 6 | `routes/social.js` | `collegeEmail` trust hardcoded as 2.5 even unverified | MEDIUM |
| 7 | `routes/match.js` | Mutual like logic broken — match never triggered in reverse | CRITICAL |
| 8 | `server.js` | No `/uploads` dir creation — Multer crashes fresh install | MEDIUM |

---

## Design System

**Palette:** Terracotta `#B85C38` · Forest `#2D6A4F` · Slate `#3A5F8A` · Mauve `#7B5EA7`  
**Typography:** Fraunces (display) + Cabinet Grotesk (body) + JetBrains Mono  
**Animation:** CSS keyframes for float, fadeUp, matchPop, confetti, shimmer  
**Components:** Avatar, TrustRing, ScoreRing, CompatBreakdown, MatchModal, SkeletonCard, Toast  
