import sql from '../../../utils/sql.js';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Campaign ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch the campaign
    const campaignResult = await sql`
      SELECT * FROM campaigns WHERE id = ${id};
    `;
    const campaign = campaignResult[0];
    if (!campaign) {
      return new Response(JSON.stringify({ error: 'Campaign not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fetch segment and evaluate criteria
    let customers = [];
    if (campaign.segment_id) {
      const segmentResult = await sql`
        SELECT * FROM segments WHERE id = ${campaign.segment_id};
      `;
      const segment = segmentResult[0];

      if (segment) {
        let query = 'SELECT * FROM customers WHERE 1=1';
        const queryParams = [];
        let paramIndex = 1;

        const criteria = typeof segment.criteria === 'string' ? JSON.parse(segment.criteria) : segment.criteria;

        if (criteria) {
          if (criteria.min_spent !== undefined && criteria.min_spent !== null) {
            query += ` AND total_spent >= $${paramIndex}`;
            queryParams.push(criteria.min_spent);
            paramIndex++;
          }
          if (criteria.days_inactive !== undefined && criteria.days_inactive !== null) {
            query += ` AND last_purchase_date < NOW() - INTERVAL '1 day' * $${paramIndex}`;
            queryParams.push(criteria.days_inactive);
            paramIndex++;
          }
        }

        customers = await sql(query, queryParams);
      }
    }

    // If no matching customers, fall back to targeting all active customers (max 10) to make the simulation visible
    if (customers.length === 0) {
      customers = await sql`
        SELECT * FROM customers LIMIT 10;
      `;
    }

    // Update campaign status to 'sending'
    await sql`
      UPDATE campaigns SET status = 'sending' WHERE id = ${id};
    `;

    const origin = new URL(request.url).origin;

    // Start background simulation loop for each customer
    dispatchCommunications(origin, campaign, customers);

    return new Response(JSON.stringify({ success: true, target_count: customers.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function dispatchCommunications(origin, campaign, customers) {
  customers.forEach((customer) => {
    sql`
      INSERT INTO communications (campaign_id, customer_id, channel, content, status, sent_at)
      VALUES (${campaign.id}, ${customer.id}, ${campaign.channel}, ${campaign.message}, 'pending', NOW())
      RETURNING id;
    `
      .then((commResult) => {
        const commId = commResult[0].id;
        simulateChannelCallback(origin, commId);
      })
      .catch((err) => {
        console.error('Failed to create communication:', err);
      });
  });
}

async function simulateChannelCallback(origin, commId) {
  const fireCallback = async (eventType, delay) => {
    await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      await fetch(`${origin}/api/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          communication_id: commId,
          event_type: eventType,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error(`Callback error for event ${eventType}:`, err);
    }
  };

  // 1. Delivered: 90% chance
  if (Math.random() < 0.9) {
    const deliveryDelay = 1000 + Math.random() * 2000; // 1-3s
    await fireCallback('delivered', deliveryDelay);

    // 2. Opened: 60% chance
    if (Math.random() < 0.6) {
      const openDelay = 2000 + Math.random() * 3000; // 2-5s
      await fireCallback('opened', openDelay);

      // 3. Clicked: 30% chance
      if (Math.random() < 0.3) {
        const clickDelay = 3000 + Math.random() * 4000; // 3-7s
        await fireCallback('clicked', clickDelay);
      }
    }
  } else {
    // Failed to deliver
    const failDelay = 1000 + Math.random() * 2000;
    await fireCallback('failed', failDelay);
  }
}
