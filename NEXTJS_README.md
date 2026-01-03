# Semi‑Colonic - Next.js Dashboard

A wellness application dashboard built with Next.js and secure iron-session authentication.

## Features

- 🔐 Secure session management with iron-session
- 🎨 Clean, modern UI with gradient backgrounds
- 📱 Responsive design
- 🚀 Ready for Vercel deployment
- 🔄 Client-server session sync
- 7 feature pages (ready for implementation)

## Prerequisites

- Node.js 18+ and npm
- A secure password for session encryption (32+ characters)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
# Generate a secure password with:
# openssl rand -base64 32

IRON_SESSION_PASSWORD=your_secure_password_at_least_32_characters_long
```

⚠️ **Important**: This environment variable is required for the application to run. In production, the app will throw an error if it's not set.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── pages/
│   ├── api/              # API routes for session management
│   │   ├── login.js      # POST /api/login - Demo login
│   │   ├── logout.js     # POST /api/logout - Destroy session
│   │   └── session.js    # GET /api/session - Get current session
│   ├── features/         # Feature pages (skeleton implementations)
│   │   ├── begin.jsx
│   │   ├── checkin.jsx
│   │   ├── breathe.jsx
│   │   ├── mood.jsx
│   │   ├── tasks.jsx
│   │   ├── progress.jsx
│   │   └── safe-space.jsx
│   ├── index.js          # Landing page
│   ├── login.jsx         # Login page
│   └── dashboard.jsx     # Main dashboard
├── lib/
│   └── sessionOptions.js # Iron-session configuration
├── public/
│   └── styles.css        # Application styles
├── .env.example          # Environment variable template
└── package.json
```

## Deployment to Vercel

### 1. Push to GitHub

```bash
git push origin your-branch-name
```

### 2. Import in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure your project

### 3. Set Environment Variable

In Vercel project settings:

1. Go to Settings → Environment Variables
2. Add: `IRON_SESSION_PASSWORD`
3. Value: Your secure 32+ character password
4. Select all environments (Production, Preview, Development)

### 4. Deploy

Vercel will automatically deploy your application.

## Pages Overview

### Landing Page (`/`)
- Introduction to Semi‑Colonic
- Links to login and dashboard

### Login Page (`/login`)
- Login form with name and email
- Demo login button for quick testing
- Secure session creation

### Dashboard (`/dashboard`)
- User profile display with initials
- Animated semicolon logo
- Navigation cards to 7 feature pages
- Logout functionality

### Feature Pages (`/features/*`)
- Begin - Start your journey
- Check In - Daily wellness check
- Breathe - Breathing exercises
- Mood - Track your mood
- Tasks - Manage your day
- Progress - See your growth
- Safe Space - Your personal space

## Session Management

### How It Works

1. **Client** checks sessionStorage for cached user data (fast initial render)
2. **Client** validates with server via `GET /api/session`
3. **Server** verifies iron-session cookie (source of truth)
4. If no valid session, redirects to login
5. Session syncs between client and server

### Security Features

- ✅ Encrypted session cookies (iron-session)
- ✅ HttpOnly cookies (prevents XSS)
- ✅ Secure flag in production (HTTPS only)
- ✅ SameSite: 'lax' (CSRF protection)
- ✅ 7-day session expiration
- ✅ Production validation for environment variables

### sessionStorage Usage

Per requirements, sessionStorage is used for:
- Faster initial page render
- Better user experience
- **Non-sensitive data only** (name, email for display)
- Server session (iron-session) is always the source of truth

## API Routes

### `POST /api/login`

Demo login endpoint.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

Or send empty object `{}` for demo credentials.

**Response:**
```json
{
  "ok": true,
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### `GET /api/session`

Get current session.

**Response (authenticated):**
```json
{
  "ok": true,
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Response (not authenticated):**
```json
{
  "ok": false
}
```

### `POST /api/logout`

Destroy current session.

**Response:**
```json
{
  "ok": true
}
```

## Development Notes

### Demo Implementation

This is a **demo/prototype implementation**. For production:

- Implement proper authentication with password hashing
- Add database integration for user management
- Implement proper validation and error handling
- Add rate limiting to prevent brute force attacks
- Consider server-side session store for large data
- Add comprehensive logging and monitoring

### Code Comments

All API routes include comments noting they are minimal implementations and what should be considered for production.

## Testing

The application has been tested for:

- ✅ Landing page navigation
- ✅ Login with custom credentials
- ✅ Demo login functionality
- ✅ Dashboard display and navigation
- ✅ All 7 feature pages
- ✅ Session validation and redirect
- ✅ Logout functionality
- ✅ Production build
- ✅ Edge case handling (empty names, corrupted sessionStorage, etc.)

## Troubleshooting

### "IRON_SESSION_PASSWORD must be set in production environment"

Set the `IRON_SESSION_PASSWORD` environment variable in your production environment (Vercel, Railway, etc.)

### Session not persisting

Check that:
1. Cookies are enabled in your browser
2. `IRON_SESSION_PASSWORD` is set correctly
3. You're not in incognito/private mode (sessionStorage limitation)

### Build errors

Run:
```bash
rm -rf .next node_modules
npm install
npm run build
```

## Contributing

This is a prototype implementation. Future enhancements:

- [ ] Add proper authentication with database
- [ ] Implement actual feature functionality
- [ ] Add TypeScript for type safety
- [ ] Add unit and integration tests
- [ ] Implement error boundaries
- [ ] Add loading states and skeleton screens
- [ ] Add accessibility improvements (ARIA labels, keyboard navigation)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
