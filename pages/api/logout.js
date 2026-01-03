// API route for logout
// This is a minimal demo implementation
// Production: Consider additional cleanup and redirect handling

import { getIronSession } from "iron-session";
import { sessionOptions } from "../../lib/sessionOptions";

export default async function handler(req, res) {
  const session = await getIronSession(req, res, sessionOptions);

  // Destroy session
  session.destroy();

  res.status(200).json({ ok: true });
}
