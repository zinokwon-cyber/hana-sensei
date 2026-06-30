-- Initial PostgreSQL setup for 3TOP Emoji Studio
-- This file runs when the PostgreSQL container starts for the first time.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE emoji_studio TO emoji_user;
