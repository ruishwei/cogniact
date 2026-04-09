/**
 * PostgreSQL adapter that mimics the Supabase PostgREST query builder interface.
 * This allows routes to use the same .from().select().eq()... syntax regardless of DB mode.
 */

class PgQueryBuilder {
  constructor(pool, table) {
    this._pool = pool;
    this._table = table;
    this._op = 'select';
    this._cols = '*';
    this._wheres = [];
    this._params = [];
    this._order = null;
    this._orderAsc = false;
    this._limitN = null;
    this._insertData = null;
    this._updateData = null;
    this._returnMode = null;
  }

  select(cols = '*') {
    this._op = 'select';
    this._cols = cols;
    return this;
  }

  insert(data) {
    this._op = 'insert';
    this._insertData = data;
    return this;
  }

  update(data) {
    this._op = 'update';
    this._updateData = data;
    return this;
  }

  delete() {
    this._op = 'delete';
    return this;
  }

  eq(col, val) {
    const idx = this._params.length + 1;
    this._wheres.push(`"${col}" = $${idx}`);
    this._params.push(val);
    return this;
  }

  neq(col, val) {
    const idx = this._params.length + 1;
    this._wheres.push(`"${col}" != $${idx}`);
    this._params.push(val);
    return this;
  }

  lte(col, val) {
    const idx = this._params.length + 1;
    this._wheres.push(`"${col}" <= $${idx}`);
    this._params.push(val);
    return this;
  }

  gte(col, val) {
    const idx = this._params.length + 1;
    this._wheres.push(`"${col}" >= $${idx}`);
    this._params.push(val);
    return this;
  }

  or(clause) {
    const parts = clause.split(',').map(part => {
      const m = part.trim().match(/^(\w+)\.(eq|neq)\.(.+)$/);
      if (!m) return null;
      const [, col, op, rawVal] = m;
      const val = rawVal === 'true' ? true : rawVal === 'false' ? false : rawVal;
      const idx = this._params.length + 1;
      this._params.push(val);
      return `"${col}" ${op === 'eq' ? '=' : '!='} $${idx}`;
    }).filter(Boolean);

    if (parts.length > 0) {
      this._wheres.push(`(${parts.join(' OR ')})`);
    }
    return this;
  }

  textSearch(col, val) {
    const idx = this._params.length + 1;
    this._wheres.push(`to_tsvector('english', "${col}") @@ plainto_tsquery('english', $${idx})`);
    this._params.push(val);
    return this;
  }

  order(col, opts = {}) {
    const ascending = typeof opts === 'boolean' ? opts : (opts.ascending !== false);
    this._order = col;
    this._orderAsc = ascending;
    return this;
  }

  limit(n) {
    this._limitN = n;
    return this;
  }

  single() { this._returnMode = 'single'; return this; }
  maybeSingle() { this._returnMode = 'maybe'; return this; }

  then(resolve, reject) {
    return this._exec().then(resolve, reject);
  }

  async _exec() {
    try {
      const result = await this._run();
      return result;
    } catch (err) {
      return { data: null, error: err };
    }
  }

  async _run() {
    if (this._op === 'select') {
      let whereSql = this._wheres.length > 0 ? ` WHERE ${this._wheres.join(' AND ')}` : '';
      let orderSql = this._order ? ` ORDER BY "${this._order}" ${this._orderAsc ? 'ASC' : 'DESC'}` : '';
      let limitSql = this._limitN ? ` LIMIT ${this._limitN}` : '';
      const sql = `SELECT ${this._cols} FROM "${this._table}"${whereSql}${orderSql}${limitSql}`;
      const res = await this._pool.query(sql, this._params);

      if (this._returnMode === 'single') {
        if (res.rows.length === 0) return { data: null, error: new Error('No rows found') };
        return { data: res.rows[0], error: null };
      }
      if (this._returnMode === 'maybe') {
        return { data: res.rows[0] || null, error: null };
      }
      return { data: res.rows, error: null };
    }

    if (this._op === 'insert') {
      const records = Array.isArray(this._insertData) ? this._insertData : [this._insertData];
      const cols = Object.keys(records[0]);
      const values = records.flatMap(r => cols.map(c => {
        const v = r[c];
        return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
      }));
      const placeholders = records.map((_, ri) =>
        `(${cols.map((_, ci) => `$${ri * cols.length + ci + 1}`).join(', ')})`
      ).join(', ');
      const sql = `INSERT INTO "${this._table}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES ${placeholders} RETURNING *`;
      const res = await this._pool.query(sql, values);
      if (this._returnMode) {
        return { data: res.rows[0] || null, error: null };
      }
      return { data: res.rows, error: null };
    }

    if (this._op === 'update') {
      const cols = Object.keys(this._updateData);
      const setClauses = cols.map((c, i) => `"${c}" = $${i + 1}`).join(', ');
      const updateVals = cols.map(c => {
        const v = this._updateData[c];
        return (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v;
      });

      const shiftedWheres = this._wheres.map(w =>
        w.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + cols.length}`)
      );

      let whereSql = shiftedWheres.length > 0 ? ` WHERE ${shiftedWheres.join(' AND ')}` : '';
      const sql = `UPDATE "${this._table}" SET ${setClauses}${whereSql} RETURNING *`;
      const res = await this._pool.query(sql, [...updateVals, ...this._params]);
      if (this._returnMode) {
        return { data: res.rows[0] || null, error: null };
      }
      return { data: res.rows, error: null };
    }

    if (this._op === 'delete') {
      let whereSql = this._wheres.length > 0 ? ` WHERE ${this._wheres.join(' AND ')}` : '';
      const sql = `DELETE FROM "${this._table}"${whereSql} RETURNING *`;
      await this._pool.query(sql, this._params);
      return { data: null, error: null };
    }
  }
}

export function createPgAdapter(pool) {
  return {
    from(table) {
      return new PgQueryBuilder(pool, table);
    },
    async rpc(funcName, params) {
      const keys = Object.keys(params);
      const vals = Object.values(params);
      const args = keys.map((k, i) => `${k} => $${i + 1}`).join(', ');
      try {
        const res = await pool.query(`SELECT * FROM ${funcName}(${args})`, vals);
        return { data: res.rows, error: null };
      } catch (err) {
        return { data: null, error: err };
      }
    },
  };
}
