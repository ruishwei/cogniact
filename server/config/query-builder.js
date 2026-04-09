/**
 * Database query abstraction layer.
 * Provides a unified interface for both Supabase (PostgREST) and plain PostgreSQL.
 *
 * Usage:
 *   const q = createQuery(db, 'agents');
 *   const rows = await q.select('*').eq('user_id', userId).order('created_at', false).run();
 */

import { isPostgresMode } from './db.js';

class PgQueryBuilder {
  constructor(pool, table) {
    this._pool = pool;
    this._table = table;
    this._selects = '*';
    this._joins = [];
    this._wheres = [];
    this._params = [];
    this._orderCol = null;
    this._orderAsc = true;
    this._limitN = null;
    this._op = 'select';
    this._insertData = null;
    this._updateData = null;
    this._returnSingle = false;
    this._orClauses = [];
    this._textSearchCol = null;
    this._textSearchVal = null;
  }

  select(cols) { this._selects = cols; return this; }
  insert(data) { this._op = 'insert'; this._insertData = data; return this; }
  update(data) { this._op = 'update'; this._updateData = data; return this; }
  delete() { this._op = 'delete'; return this; }

  eq(col, val) {
    this._wheres.push(`"${col}" = $${this._params.length + 1}`);
    this._params.push(val);
    return this;
  }

  lte(col, val) {
    this._wheres.push(`"${col}" <= $${this._params.length + 1}`);
    this._params.push(val);
    return this;
  }

  or(clause) {
    this._orClauses.push(clause);
    return this;
  }

  textSearch(col, val) {
    this._textSearchCol = col;
    this._textSearchVal = val;
    return this;
  }

  order(col, ascending = true) { this._orderCol = col; this._orderAsc = ascending; return this; }
  limit(n) { this._limitN = n; return this; }

  single() { this._returnSingle = true; return this; }
  maybeSingle() { this._returnSingle = 'maybe'; return this; }

  async run() {
    const client = this._pool;

    if (this._op === 'select') {
      const whereParts = [...this._wheres];

      if (this._textSearchCol && this._textSearchVal) {
        whereParts.push(`to_tsvector('english', "${this._textSearchCol}") @@ plainto_tsquery('english', $${this._params.length + 1})`);
        this._params.push(this._textSearchVal);
      }

      if (this._orClauses.length > 0) {
        const converted = this._orClauses.map(clause => {
          return clause.replace(/(\w+)\.eq\.([^,)]+)/g, (_, col, val) => {
            this._params.push(val === 'true' ? true : val === 'false' ? false : val);
            return `"${col}" = $${this._params.length}`;
          });
        });
        whereParts.push(`(${converted.join(' OR ')})`);
      }

      let sql = `SELECT ${this._selects} FROM "${this._table}"`;
      if (whereParts.length > 0) sql += ` WHERE ${whereParts.join(' AND ')}`;
      if (this._orderCol) sql += ` ORDER BY "${this._orderCol}" ${this._orderAsc ? 'ASC' : 'DESC'}`;
      if (this._limitN) sql += ` LIMIT ${this._limitN}`;

      const res = await client.query(sql, this._params);

      if (this._returnSingle === true) {
        if (res.rows.length === 0) return { data: null, error: new Error('Row not found') };
        return { data: res.rows[0], error: null };
      }
      if (this._returnSingle === 'maybe') {
        return { data: res.rows[0] || null, error: null };
      }
      return res.rows;
    }

    if (this._op === 'insert') {
      const records = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
      const first = records[0];
      const cols = Object.keys(first);
      const placeholders = records.map((_, ri) =>
        `(${cols.map((_, ci) => `$${ri * cols.length + ci + 1}`).join(', ')})`
      ).join(', ');
      const values = records.flatMap(r => cols.map(c => r[c]));
      const sql = `INSERT INTO "${this._table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES ${placeholders} RETURNING *`;
      const res = await client.query(sql, values);
      if (this._returnSingle || this._returnSingle === 'maybe') {
        return { data: res.rows[0] || null, error: null };
      }
      return { data: res.rows, error: null };
    }

    if (this._op === 'update') {
      const cols = Object.keys(this._updateData);
      const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
      const values = cols.map(c => this._updateData[c]);
      const offset = cols.length;
      const whereParams = this._params.map((p, i) => {
        this._wheres[i] = this._wheres[i].replace(`$${i + 1}`, `$${offset + i + 1}`);
        return p;
      });
      const whereSql = this._wheres.length > 0 ? ` WHERE ${this._wheres.join(' AND ')}` : '';
      const sql = `UPDATE "${this._table}" SET ${setClauses}${whereSql} RETURNING *`;
      const res = await client.query(sql, [...values, ...whereParams]);
      if (this._returnSingle || this._returnSingle === 'maybe') {
        return { data: res.rows[0] || null, error: null };
      }
      return { data: res.rows, error: null };
    }

    if (this._op === 'delete') {
      const whereSql = this._wheres.length > 0 ? ` WHERE ${this._wheres.join(' AND ')}` : '';
      const sql = `DELETE FROM "${this._table}"${whereSql}`;
      await client.query(sql, this._params);
      return { data: null, error: null };
    }
  }
}

class SupabaseQueryBuilder {
  constructor(supabase, table) {
    this._sb = supabase;
    this._q = null;
    this._table = table;
    this._returnSingle = false;
  }

  select(cols) { this._q = this._sb.from(this._table).select(cols); return this; }
  insert(data) { this._q = this._sb.from(this._table).insert(data); return this; }
  update(data) { this._q = this._sb.from(this._table).update(data); return this; }
  delete() { this._q = this._sb.from(this._table).delete(); return this; }
  eq(col, val) { this._q = this._q.eq(col, val); return this; }
  lte(col, val) { this._q = this._q.lte(col, val); return this; }
  or(clause) { this._q = this._q.or(clause); return this; }
  textSearch(col, val) { this._q = this._q.textSearch(col, val); return this; }
  order(col, ascending = true) { this._q = this._q.order(col, { ascending }); return this; }
  limit(n) { this._q = this._q.limit(n); return this; }
  single() { this._q = this._q.single(); this._returnSingle = true; return this; }
  maybeSingle() { this._q = this._q.maybeSingle(); this._returnSingle = 'maybe'; return this; }

  async run() {
    const { data, error } = await this._q;
    if (this._returnSingle || this._returnSingle === 'maybe') {
      return { data, error };
    }
    if (error) return [];
    return data || [];
  }
}

export function createQuery(db, table) {
  if (isPostgresMode()) {
    return new PgQueryBuilder(db, table);
  }
  return new SupabaseQueryBuilder(db, table);
}

export async function rawQuery(db, sql, params = []) {
  if (isPostgresMode()) {
    const res = await db.query(sql, params);
    return { data: res.rows, error: null };
  }
  return { data: [], error: new Error('rawQuery not supported in Supabase mode') };
}
