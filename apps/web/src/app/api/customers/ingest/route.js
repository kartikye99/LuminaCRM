import sql from '../../utils/sql.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const customers = body.customers || [];
    let count = 0;

    for (const c of customers) {
      if (!c.email) continue;
      
      const email = c.email;
      const firstName = c.first_name || '';
      const lastName = c.last_name || '';
      const phone = c.phone || '';
      const totalSpent = c.total_spent || 0;
      const lastPurchaseDate = c.last_purchase_date || null;

      await sql`
        INSERT INTO customers (email, first_name, last_name, phone, total_spent, last_purchase_date)
        VALUES (${email}, ${firstName}, ${lastName}, ${phone}, ${totalSpent}, ${lastPurchaseDate})
        ON CONFLICT (email) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          phone = EXCLUDED.phone,
          total_spent = EXCLUDED.total_spent,
          last_purchase_date = EXCLUDED.last_purchase_date;
      `;
      count++;
    }

    return new Response(JSON.stringify({ success: true, count }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
