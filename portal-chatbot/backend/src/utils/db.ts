import mysql from 'mysql2/promise';
import { env } from './config';

export const pool = mysql.createPool({
  host: env.MYSQL_HOST,
  port: env.MYSQL_PORT,
  user: env.MYSQL_USER,
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DB,
  connectionLimit: 10,
  waitForConnections: true,
  multipleStatements: false,
  namedPlaceholders: true,
});

export async function pingDatabase(): Promise<boolean> {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}