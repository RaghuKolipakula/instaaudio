import { getRequestContext } from '@cloudflare/next-on-pages';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const body = await req.json();
    const { event_type, page_slug } = body;
    
    const { env } = getRequestContext();
    const db = env?.DB;
    
    if (db) {
      const id = crypto.randomUUID();
      const sessionId = 'session-' + Date.now();
      await db.prepare(`
        INSERT INTO user_events (id, session_id, event_type, page_slug) 
        VALUES (?, ?, ?, ?)
      `).bind(id, sessionId, event_type, page_slug).run();
    }
    
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
