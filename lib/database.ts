import mysql from 'mysql2/promise';

export const dbConfig = {
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE,
  port: parseInt(process.env.RDS_PORT || '3306'),
  ssl: {
    rejectUnauthorized: false
  }
};

export async function getConnection() {
  return await mysql.createConnection(dbConfig);
}

export async function executeQuery(query: string, params: any[] = []) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    await connection.end();
  }
}
