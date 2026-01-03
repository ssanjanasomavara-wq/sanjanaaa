// pages/api/login.js
// Use getIronSession to create/save the server session in a way compatible with current iron-session packages.
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/sessionOptions";

/*
Minimal demo login endpoint.
Accepts POST { name, email } and sets session.user.
In production, replace with proper auth and validation.
*/
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { name, email } = req.body || {};
    const user = {
      name: name || "Demo User",
      email: email || "demo@example.com",
      displayName: name || "Demo User",
    };

    const session = await getIronSession(req, res, sessionOptions);
    session.user = user;
    await session.save();

    return res.status(200).json({ ok: true, user });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
