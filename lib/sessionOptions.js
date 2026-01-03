// Session configuration for iron-session
// This provides a centralized configuration for all API routes

// Validate that IRON_SESSION_PASSWORD is set in production
if (process.env.NODE_ENV === "production" && !process.env.IRON_SESSION_PASSWORD) {
  throw new Error("IRON_SESSION_PASSWORD must be set in production environment");
}

export const sessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD || "complex_password_at_least_32_characters_long_dev_only",
  cookieName: "semicolonic_session",
  cookieOptions: {
    // secure: true should be used in production (HTTPS) only
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
