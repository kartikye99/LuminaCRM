import sql from '../utils/sql.js';

export async function GET(request) {
  try {
    const campaigns = await sql`
      SELECT * FROM campaigns ORDER BY created_at DESC;
    `;
    return new Response(JSON.stringify(campaigns), {
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
    const { name, segment_id, channel, message, ai_notes } = body;

    if (!name || !segment_id || !channel || !message) {
      return new Response(JSON.stringify({ error: 'Name, segment_id, channel, and message are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const campaign = await sql`
      INSERT INTO campaigns (name, segment_id, channel, message, ai_notes)
      VALUES (${name}, ${segment_id}, ${channel}, ${message}, ${ai_notes || ''})
      RETURNING *;
    `;

    return new Response(JSON.stringify(campaign[0]), {
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
