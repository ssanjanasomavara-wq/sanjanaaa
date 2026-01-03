// lib/sessionOptions.js
// iron-session options used by API routes.
// Ensure IRON_SESSION_PASSWORD is set to a long, random value (32+ chars) in Vercel and locally.

export const sessionOptions = {
  password:
    process.env.IRON_SESSION_PASSWORD ||
    "replace_this_with_a_strong_secret_for_local_dev_32_chars_min",
  cookieName: "sanjana_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

/*
Notes:
- Set IRON_SESSION_PASSWORD in Vercel and .env.local for local dev.
- Do NOT commit production secrets to the repository.
*/
