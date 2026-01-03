// API route to get current session
// This is a minimal demo implementation
// Production: Use HttpOnly secure cookies and consider server-side session store

import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/sessionOptions";

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);

  if (session.user) {
    // User is authenticated
    res.status(200).json({ ok: true, user: session.user });
  } else {
    // No session found
    res.status(200).json({ ok: false });
  }
}
