import { getIronSession } from 'iron-session';

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

export default async function logoutHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const session = await getIronSession(req, res, sessionOptions);
    
    // Destroy the session
    session.destroy();
    
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ 
      ok: false, 
      error: 'Logout failed: ' + error.message 
    });
  }
}
