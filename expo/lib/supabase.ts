/**
 * Lightweight Supabase PostgREST client.
 *
 * Uses plain `fetch` against the Supabase REST API so it runs in Expo Go
 * without native modules. Covers select/insert/update/delete with the common
 * filters. All responses are RLS-scoped by the token used (anon or user).
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY — database calls will fail."
  );
}

/** Sanitized error surfaced to callers; never exposes keys or internals. */
export class SupabaseRestError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SupabaseRestError";
    this.status = status;
  }
}

export type QueryFilter = {
  column: string;
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "is";
  value: unknown;
};

export type OrderSpec = { column: string; ascending: boolean; nullsFirst: boolean };

class QueryBuilder {
  private readonly table: string;
  private readonly token: string | null;
  private readonly filters: QueryFilter[] = [];
  private readonly orders: OrderSpec[] = [];
  private limitCount: number | null = null;

  constructor(table: string, token: string | null) {
    this.table = table;
    this.token = token;
  }

  // Filters
  eq(column: string, value: unknown): this {
    return this.add({ column, op: "eq", value });
  }
  neq(column: string, value: unknown): this {
    return this.add({ column, op: "neq", value });
  }
  gt(column: string, value: unknown): this {
    return this.add({ column, op: "gt", value });
  }
  gte(column: string, value: unknown): this {
    return this.add({ column, op: "gte", value });
  }
  lt(column: string, value: unknown): this {
    return this.add({ column, op: "lt", value });
  }
  lte(column: string, value: unknown): this {
    return this.add({ column, op: "lte", value });
  }
  ilike(column: string, pattern: string): this {
    return this.add({ column, op: "ilike", value: pattern });
  }
  in(column: string, values: Array<string | number>): this {
    return this.add({ column, op: "in", value: values });
  }
  is(column: string, value: boolean | null): this {
    return this.add({ column, op: "is", value });
  }

  private add(filter: QueryFilter): this {
    this.filters.push(filter);
    return this;
  }

  order(column: string, { ascending = true, nullsFirst = false } = {}): this {
    this.orders.push({ column, ascending, nullsFirst });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  // Reads

  /** Fetch rows. `columns` uses PostgREST syntax, e.g. "*" or "id,title". */
  async select<T>(columns = "*"): Promise<T[]> {
    const params = new URLSearchParams({ select: columns });
    this.applyFilters(params);
    const data = await this.request<T[] | T>("GET", `/rest/v1/${this.table}`, params);
    return Array.isArray(data) ? data : [data];
  }

  /** Fetch exactly one row; returns null when the query matches nothing. */
  async single<T>(columns = "*"): Promise<T | null> {
    const rows = await this.select<T>(columns);
    if (rows.length === 0) return null;
    if (rows.length > 1) {
      throw new SupabaseRestError(
        `Expected one row from ${this.table} but got ${rows.length}`,
        409
      );
    }
    return rows[0] ?? null;
  }

  // Writes

  async insert<T>(payload: Record<string, unknown> | Array<Record<string, unknown>>): Promise<T[]> {
    const body = Array.isArray(payload) ? payload : [payload];
    return this.request<T[]>("POST", `/rest/v1/${this.table}`, new URLSearchParams(), body, {
      return: "representation",
    });
  }

  async update<T>(changes: Record<string, unknown>): Promise<T[]> {
    if (this.filters.length === 0) {
      throw new SupabaseRestError(
        `Refusing to update ${this.table} without a filter — add .eq() first`,
        400
      );
    }
    const params = new URLSearchParams();
    this.applyFilters(params);
    return this.request<T[]>("PATCH", `/rest/v1/${this.table}`, params, changes, {
      return: "representation",
    });
  }

  async delete(): Promise<void> {
    if (this.filters.length === 0) {
      throw new SupabaseRestError(
        `Refusing to delete from ${this.table} without a filter — add .eq() first`,
        400
      );
    }
    const params = new URLSearchParams();
    this.applyFilters(params);
    await this.request<unknown>("DELETE", `/rest/v1/${this.table}`, params);
  }

  // Internals

  private applyFilters(params: URLSearchParams): void {
    for (const { column, op, value } of this.filters) {
      let serialized: string;
      if (op === "in") {
        const list = value as Array<string | number>;
        serialized = `(${list.map((v) => encodeValue(v)).join(",")})`;
      } else if (op === "is") {
        serialized = value === null ? "null" : String(value);
      } else if (op === "like" || op === "ilike") {
        serialized = encodeValue(value);
      } else {
        serialized = encodeValue(value);
      }
      params.append(`${column}.${op}`, op === "in" ? `(${serialized})` : serialized);
    }
    for (const { column, ascending, nullsFirst } of this.orders) {
      params.append("order", `${column}.${ascending ? "asc" : "desc"}.${nullsFirst ? "nullsfirst" : "nullslast"}`);
    }
    if (this.limitCount !== null) params.append("limit", String(this.limitCount));
  }

  private async request<T>(
    method: string,
    path: string,
    params: URLSearchParams,
    body?: unknown,
    prefer?: { return: "representation" | "minimal" }
  ): Promise<T> {
    const headers: Record<string, string> = {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${this.token ?? SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (prefer) headers.Prefer = `return=${prefer.return}`;

    const url = `${SUPABASE_URL}${path}${params.size > 0 ? `?${params.toString()}` : ""}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      console.error(`[supabase] Network error on ${method} ${this.table}:`, err);
      throw new SupabaseRestError("Could not reach the database. Check your connection.", 0);
    }

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const parsed = (await response.json()) as { message?: string };
        if (parsed?.message) detail = parsed.message;
      } catch {
        // keep statusText
      }
      console.error(`[supabase] ${method} ${this.table} failed (${response.status}): ${detail}`);
      throw new SupabaseRestError(detail, response.status);
    }

    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }
}

function encodeValue(value: unknown): string {
  if (typeof value === "string") return `"${value.replace(/"/g, '\\"')}"`;
  if (value === null) return "null";
  if (value instanceof Date) return `"${value.toISOString()}"`;
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value) || typeof value === "object") {
    return `"${JSON.stringify(value).replace(/"/g, '\\"')}"`;
  }
  return String(value);
}

export const supabase = {
  /**
   * Bearer token for authenticated requests. Pass a Supabase session access
   * token so RLS policies using auth.uid() apply; with no token set, requests
   * run as the anon role.
   */
  accessToken: null as string | null,

  setAccessToken(token: string | null): void {
    supabase.accessToken = token;
  },

  from<T = Record<string, unknown>>(table: string): QueryBuilder & { select(columns?: string): Promise<T[]> } {
    return new QueryBuilder(table, supabase.accessToken) as QueryBuilder & {
      select(columns?: string): Promise<T[]>;
    };
  },
};
