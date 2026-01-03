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

export default async function loginHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    // Demo login - accept any email/name combination
    // For production: validate credentials against a database
    // CSRF protection note: For demo purposes, this is a simple POST.
    // In production, consider adding CSRF tokens or use Next.js built-in CSRF protection.
    
    if (!email) {
      return res.status(400).json({ ok: false, error: 'Email is required' });
    }

    const session = await getIronSession(req, res, sessionOptions);

    // Set user session
    session.user = {
      email: email,
      name: name || email.split('@')[0], // Use email prefix as name if not provided
    };

    await session.save();

    return res.status(200).json({ 
      ok: true, 
      user: session.user 
    });
  } catch (error) {
    return res.status(500).json({ 
      ok: false, 
      error: 'Login failed: ' + error.message 
    });
  }
}
