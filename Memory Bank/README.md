# Roomzy - Memory Bank

## Project Overview

**Project Name:** Roomzy  
**Stack:** MERN (MongoDB, Express.js, React, Node.js)  
**Type:** Production-ready roommate finding platform  
**Implementation:** Week-by-week based on SOW

### Product Goal
Roomzy is a **roommate matching platform**. It does NOT list properties. Users connect directly based on compatibility, trust score, and preferences.

### Intent System
Users must select ONE intent at registration:
- `have_room_need_roommate` - Has a room/flat and needs a roommate
- `looking_for_roommate` - Needs a room/flat with a roommate

**Matching Rule:** Opposite intents match. A "have_room" user matches with a "looking_for" user in the same city.

---

## Project Structure

```
roomzy/
├── backend/           # Node.js + Express API
├── frontend/          # React + Vite client
└── Memory Bank/       # This document
```

---

## 1. Authentication & Profile System

### Profile Fields (used for matching)
- Budget range
- Location preference (map radius)
- Sleep time
- Smoking / Drinking
- Veg / Non-veg
- Cleanliness (1–5)
- Guests allowed
- Work from home
- Gender preference
- Language
- Personality type (introvert/extrovert)
- Noise tolerance (1–5)
- AC preference
- Pets
- Religion (optional)
- Move-in date
- Preference weight sliders

---

## 2. ID Verification System

**Verification Flow:**
1. User uploads Government ID
2. Capture selfie for face match
3. Verification via Onfido or Sumsub API
4. If successful, `isVerified` set to true

**Blockchain Proof:**
- Generate hash: `SHA256(userId + verificationId + timestamp)`
- Store hash on Ethereum blockchain
- Save `verificationHash` in database
- No personal data stored on chain

---

## 3. Room Listings Module

**Two user intents:**
- Looking for roommate
- Looking for room

**Listing fields:**
- Photos
- Rent
- Deposit
- Amenities
- Room rules
- Geo location (latitude, longitude)

**Map-based discovery using Google Maps**

---

## 4. Smart Matching Engine (User-to-User ONLY)

** Matching is between users, NOT listings.

**Matching logic:**
1. Filter by same city
2. Filter by **opposite intent** (have_room ↔ looking_for)
3. Move-in date within ±15 days
4. Trust score ≥ 30 required
5. Calculate compatibility score based on:
   - Budget match
   - Sleep schedule match
   - Cleanliness difference
   - Food habit (veg/non-veg)
   - Gender preference
   - Noise tolerance
   - Personality match

**Output:** Top 20 matches sorted by score with breakdown

**Trust Gate:** Users with trustScore > 30 can chat and interact.

---

## 5. Chat System

- Real-time chat using Socket.io
- Users with trustScore > 30 can chat
- Block and report functionality

---

## 6. Safety System

- Report user
- Block user
- Admin dashboard
- Suspicious activity flagging

---

## 7. Must-Have Enhancements

- Compatibility score display with breakdown
- Trust score (0–100)
- Move-in timeline matching
- Preference weight sliders affecting algorithm
- Reviews after staying together
- Map view for user discovery (removed - not a listing app)

---

## 8. AI Roommate Personality Summary

- Preferences JSON sent to OpenAI API
- Human-readable summary stored in `aiSummary`
- Displayed on user profiles

---

## 9. Rental Agreement PDF

- Generated when two users agree to stay together
- Includes: names, rent split, rules, move-in date
- Downloadable agreement

---

## 10. MongoDB Collections

### Users
```javascript
{
  name, email, password,
  isVerified, verificationHash,
  preferences, preferenceWeights,
  moveInDate, city,
  trustScore, aiSummary
}
```

### Listings
```javascript
{
  ownerId,
  location (GeoJSON),
  rent, deposit,
  photos, rules
}
```

### Matches
```javascript
{
  userA, userB,
  compatibilityScore, breakdown
}
```

### Reviews
```javascript
{
  reviewerId, reviewedUserId,
  ratings, comment
}
```

### Chats
```javascript
{
  participants, messages
}
```

### Reports
```javascript
{
  reportedUser, reason, status
}
```

---

## 11. Security Rules

- Password hashing with bcrypt
- JWT middleware
- Rate limiting
- Input validation
- Image validation
- Trust score > 30 required to chat

---

## 12. Layered Trust Architecture (Replaces Mandatory ID Verification)

**Philosophy:** Government ID is optional. Users build trust through multiple layers.

**Trust Score Calculation (0-100+):**
| Layer | Points | Description |
|-------|--------|-------------|
| Email verified | +10 | Already done via email OTP |
| Phone OTP | +20 | Phone number verified with OTP |
| Selfie Liveness | +20 | Real-person selfie verification |
| Social Links | +10 max | LinkedIn/Instagram (5 pts each, max 2) |
| Roommate Reviews | +30 max | After staying together (10 pts each, max 3) |
| Government ID | +10 (optional) | Aadhar/PAN/Passport upload |

**Total possible:** 100+ points

**Trust Gate:** 30+ trust points required to:
- Post room listings
- Chat with other users

**Routes Added:**
- `/api/otp/send` - Send phone OTP
- `/api/otp/verify` - Verify phone OTP (+20)
- `/api/liveness/capture` - Capture selfie
- `/api/liveness/verify` - Verify liveness (+20)
- `/api/social/save` - Save social links (+5 each)
- `/api/social/my-links` - Get social links

**Frontend Pages:**
- `/otp-verify` - Phone OTP verification
- `/liveness-verify` - Selfie liveness capture
- `/social-links` - LinkedIn/Instagram links

