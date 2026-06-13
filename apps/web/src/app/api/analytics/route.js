import sql from '../utils/sql.js';

export async function GET(request) {
  try {
    // 1. Core stats
    const statsResult = await sql`
      SELECT 
        (SELECT COUNT(*) FROM customers) as total_shoppers,
        (SELECT COUNT(*) FROM campaigns WHERE status = 'sending') as active_campaigns,
        (SELECT COALESCE(SUM(total_spent), 0) FROM customers) as revenue_driven;
    `;
    
    const openRateResult = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')) as opened_count,
        COUNT(*) as total_count
      FROM communications;
    `;

    const totalShoppers = parseInt(statsResult[0]?.total_shoppers || '0', 10);
    const activeCampaigns = parseInt(statsResult[0]?.active_campaigns || '0', 10);
    const revenueDriven = parseFloat(statsResult[0]?.revenue_driven || '0');
    
    const openedCount = parseInt(openRateResult[0]?.opened_count || '0', 10);
    const totalCount = parseInt(openRateResult[0]?.total_count || '0', 10);
    const avgOpenRate = totalCount > 0 ? ((openedCount / totalCount) * 100).toFixed(1) : '0.0';

    // 2. Channel performance
    const channelResult = await sql`
      SELECT 
        channel,
        COUNT(*) as sent_count,
        COUNT(*) FILTER (WHERE status IN ('opened', 'clicked')) as opened_count
      FROM communications
      GROUP BY channel;
    `;

    const channels = ['WhatsApp', 'Email', 'SMS', 'RCS'];
    const channelPerformance = channels.map(chan => {
      const dbChan = channelResult.find(r => r.channel.toLowerCase() === chan.toLowerCase());
      const sent = parseInt(dbChan?.sent_count || '0', 10);
      const opened = parseInt(dbChan?.opened_count || '0', 10);
      const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
      
      let color = '#2563EB';
      if (chan === 'WhatsApp') color = '#22C55E';
      else if (chan === 'SMS') color = '#EA580C';
      else if (chan === 'RCS') color = '#8B5CF6';

      return {
        channel: chan,
        sent,
        openRate,
        color
      };
    });

    // 3. Technical logs
    const logsResult = await sql`
      SELECT 
        e.event_type as event,
        EXTRACT(EPOCH FROM (NOW() - e.created_at))::integer as age_seconds,
        CONCAT(
          INITCAP(e.event_type), ' event from ', 
          cust.first_name, ' ', cust.last_name, 
          ' (', c.channel, ' for campaign "', SUBSTRING(camp.name, 1, 15), '...")'
        ) as desc
      FROM communication_events e
      JOIN communications c ON e.communication_id = c.id
      JOIN customers cust ON c.customer_id = cust.id
      JOIN campaigns camp ON c.campaign_id = camp.id
      ORDER BY e.created_at DESC
      LIMIT 15;
    `;

    const logs = logsResult.map(log => {
      const diffSec = log.age_seconds || 0;
      const diffMin = Math.floor(diffSec / 60);
      
      let timeStr = 'just now';
      if (diffMin > 0) {
        timeStr = `${diffMin}m ago`;
      } else if (diffSec > 10) {
        timeStr = `${diffSec}s ago`;
      }

      return {
        event: log.event === 'delivered' ? 'Channel Dispatch' : 'Webhook Callback',
        time: timeStr,
        desc: log.desc
      };
    });

    return new Response(JSON.stringify({
      stats: {
        totalShoppers,
        activeCampaigns,
        avgOpenRate,
        revenueDriven
      },
      channelPerformance,
      logs
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
