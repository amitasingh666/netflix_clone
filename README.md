# Mini SaaS Video Streaming Platform

This project contains the source code for a video streaming platform MVP.

## Structure

- `frontend/`: React + Vite + Redux application.
- `backend/`: Node.js + Express API.

## Setup

### Prerequisites
- Node.js (v16+)
- MySQL

### Database Setup
1. Create a MySQL database (default name: `video_streaming_service`).
2. Update `backend/.env` with your DB credentials.
3. Run the setup script:
   ```bash
   cd backend
   node scripts/setup_db.js
   ```

### Backend
1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start the server:
   ```bash
   npm run dev
   ```

### Frontend
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture
- **Frontend**: React, Redux Toolkit, Tailwind CSS (optional/pending).
- **Backend**: Express, Passport.js, MySQL Session Store.
- **Database**: MySQL.
- **Video Storage**: Local file system (simulated for MVP) serving HLS streams.
