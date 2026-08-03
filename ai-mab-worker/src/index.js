export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(this.runGenerationAndMAB(env));
  },

  async runGenerationAndMAB(env) {
    if (!env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY");
      return;
    }

    // 1. Find unresolved search queries
    const { results: newQueries } = await env.DB.prepare(`
      SELECT query FROM search_queries 
      WHERE query NOT IN (SELECT slug FROM dynamic_landing_pages)
      ORDER BY frequency DESC LIMIT 5
    `).all();

    for (const row of newQueries) {
      const slug = row.query.toLowerCase().replace(/\\s+/g, '-');
      
      const prompt = `
        You are an expert SEO copywriter. A user is an Instagram content creator or audio producer looking for a tool related to: "${row.query}".
        Our tool is a browser-based Audio/Video Processor that can overlay audio on an image, scale background music, and export an MP4 perfect for Instagram Reels or Stories.
        Create an SEO-optimized headline and a short promotional copy paragraph that directly addresses their problem and explains how our tool solves it natively in the browser without server uploads.
        Return ONLY valid JSON in this exact format:
        { "headline": "...", "copy": "..." }
      `;

      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const data = await response.json();
        const textResponse = data.candidates[0]?.content?.parts[0]?.text || "{}";
        const cleanJsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const pageData = JSON.parse(cleanJsonStr);

        if (pageData.headline && pageData.copy) {
          await env.DB.prepare(`
            INSERT OR REPLACE INTO dynamic_landing_pages (slug, page_json) 
            VALUES (?, ?)
          `).bind(slug, JSON.stringify(pageData)).run();

          await env.DB.prepare(`
            INSERT INTO tool_variants (id, slug, headline, copy) 
            VALUES (?, ?, ?, ?)
          `).bind(crypto.randomUUID(), slug, pageData.headline, pageData.copy).run();
        }
      } catch (e) {
        console.error("Failed to generate page for", row.query, e);
      }
    }

    // 2. MAB Optimization: Archiving dead pages (no conversions in last 30 days)
    try {
      await env.DB.prepare(`
        UPDATE tool_variants 
        SET status = 'archived' 
        WHERE created_at < datetime('now', '-30 days')
        AND id NOT IN (
          SELECT variant_id FROM user_events WHERE event_type = 'conversion' AND timestamp > datetime('now', '-30 days')
        )
      `).run();
    } catch (e) {
      console.error("MAB pruning error:", e);
    }
  }
};
