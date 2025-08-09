import { env } from './config';

const READ_ONLY_STATEMENTS = ['select', 'show', 'describe', 'desc', 'explain'];

export function isReadOnlySql(sql: string): boolean {
  const normalized = sql.trim().replace(/^\(+/, '').toLowerCase();
  const firstWord = normalized.split(/\s+/)[0];
  return READ_ONLY_STATEMENTS.includes(firstWord);
}

export function hasMultipleStatements(sql: string): boolean {
  // Very simple: disallow semicolons except possibly trailing whitespace
  return /;\s*\S+/.test(sql);
}

export function enforceLimit(sql: string, maxRows: number): string {
  if (!/^\s*select/i.test(sql)) return sql;
  const hasLimit = /\blimit\b/i.test(sql);
  if (hasLimit) {
    // Clamp any numeric limit to maxRows (very naive)
    return sql.replace(/limit\s+(\d+)/gi, (_m, num: string) => {
      const n = Math.min(parseInt(num, 10) || maxRows, maxRows);
      return `LIMIT ${n}`;
    });
  }
  return `${sql.trim()} LIMIT ${maxRows}`;
}

export function validateSql(sql: string): { ok: boolean; reason?: string; safeSql?: string } {
  const trimmed = sql.trim();
  if (trimmed.length === 0) return { ok: false, reason: 'Empty SQL' };
  if (hasMultipleStatements(trimmed)) return { ok: false, reason: 'Multiple statements not allowed' };
  if (!isReadOnlySql(trimmed) && !env.ALLOW_WRITES) return { ok: false, reason: 'Write operations are disabled' };
  const safeSql = enforceLimit(trimmed, env.MAX_QUERY_ROWS);
  return { ok: true, safeSql };
}