// Session configuration for iron-session
// This provides a centralized configuration for all API routes

export const sessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD || "complex_password_at_least_32_characters_long",
  cookieName: "semicolonic_session",
  cookieOptions: {
    // secure: true should be used in production (HTTPS) only
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
