-- The Reef - Initial Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reef Environment (one per couple)
CREATE TABLE reefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Our Reef',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles with reef membership
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  reef_id UUID REFERENCES reefs(id),
  role TEXT CHECK (role IN ('husband', 'wife')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Prompts (AI behavior - runtime editable)
CREATE TABLE system_prompts (
  key TEXT PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  description TEXT,
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bridge Messages
CREATE TABLE bridge_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reef_id UUID REFERENCES reefs(id) NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  recipient_id UUID REFERENCES profiles(id) NOT NULL,
  emotion TEXT NOT NULL,
  original_text TEXT NOT NULL,
  transformed_text TEXT,
  ai_analysis JSONB DEFAULT '{}',
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retros
CREATE TABLE retros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reef_id UUID REFERENCES reefs(id) NOT NULL,
  title TEXT NOT NULL,
  event_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'revealed')),
  ai_summary JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Retro Submissions
CREATE TABLE retro_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retro_id UUID REFERENCES retros(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  raw_narrative TEXT NOT NULL,
  ai_analysis JSONB DEFAULT '{}',
  future_script TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(retro_id, author_id)
);

-- Row Level Security Policies

-- Profiles: Users can read/update their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view reef members' profiles"
  ON profiles FOR SELECT
  USING (
    reef_id IN (
      SELECT reef_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Reefs: Members can view their reef
ALTER TABLE reefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reef members can view their reef"
  ON reefs FOR SELECT
  USING (
    id IN (
      SELECT reef_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Bridge Messages: Members of the same reef can view
ALTER TABLE bridge_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reef members can view bridge messages"
  ON bridge_messages FOR SELECT
  USING (
    reef_id IN (
      SELECT reef_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert bridge messages"
  ON bridge_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    reef_id IN (
      SELECT reef_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Recipients can update acknowledged_at"
  ON bridge_messages FOR UPDATE
  USING (recipient_id = auth.uid());

-- Retros: Reef members can view and create
ALTER TABLE retros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reef members can view retros"
  ON retros FOR SELECT
  USING (
    reef_id IN (
      SELECT reef_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Reef members can create retros"
  ON retros FOR INSERT
  WITH CHECK (
    reef_id IN (
      SELECT reef_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Reef members can update retros"
  ON retros FOR UPDATE
  USING (
    reef_id IN (
      SELECT reef_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Retro Submissions
ALTER TABLE retro_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON retro_submissions FOR SELECT
  USING (author_id = auth.uid());

CREATE POLICY "Users can view partner submissions when revealed"
  ON retro_submissions FOR SELECT
  USING (
    retro_id IN (
      SELECT id FROM retros
      WHERE status = 'revealed'
      AND reef_id IN (
        SELECT reef_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own submissions"
  ON retro_submissions FOR INSERT
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Users can update own submissions"
  ON retro_submissions FOR UPDATE
  USING (author_id = auth.uid());

-- System Prompts: Readable by all authenticated users
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read prompts"
  ON system_prompts FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed initial system prompts
INSERT INTO system_prompts (key, prompt_text, description) VALUES
('bridge_nvc_transform_v1', 
'You are a compassionate communication coach trained in Non-Violent Communication (NVC).

Rewrite the following text using the NVC framework:
1. OBSERVATION: State what happened without judgment
2. FEELING: Express the emotion ("I feel...")
3. NEED: Identify the underlying need
4. REQUEST: Make a clear, positive request

Keep the message authentic and personal while removing blame and accusation.
Do NOT use therapy-speak or make it sound robotic.
Keep it conversational and genuine.

TEXT TO REWRITE:',
'Transforms grievances into NVC-style messages'),

('bridge_four_horsemen_v1',
'You are an expert in the Gottman Method. Analyze this text for "The Four Horsemen of the Apocalypse" - destructive communication patterns:

1. CRITICISM: Attacking the person''s character rather than the behavior
2. CONTEMPT: Treating with disrespect, mockery, sarcasm, eye-rolling, name-calling
3. DEFENSIVENESS: Victimizing yourself, making excuses, meeting criticism with criticism
4. STONEWALLING: Withdrawing, shutting down, refusing to engage

Respond with a JSON object containing:
- horsemenFlags: array of detected horsemen (lowercase: "criticism", "contempt", "defensiveness", "stonewalling")
- sentiment: single word describing overall emotional tone
- suggestions: array of 1-3 brief improvement suggestions

TEXT TO ANALYZE:',
'Detects destructive communication patterns'),

('retro_clerk_analysis_v1',
'You are Octi, a wise and compassionate AI assistant helping a couple understand their different perspectives of the same event.

Analyze this narrative and extract:
1. VIDEO CAMERA FACTS - Things a neutral camera would record (observable actions, words spoken, times, places)
2. INTERPRETATIONS - Subjective readings of the situation, feelings, conclusions drawn
3. MIND READS - Assumptions about what the other person was thinking or intending

Respond with JSON:
{
  "videoFacts": ["fact1", "fact2"],
  "interpretations": ["interp1", "interp2"],
  "mindReads": ["read1"],
  "emotionalUndertones": ["emotion1"]
}

Be gentle but honest. The goal is understanding, not blame.

NARRATIVE:',
'Analyzes narratives for the Rashomon Protocol'),

('retro_future_script_v1',
'Help the user craft a clear "future script" statement in this format:
"In the future, when [specific trigger] happens, I need [specific action/support]."

Make it specific, actionable, and focused on what they need (not what they don''t want).

USER INPUT:',
'Helps craft future script agreements');

-- Create a default reef (to be linked manually)
INSERT INTO reefs (name) VALUES ('Alex & Tiff''s Reef');
