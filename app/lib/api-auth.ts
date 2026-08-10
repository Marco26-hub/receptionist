import { getAdminSession } from "./auth";
export async function requireApiAdmin() { const session = await getAdminSession(); if (!session) return { session: null, response: Response.json({ ok: false, error: "Non autorizzato" }, { status: 401 }) }; return { session, response: null }; }

