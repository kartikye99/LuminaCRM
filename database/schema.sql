-- LuminaCRM PostgreSQL Database Schema Definition

-- 1. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    total_spent DECIMAL DEFAULT 0,
    last_purchase_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Orders Table (Optional tracking for future purchases)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL,
    items JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Segments Table (Filters/Target shopper groups)
CREATE TABLE IF NOT EXISTS segments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    customer_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Campaigns Table (Marketing Campaigns drafts/active)
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    segment_id INTEGER REFERENCES segments(id) ON DELETE SET NULL,
    channel TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'draft', -- draft, sending, completed
    ai_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Communications Table (Tracks messages sent to each customer)
CREATE TABLE IF NOT EXISTS communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, delivered, opened, clicked, failed
    sent_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Communication Events Table (Technical webhook callback logs)
CREATE TABLE IF NOT EXISTS communication_events (
    id SERIAL PRIMARY KEY,
    communication_id UUID REFERENCES communications(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- delivered, opened, clicked, failed
    created_at TIMESTAMP DEFAULT NOW()
);
