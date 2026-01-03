// pages/api/session.js
import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/sessionOptions";

/*
Returns { ok: true, user } when session exists, otherwise { ok: false, user: null }.
This file avoids optional chaining to prevent syntax/transpile issues.
*/
export default async function handler(req, res) {
  try {
    const session = await getIronSession(req, res, sessionOptions);
    const user = session && session.user ? session.user : null;
    return res.status(200).json({ ok: !!user, user: user || null });
  } catch (err) {
    console.error("Error reading session:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
