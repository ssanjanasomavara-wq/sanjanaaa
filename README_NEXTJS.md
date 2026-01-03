# Semi;colonic - Next.js Dashboard

A mental wellness application built with Next.js and secure session management using iron-session.

## 🌟 Features

- **Secure Authentication**: Demo login with iron-session for encrypted, stateless cookie-based sessions
- **Dashboard**: User-friendly dashboard with personalized greeting and feature navigation
- **Feature Pages**: Seven placeholder feature pages for mental wellness tools:
  - 🌅 **Begin** - Start your day with intention
  - ✓ **Check In** - Reflect on current feelings
  - 🫁 **Breathe** - Guided breathing exercises
  - 😊 **Mood Diary** - Track emotions and patterns
  - 📝 **Tasks** - Gentle reminders and goals
  - 📊 **Progress** - Celebrate your journey
  - 🛡️ **Safe Space** - Private expression space

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ssanjanasomavara-wq/sanjanaaa.git
cd sanjanaaa
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Generate a secure session password (at least 32 characters):
```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

5. Update the `.env` file with your generated password:
```
IRON_SESSION_PASSWORD=your_generated_secure_password_here
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production

Build and start the production server:

```bash
npm run build
npm start
```

## 📦 Deployment on Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add the environment variable:
   - **Key**: `IRON_SESSION_PASSWORD`
   - **Value**: Your secure 32+ character password
4. Deploy!

Vercel will automatically detect Next.js and configure the build settings.

## 🔒 Security

- **iron-session**: Uses encrypted, signed cookies for stateless session management
- **HTTP-Only Cookies**: Session cookies are not accessible via JavaScript
- **Secure Flag**: Cookies are marked secure in production (HTTPS only)
- **Server-Side Validation**: All session checks happen on the server

### Important Security Notes

1. **Never commit your `.env` file** - it's already in `.gitignore`
2. **Use a strong password** - minimum 32 characters for production
3. **Rotate passwords regularly** - especially if compromised
4. **For production**: Consider using a session store (Redis, database) for scalability

## 🛠️ Technology Stack

- **Framework**: Next.js 14.x
- **Session Management**: iron-session 8.x
- **UI**: React 18.x
- **Styling**: CSS-in-JS with styled-jsx (built into Next.js)

## 📁 Project Structure

```
├── pages/
│   ├── api/
│   │   ├── login.js       # Demo login endpoint
│   │   ├── logout.js      # Logout endpoint
│   │   └── session.js     # Session validation endpoint
│   ├── features/
│   │   ├── begin.jsx      # Feature pages
│   │   ├── checkin.jsx
│   │   ├── breathe.jsx
│   │   ├── mood.jsx
│   │   ├── tasks.jsx
│   │   ├── progress.jsx
│   │   └── safe-space.jsx
│   ├── dashboard.jsx      # Main dashboard
│   ├── login.jsx          # Login page
│   └── index.js           # Home/landing page
├── public/
│   └── styles.css         # Global styles
├── .env.example           # Example environment variables
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

## 🎨 Styling

The application uses the existing `styles.css` from the `/public` directory. Each page imports this stylesheet and adds page-specific styles using styled-jsx.

## 🔧 API Routes

### POST /api/login
Demo login endpoint that accepts any email/name combination.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "User Name" // optional
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### GET /api/session
Validates the current session.

**Response:**
```json
{
  "ok": true,
  "user": {
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### POST /api/logout
Destroys the current session.

**Response:**
```json
{
  "ok": true
}
```

## 🧪 Testing

The application has been tested with:
- ✅ Login flow (demo authentication)
- ✅ Session persistence across page navigation
- ✅ Dashboard display with user information
- ✅ All feature pages accessible
- ✅ Logout functionality
- ✅ Session validation

## 📝 License

This project is part of the Semi;colonic mental wellness application.

## 🤝 Contributing

This is a demo/prototype application. For production use, implement:
- Real authentication (database-backed)
- CSRF protection
- Rate limiting
- Input validation
- Error boundaries
- Accessibility improvements
- Unit and integration tests
