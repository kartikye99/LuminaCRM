import sql from '../utils/sql.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { communication_id, event_type, timestamp } = body;

    if (!communication_id || !event_type) {
      return new Response(JSON.stringify({ error: 'communication_id and event_type are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert event record
    await sql`
      INSERT INTO communication_events (communication_id, event_type, created_at)
      VALUES (${communication_id}, ${event_type}, NOW());
    `;

    // Update communications record status
    await sql`
      UPDATE communications
      SET status = ${event_type}, updated_at = NOW()
      WHERE id = ${communication_id};
    `;

    console.log(`📬 [Callback Log] Event ${event_type} registered for communication ${communication_id}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling callback:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
