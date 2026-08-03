export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(this.runMarketResearch(env));
  },

  async runMarketResearch(env) {
    if (!env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY");
      return;
    }

    const prompt = `
      Search Google and Reddit (r/Instagram, r/InstagramMarketing, r/reels, r/VideoEditing, r/musicproduction) for recent questions, complaints, or workflows regarding audio processing, trending audio, and video editing specifically for Instagram users and music producers.
      Identify 3 specific, missing utility tools or common pain points users are having (e.g. "remove background noise from instagram reel", "make beat drop hit harder for reels").
      Output ONLY a JSON array of strings containing the exact search terms someone might use to find a tool for these problems.
    `;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }] // Enable Google Search grounding
        })
      });

      const data = await response.json();
      const textResponse = data.candidates[0]?.content?.parts[0]?.text || "[]";
      
      // Clean up markdown formatting if present
      const cleanJsonStr = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      let painPoints = [];
      try {
        painPoints = JSON.parse(cleanJsonStr);
      } catch (e) {
        console.error("Failed to parse JSON from Gemini:", textResponse);
        return;
      }

      for (const query of painPoints) {
        const id = crypto.randomUUID();
        // Log to market_research_logs
        await env.DB.prepare(`
          INSERT INTO market_research_logs (id, pain_point, source) 
          VALUES (?, ?, ?)
        `).bind(id, query, 'gemini_search').run();

        // Also add to search_queries so the AI MAB worker will pick it up and generate a tool
        await env.DB.prepare(`
          INSERT INTO search_queries (id, query, frequency) 
          VALUES (?, ?, 1)
          ON CONFLICT(id) DO UPDATE SET frequency = frequency + 1, last_seen = CURRENT_TIMESTAMP
        `).bind(id, query).run();
      }

      console.log(`Successfully logged ${painPoints.length} pain points.`);
    } catch (e) {
      console.error("Market research error:", e);
    }
  }
};
