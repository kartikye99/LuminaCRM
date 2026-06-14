import pg from 'pg';
const { Pool } = pg;

let poolInstance = null;
const getPool = () => {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return poolInstance;
};

const sql = async (text, ...args) => {
  // Check if it is a template literal call: sql`SELECT * FROM table WHERE col = ${val}`
  if (Array.isArray(text) && text.raw) {
    let queryText = text[0];
    const params = [];
    for (let i = 1; i < text.length; i++) {
      queryText += `$${i}` + text[i];
      params.push(args[i - 1]);
    }
    const result = await getPool().query(queryText, params);
    return result.rows;
  }
  
  // Normal call: sql(query, params)
  const params = args[0] || [];
  const result = await getPool().query(text, params);
  return result.rows;
};

sql.transaction = async (callback) => {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export default sql;