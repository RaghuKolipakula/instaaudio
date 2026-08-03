import { getRequestContext } from '@cloudflare/next-on-pages';
import dynamic from 'next/dynamic';

const AudioProcessor = dynamic(() => import('../../src/AudioProcessor').then(mod => mod.AudioProcessor), {
  ssr: false,
});

export const runtime = 'edge';

export async function generateMetadata({ params }) {
  return { title: `Audio Tool: ${params.slug.split('-').join(' ')}` };
}

export default async function DynamicToolPage({ params }) {
  let db = null;
  try {
    const { env } = getRequestContext();
    db = env?.DB;
  } catch (e) {
    // Local dev fallback
  }
  
  let headline = null;
  let copy = null;

  if (db) {
    try {
      const result = await db.prepare('SELECT page_json FROM dynamic_landing_pages WHERE slug = ?').bind(params.slug).first();
      if (result && result.page_json) {
        const data = JSON.parse(result.page_json);
        headline = data.headline;
        copy = data.copy;
      } else {
        // Record unresolved query
        await db.prepare(`
          INSERT INTO search_queries (id, query, frequency) 
          VALUES (?, ?, 1)
          ON CONFLICT(id) DO UPDATE SET frequency = frequency + 1, last_seen = CURRENT_TIMESTAMP
        `).bind(params.slug, params.slug.split('-').join(' ')).run();
      }
    } catch (e) {
      console.error("D1 Error:", e);
    }
  }
  
  return (
    <AudioProcessor 
      initialHeadline={headline}
      initialCopy={copy}
    />
  );
}
