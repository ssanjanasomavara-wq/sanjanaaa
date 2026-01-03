import { withIronSessionApiRoute } from 'iron-session/next';

// Session configuration for iron-session
const sessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD || 'complex_password_at_least_32_characters_long_change_in_production',
  cookieName: 'iron-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

async function sessionHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  // Check if user session exists
  if (req.session.user) {
    return res.status(200).json({ ok: true, user: req.session.user });
  }

  return res.status(200).json({ ok: false, user: null });
}

export default withIronSessionApiRoute(sessionHandler, sessionOptions);
