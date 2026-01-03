// API route for demo login
// This is a minimal demo implementation
// Production: Use proper authentication, password hashing, and database validation

import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/sessionOptions";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getIronSession(req, res, sessionOptions);

  // Get user data from request body or use demo values
  const { name, email } = req.body;
  const user = {
    name: name || "Demo User",
    email: email || "demo@semicolonic.app",
  };

  // Set session
  session.user = user;
  await session.save();

  res.status(200).json({ ok: true, user });
}
