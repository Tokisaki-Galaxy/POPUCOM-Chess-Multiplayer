export default async function handler(request, response) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  const tableEndpoint = supabaseUrl ? `${supabaseUrl}/rest/v1/games` : '';

  if (!supabaseUrl || !supabaseKey) {
    return response.status(500).json({ error: 'Missing Supabase configuration' });
  }

  try {
    // Ping Supabase by fetching a single row or just checking the table
    const result = await fetch(`${tableEndpoint}?select=room_id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (result.ok) {
      return response.status(200).json({ success: true, message: 'Database pinged successfully' });
    } else {
      const error = await result.text();
      return response.status(result.status).json({ error: 'Failed to ping database', details: error });
    }
  } catch (error) {
    return response.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
