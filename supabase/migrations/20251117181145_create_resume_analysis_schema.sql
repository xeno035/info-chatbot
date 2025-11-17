/*
  # Resume Analysis Application Schema

  ## New Tables
  
  ### `resume_sessions`
  - `id` (uuid, primary key) - Unique session identifier
  - `user_id` (uuid, nullable) - User who created the session (for future auth)
  - `title` (text) - Session name/title
  - `file_name` (text) - Original uploaded file name
  - `file_type` (text) - File extension (pdf, docx, txt)
  - `parsed_data` (jsonb) - Structured resume data with sections
  - `created_at` (timestamptz) - When session was created
  - `updated_at` (timestamptz) - Last update time

  ### `chat_messages`
  - `id` (uuid, primary key) - Message identifier
  - `session_id` (uuid, foreign key) - Links to resume_sessions
  - `role` (text) - 'user' or 'assistant'
  - `content` (text) - Message text
  - `created_at` (timestamptz) - Message timestamp

  ## Security
  - Enable RLS on all tables
  - Public access for demo purposes (can be restricted later with auth)
*/

CREATE TABLE IF NOT EXISTS resume_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL DEFAULT 'New Resume Analysis',
  file_name text NOT NULL,
  file_type text NOT NULL,
  parsed_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES resume_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);

ALTER TABLE resume_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to resume_sessions"
  ON resume_sessions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to resume_sessions"
  ON resume_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to resume_sessions"
  ON resume_sessions FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from resume_sessions"
  ON resume_sessions FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to chat_messages"
  ON chat_messages FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to chat_messages"
  ON chat_messages FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public delete from chat_messages"
  ON chat_messages FOR DELETE
  TO public
  USING (true);