CREATE TABLE IF NOT EXISTS search_queries (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tool_variants (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL,
    headline TEXT NOT NULL,
    copy TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active' -- active, archived
);

CREATE TABLE IF NOT EXISTS dynamic_landing_pages (
    slug TEXT PRIMARY KEY,
    page_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_research_logs (
    id TEXT PRIMARY KEY,
    pain_point TEXT NOT NULL,
    source TEXT NOT NULL, -- e.g., 'reddit', 'google'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- view, drop_off, conversion
    page_slug TEXT NOT NULL,
    variant_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
