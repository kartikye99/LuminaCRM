import sql from '../utils/sql.js';

export async function GET(request) {
  try {
    const customers = await sql`
      SELECT * FROM customers ORDER BY created_at DESC;
    `;
    return new Response(JSON.stringify(customers), {
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
