import sql from '../utils/sql.js';

export async function GET(request) {
  try {
    const segments = await sql`
      SELECT * FROM segments ORDER BY created_at DESC;
    `;
    return new Response(JSON.stringify(segments), {
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

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, criteria } = body;
    
    if (!name || !criteria) {
      return new Response(JSON.stringify({ error: 'Name and criteria are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Calculate customer count based on the criteria
    let countQuery = 'SELECT COUNT(*) FROM customers WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (criteria.min_spent !== undefined && criteria.min_spent !== null) {
      countQuery += ` AND total_spent >= $${paramIndex}`;
      params.push(criteria.min_spent);
      paramIndex++;
    }
    
    if (criteria.days_inactive !== undefined && criteria.days_inactive !== null) {
      countQuery += ` AND last_purchase_date < NOW() - INTERVAL '1 day' * $${paramIndex}`;
      params.push(criteria.days_inactive);
      paramIndex++;
    }

    let matchingCustomers = 0;
    try {
      const countResult = await sql(countQuery, params);
      matchingCustomers = parseInt(countResult[0]?.count || '0', 10);
    } catch (err) {
      console.error('Error calculating matching customer count:', err);
    }

    const newSegmentResult = await sql`
      INSERT INTO segments (name, description, criteria, customer_count)
      VALUES (${name}, ${description || ''}, ${JSON.stringify(criteria)}, ${matchingCustomers})
      RETURNING *;
    `;

    return new Response(JSON.stringify(newSegmentResult[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
