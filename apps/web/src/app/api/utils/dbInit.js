import sql from './sql.js';

export async function initializeTables() {
  try {
    // If DATABASE_URL is not set, don't execute
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ process.env.DATABASE_URL is not set. Database initialization skipped.');
      return;
    }

    console.log('🔄 Checking database tables...');

    // 1. Customers Table
    await sql`
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
    `;

    // 2. Orders Table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        amount DECIMAL NOT NULL,
        items JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // 3. Segments Table
    await sql`
      CREATE TABLE IF NOT EXISTS segments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        criteria JSONB NOT NULL,
        customer_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // 4. Campaigns Table
    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        segment_id INTEGER REFERENCES segments(id) ON DELETE SET NULL,
        channel TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'draft',
        ai_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // 5. Communications Table (for channel loop tracking)
    await sql`
      CREATE TABLE IF NOT EXISTS communications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
        channel TEXT NOT NULL,
        content TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        sent_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // 6. Communication Events Table (for webhook logs)
    await sql`
      CREATE TABLE IF NOT EXISTS communication_events (
        id SERIAL PRIMARY KEY,
        communication_id UUID REFERENCES communications(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log('✅ Database tables verified/created.');

    // Seed customers if table is empty
    const customerCountResult = await sql`SELECT COUNT(*) FROM customers;`;
    const count = parseInt(customerCountResult[0]?.count || '0', 10);
    
    if (count === 0) {
      console.log('🌱 Database is empty. Seeding initial customers...');
      const firstNames = ['Priya', 'Arjun', 'Meera', 'Rohan', 'Ananya', 'Vikram', 'Nisha', 'Kabir', 'Zara', 'Ishaan', 'Sara', 'Aarav', 'Dev', 'Aditi', 'Rahul', 'Diya', 'Karan', 'Riya', 'Amit', 'Neha'];
      const lastNames = ['Sharma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Mehta', 'Joshi', 'Kapoor', 'Bose', 'Nair', 'Verma', 'Choudhury', 'Reddy', 'Rao', 'Sen', 'Pillai', 'Dubey', 'Das'];

      for (let i = 0; i < 50; i++) {
        const first = firstNames[Math.floor(Math.random() * firstNames.length)];
        const last = lastNames[Math.floor(Math.random() * lastNames.length)];
        const spent = (Math.random() * 15000 + 500).toFixed(2);
        const daysAgo = Math.floor(Math.random() * 90);
        const lastPurchase = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
        const email = `${first.toLowerCase()}.${last.toLowerCase()}${i + 1}@example.com`;
        const phone = `+91 98${Math.floor(Math.random() * 90000000 + 10000000)}`;

        await sql`
          INSERT INTO customers (email, first_name, last_name, phone, total_spent, last_purchase_date)
          VALUES (${email}, ${first}, ${last}, ${phone}, ${spent}, ${lastPurchase})
          ON CONFLICT (email) DO NOTHING;
        `;
      }
      console.log('✅ 50 mock customers seeded successfully.');
    }
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
}
