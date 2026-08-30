-- 003_create_submissions.sql
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES widgets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    geo_country VARCHAR(100),
    geo_city VARCHAR(100),
    geo_provider VARCHAR(50),
    idempotency_key VARCHAR(255) UNIQUE,
    spam_score REAL DEFAULT 0.0,
    is_spam BOOLEAN DEFAULT false,
    notification_sent BOOLEAN DEFAULT false,
    notification_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_submissions_widget_id ON submissions(widget_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_idempotency ON submissions(idempotency_key);