---

## 13. Key APIs

- Authentication APIs (Register, Login, JWT)
- Profile and Preferences APIs
- Verification API (optional)
- **OTP API (NEW)**
- **Liveness API (NEW)**
- **Social Links API (NEW)**
- Matches API
- Listings Nearby API
- Reviews API
- Trust score API
- Agreement PDF API
- Chat via Socket.io
- Admin and report APIs

---

## Technology Versions

| Package | Version |
|---------|---------|
| Node.js | 18.x LTS |
| MongoDB | 6.x |
| React | 18.x |
| Express | 4.x |
| Vite | 5.x |

---

## Development Phases (Week-by-Week)

### Week 1: Project Setup & Infrastructure
- [x] Initialize repository with proper structure
- [x] Setup MongoDB connection with Mongoose
- [x] Configure Express server with middleware
- [x] Setup React + Vite frontend
- [x] Configure ESLint, Prettier, TypeScript

### Week 2: Authentication System
- [x] User registration (email/password)
- [x] JWT-based authentication
- [x] Login/Logout functionality
- [x] Email verification (OTP/link via nodemailer)
- [x] Password reset flow
- [x] Protected routes
- [x] Government ID upload (masked Aadhar)
- [x] Selfie capture

### Week 3: User Profiles & Preferences
- [x] Profile CRUD operations
- [x] Profile photo upload
- [x] Deep preference settings (all fields)
- [x] Preference weight sliders
- [x] Bio and details management
- [x] Move-in date and city

### Week 4: Layered Trust System (REPLACES Week 4 ID Verification)
- [x] **Layered trust model** - ID optional, trust built via multiple layers
- [x] **Phone OTP route** (`/api/otp`) - Verify phone (+20 trust)
- [x] **Liveness route** (`/api/liveness`) - Selfie capture (+20 trust)
- [x] **Social links route** (`/api/social`) - LinkedIn/Instagram (+10 max)
- [x] **trustScoreUpdated utility** - Recalculates total trust
- [x] **trustScoreRequired middleware** - 30+ trust to post/chat
- [x] **Frontend pages** - OTP, Liveness, SocialLinks pages
- [x] Security: Rate limiting, sanitization, static file serving

### Week 5: Roommate Matching
- [x] **Matching algorithm** - Filter by city, move-in ±15 days
- [x] **Filter by city and move-in date** - Same city within ±15 days
- [x] **Compatibility score calculation** - Budget, sleep, cleanliness, food, gender, noise, personality
- [x] **Weight sliders integration** - User-configurable preference weights
- [x] **Top 20 matches with breakdown** - Sorted by score with full breakdown
- [x] **Trust-based filtering** - 30+ trust score required (replaces isVerified)

**Files:**
- `/backend/routes/match.js` - Match routes (GET /suggestions, POST /like, POST /pass)
- `/backend/models/Match.js` - Match model
- `/backend/utils/compatibility.js` - Compatibility score calculation
- `/frontend/src/pages/Matches.tsx` - Matches page with tabs
- `/frontend/src/components/MatchCard.tsx` - Match card with breakdown

### Week 6: User Profiles & Intent (DONE - Intent added to User model)
- [x] Intent field in User model: have_room_need_roommate / looking_for_roommate
- [x] Opposite intent matching in /matches/suggestions
- [x] Registration requires intent + city

### Week 7: Chat System (COMPLETE)
- [x] Socket.io setup
- [x] Real-time messaging
- [x] Trust-based access (30+ trust required)
- [x] Block functionality
- [x] Report functionality
- [x] Typing indicators
- [x] Unread message tracking

### Week 8: Trust & Reviews (COMPLETE)
- [x] Reviews after staying (max 3 reviews, +10 pts each)
- [x] Ratings system (overall, cleanliness, communication)
- [x] Admin dashboard
- [x] Report management
- [x] User blocking by admin
- [x] Updated trust calculation: Reviews add up to +30 max

### Week 9: AI & PDF Features (COMPLETE)
- [x] aiSummary generation (auto-generated on preferences save)
- [x] Rental agreement creation (optional)
- [x] PDF generation with pdfkit
- [x] PDF download
- [x] Rent split configuration
- [x] House rules
- [x] Move-in date

**Files:**
- `/backend/routes/agreement.js` - Agreement routes
- `/backend/utils/pdfGenerator.js` - PDF generation
- `/frontend/src/pages/Agreement.tsx` - Agreement form + download
- `/backend/models/Match.js` - Added agreement field

### Week 10: Testing & Deployment
- [ ] Unit and integration tests
- [ ] CI/CD pipeline
- [ ] Production build
- [ ] Deployment

---

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/roomzy
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
NODE_ENV=development
ONFIDO_API_KEY=your_onfido_key
SUMsub_API_KEY=your_sumsub_key
OPENAI_API_KEY=your_openai_key
ETHEREUM_RPC_URL=your_ethereum_rpc
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

---

## Code Standards

1. **Naming:** camelCase for variables, PascalCase for components
2. **Structure:** Feature-based organization
3. **Types:** TypeScript throughout
4. **Error Handling:** Try-catch with proper error responses
5. **Validation:** Input validation on client and server
6. **Security:** Helmet, CORS, rate limiting, sanitization

---

## Git Workflow

1. Create feature branch from `main`
2. Commit with conventional messages
3. Pull request for review
4. Merge after approval

---

*Last Updated: 2026-04-10*
*Status: Week 9 Complete - Ready for Week 10 (Testing & Deployment)*