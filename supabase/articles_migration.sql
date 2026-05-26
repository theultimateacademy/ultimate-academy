-- Articles table for blog
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  image_alt TEXT,
  tags TEXT[] DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public read access (no auth required)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Articles are publicly readable" ON articles FOR SELECT USING (true);
