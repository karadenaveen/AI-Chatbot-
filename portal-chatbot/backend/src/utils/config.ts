import 'dotenv/config';

function toBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function toInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  BACKEND_PORT: toInt(process.env.BACKEND_PORT, 3001),
  MYSQL_HOST: process.env.MYSQL_HOST || 'localhost',
  MYSQL_PORT: toInt(process.env.MYSQL_PORT, 3306),
  MYSQL_USER: process.env.MYSQL_USER || 'portal_user',
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || 'portal_password',
  MYSQL_DB: process.env.MYSQL_DB || 'portal_db',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ALLOW_WRITES: toBool(process.env.ALLOW_WRITES, false),
  AUTO_EXECUTE_SQL: toBool(process.env.AUTO_EXECUTE_SQL, true),
  MAX_QUERY_ROWS: toInt(process.env.MAX_QUERY_ROWS, 200),
  COMPANY_NAME: process.env.COMPANY_NAME || 'CamelQ',
};