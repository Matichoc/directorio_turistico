/**
 * Copia el contenido del directorio desde el esquema `legacy` del proyecto
 * de Supabase compartido (hoy el esquema `public` de ese proyecto es del
 * sitio de Papudo) a un proyecto de Supabase nuevo, solo del diablo. Paso a
 * paso en docs/SUPABASE-PROPIO.md.
 *
 * Garantías (pedido del usuario: "no quiero que toques nada de Papudo"):
 * - Origen en solo lectura: la sesión se pone en modo solo lectura y todo
 *   se lee dentro de una transacción READ ONLY. Solo se lee el esquema `legacy`; `public` (Papudo) ni se mira.
 * - El destino nunca puede ser el proyecto compartido (se rechaza si la URL
 *   trae su código de proyecto, o si apunta a la misma base que el origen).
 * - El destino tiene que ser una base del directorio (con
 *   `public.communes`, creada con `supabase db push`) y estar vacía; solo con
 *   `--reemplazar` se vacían antes sus tablas del directorio.
 * - Todo se copia en una sola transacción. Sin `--aplicar` es un simulacro:
 *   copia, cuenta y deshace (ROLLBACK), sin dejar nada escrito.
 *
 * Lo que no se copia: las tablas que exigen una cuenta de usuario
 * (`admin_users`, "me gusta", comentarios, "Mi recorrido") — las cuentas
 * viven en el proyecto compartido y no existen en el nuevo. Las columnas
 * opcionales que apuntan a una cuenta (quién verificó o moderó) quedan
 * vacías. Las tablas que no son del directorio (p. ej. `_archivo`) se
 * informan y se saltan.
 *
 * Uso (las URL salen de Supabase → botón "Connect" → Session pooler):
 *   LEGACY_DATABASE_URL=... TARGET_DATABASE_URL=... pnpm db:copy-legacy
 *   LEGACY_DATABASE_URL=... TARGET_DATABASE_URL=... pnpm db:copy-legacy --aplicar
 * (también se pueden dejar en .env.local, que no se sube al repo).
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

/** Proyecto compartido con Papudo: nunca puede ser el destino. */
const SHARED_PROJECT_REF =
  process.env.LEGACY_PROJECT_REF ?? "qbfvsnkywlvozvxeujgh";
const SOURCE_SCHEMA = "legacy";
const TARGET_SCHEMA = "public";
const BATCH_SIZE = 200;

const apply = process.argv.includes("--aplicar");
const replace = process.argv.includes("--reemplazar");

// Fechas y horas tal cual vienen de la base (texto), para no correrlas de
// zona horaria al pasar por objetos Date de JavaScript.
for (const oid of [1082, 1083, 1114, 1184, 1186, 1266]) {
  pg.types.setTypeParser(oid, (value) => value);
}

interface Column {
  name: string;
  type: string;
  notNull: boolean;
  generated: boolean;
}

interface ForeignKey {
  table: string;
  columns: string[];
  refSchema: string;
  refTable: string;
  notNull: boolean;
}

/** Lo mínimo para consultar: un cliente de Postgres o el lector vigilado. */
interface Queryable {
  query<R extends pg.QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<pg.QueryResult<R>>;
}

/**
 * Único acceso al proyecto compartido. Además de la sesión en solo lectura
 * y del `search_path` en `legacy`, revisa cada consulta antes de mandarla:
 * si menciona `public` (el esquema de Papudo, que tiene tablas con los
 * mismos nombres: places, localities, routes…) o no es una lectura, se
 * detiene sin enviarla.
 */
function legacyReader(client: pg.Client): Queryable {
  return {
    query<R extends pg.QueryResultRow>(sql: string, params: unknown[] = []) {
      const text = [sql, ...params.map(String)].join(" ");
      if (/\bpublic\b/i.test(text)) {
        fail(
          `Bloqueado: una consulta al proyecto compartido mencionaba "public" (Papudo). No se envió.\n  ${sql}`,
        );
      }
      if (!/^\s*(select|begin|set|rollback)\b/i.test(sql)) {
        fail(
          `Bloqueado: al proyecto compartido solo se le hacen lecturas. No se envió.\n  ${sql}`,
        );
      }
      return client.query<R>(sql, params);
    },
  };
}

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function quote(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

/** Supabase usa SSL; una base local de prueba, no. */
function sslFor(url: string) {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1"
    ? false
    : { rejectUnauthorized: false };
}

function hostAndDb(url: string) {
  const parsed = new URL(url);
  return `${parsed.hostname}:${parsed.port || "5432"}${parsed.pathname}|${decodeURIComponent(parsed.username)}`;
}

async function listTables(client: Queryable, schema: string) {
  const { rows } = await client.query<{ table_name: string }>(
    `select table_name from information_schema.tables
      where table_schema = $1 and table_type = 'BASE TABLE'
      order by table_name`,
    [schema],
  );
  return rows.map((row) => row.table_name);
}

async function listColumns(client: Queryable, schema: string, table: string) {
  const { rows } = await client.query<{
    name: string;
    type: string;
    not_null: boolean;
    generated: string;
  }>(
    `select a.attname as name,
            format_type(a.atttypid, a.atttypmod) as type,
            a.attnotnull as not_null,
            a.attgenerated as generated
       from pg_attribute a
      where a.attrelid = format('%I.%I', $1::text, $2::text)::regclass
        and a.attnum > 0 and not a.attisdropped
      order by a.attnum`,
    [schema, table],
  );
  return rows.map<Column>((row) => ({
    name: row.name,
    type: row.type,
    notNull: row.not_null,
    generated: row.generated !== "",
  }));
}

async function listForeignKeys(client: pg.Client, schema: string) {
  const { rows } = await client.query<{
    table: string;
    columns: string[];
    ref_schema: string;
    ref_table: string;
    not_null: boolean;
  }>(
    `select cl.relname as table,
            array(
              select a.attname::text from unnest(c.conkey) k
              join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k
            ) as columns,
            rn.nspname as ref_schema,
            rcl.relname as ref_table,
            bool_and(a2.attnotnull) as not_null
       from pg_constraint c
       join pg_class cl on cl.oid = c.conrelid
       join pg_namespace n on n.oid = cl.relnamespace
       join pg_class rcl on rcl.oid = c.confrelid
       join pg_namespace rn on rn.oid = rcl.relnamespace
       join unnest(c.conkey) k2 on true
       join pg_attribute a2 on a2.attrelid = c.conrelid and a2.attnum = k2
      where c.contype = 'f' and n.nspname = $1
      group by c.oid, c.conrelid, cl.relname, c.conkey, rn.nspname, rcl.relname`,
    [schema],
  );
  return rows.map<ForeignKey>((row) => ({
    table: row.table,
    columns: row.columns,
    refSchema: row.ref_schema,
    refTable: row.ref_table,
    notNull: row.not_null,
  }));
}

/** Orden de inserción: primero las tablas a las que otras apuntan. */
function sortByDependencies(tables: string[], foreignKeys: ForeignKey[]) {
  const pending = new Set(tables);
  const ordered: string[] = [];
  while (pending.size > 0) {
    const ready = [...pending].filter((table) =>
      foreignKeys.every(
        (fk) =>
          fk.table !== table ||
          fk.refSchema !== TARGET_SCHEMA ||
          fk.refTable === table ||
          !pending.has(fk.refTable),
      ),
    );
    if (ready.length === 0) {
      fail(
        `Dependencias circulares entre: ${[...pending].join(", ")}. Revisa el esquema.`,
      );
    }
    for (const table of ready.sort()) {
      ordered.push(table);
      pending.delete(table);
    }
  }
  return ordered;
}

/** Filas con referencia a otra fila de la misma tabla: padres primero. */
function sortSelfReferences(
  rows: Record<string, unknown>[],
  selfColumn: string | undefined,
) {
  if (!selfColumn || !rows.length || !("id" in rows[0])) return rows;
  const placed = new Set<unknown>();
  const result: Record<string, unknown>[] = [];
  let pending = rows;
  while (pending.length > 0) {
    const next = pending.filter(
      (row) => row[selfColumn] == null || placed.has(row[selfColumn]),
    );
    if (next.length === 0) return [...result, ...pending];
    for (const row of next) {
      placed.add(row.id);
      result.push(row);
    }
    pending = pending.filter((row) => !next.includes(row));
  }
  return result;
}

async function main() {
  const sourceUrl = process.env.LEGACY_DATABASE_URL;
  const targetUrl = process.env.TARGET_DATABASE_URL;
  if (!sourceUrl || !targetUrl) {
    fail(
      "Faltan LEGACY_DATABASE_URL (proyecto compartido) y/o TARGET_DATABASE_URL (proyecto nuevo del diablo). Ver docs/SUPABASE-PROPIO.md.",
    );
  }
  if (targetUrl.includes(SHARED_PROJECT_REF)) {
    fail(
      `TARGET_DATABASE_URL apunta al proyecto compartido (${SHARED_PROJECT_REF}), donde está Papudo. El destino tiene que ser el proyecto NUEVO del diablo.`,
    );
  }
  if (hostAndDb(sourceUrl) === hostAndDb(targetUrl)) {
    fail("El origen y el destino son la misma base. Revisa las dos URL.");
  }

  const source = new pg.Client({
    connectionString: sourceUrl,
    ssl: sslFor(sourceUrl),
  });
  const target = new pg.Client({
    connectionString: targetUrl,
    ssl: sslFor(targetUrl),
  });
  await source.connect();
  await target.connect();
  // Tres candados sobre el proyecto compartido: (1) sesión en solo lectura
  // (Postgres rechaza cualquier escritura), (2) `search_path` solo en
  // `legacy` (un nombre sin esquema nunca puede caer en `public` de Papudo)
  // y (3) `legacyReader`, que revisa cada consulta antes de enviarla.
  const legacy = legacyReader(source);
  await legacy.query("set session characteristics as transaction read only");
  await legacy.query("set search_path to legacy");

  try {
    await legacy.query("begin transaction read only");

    const sourceTables = await listTables(legacy, SOURCE_SCHEMA);
    if (sourceTables.length === 0) {
      fail(`El origen no tiene tablas en el esquema "${SOURCE_SCHEMA}".`);
    }
    const targetTables = new Set(await listTables(target, TARGET_SCHEMA));
    if (!targetTables.has("communes")) {
      fail(
        'El destino no tiene las tablas del directorio (falta public.communes). Corre primero "supabase db push" con el repo enlazado al proyecto NUEVO.',
      );
    }

    const notInTarget = sourceTables.filter((t) => !targetTables.has(t));
    const shared = sourceTables.filter((t) => targetTables.has(t));

    const foreignKeys = (await listForeignKeys(target, TARGET_SCHEMA)).filter(
      (fk) => shared.includes(fk.table),
    );

    // Tablas que exigen una cuenta de usuario (o una fila de una tabla que no
    // se copia): no se pueden copiar sin las cuentas, que quedan atrás.
    const skipped = new Map<string, string>();
    let changed = true;
    while (changed) {
      changed = false;
      for (const fk of foreignKeys) {
        if (skipped.has(fk.table) || !fk.notNull) continue;
        const toAuth = fk.refSchema === "auth";
        const toSkipped =
          fk.refSchema === TARGET_SCHEMA && skipped.has(fk.refTable);
        if (toAuth || toSkipped) {
          skipped.set(
            fk.table,
            toAuth
              ? "necesita cuentas de usuario"
              : `depende de ${fk.refTable}`,
          );
          changed = true;
        }
      }
    }
    const toCopy = sortByDependencies(
      shared.filter((t) => !skipped.has(t)),
      foreignKeys,
    );

    // Columnas opcionales que apuntan a una cuenta o a una tabla saltada:
    // quedan vacías en vez de apuntar a algo que no existe.
    const nulledColumns = new Map<string, Set<string>>();
    for (const fk of foreignKeys) {
      if (fk.notNull || !toCopy.includes(fk.table)) continue;
      if (
        fk.refSchema === "auth" ||
        (fk.refSchema === TARGET_SCHEMA && skipped.has(fk.refTable))
      ) {
        const set = nulledColumns.get(fk.table) ?? new Set<string>();
        fk.columns.forEach((column) => set.add(column));
        nulledColumns.set(fk.table, set);
      }
    }

    const nonEmpty: string[] = [];
    for (const table of toCopy) {
      const { rows } = await target.query<{ n: string }>(
        `select count(*)::text as n from ${TARGET_SCHEMA}.${quote(table)}`,
      );
      if (rows[0].n !== "0") nonEmpty.push(`${table} (${rows[0].n})`);
    }
    if (nonEmpty.length > 0 && !replace) {
      fail(
        `El destino ya tiene datos en: ${nonEmpty.join(", ")}.\n  Si es el proyecto nuevo del diablo y quieres volver a copiar, agrega --reemplazar (vacía esas tablas del destino antes de copiar).`,
      );
    }

    await target.query("begin");
    if (replace && nonEmpty.length > 0) {
      await target.query(
        `truncate ${toCopy.map((t) => `${TARGET_SCHEMA}.${quote(t)}`).join(", ")} cascade`,
      );
    }

    const report: { table: string; source: number; copied: number }[] = [];
    for (const table of toCopy) {
      const targetColumns = (
        await listColumns(target, TARGET_SCHEMA, table)
      ).filter((column) => !column.generated);
      const sourceColumnNames = new Set(
        (await listColumns(legacy, SOURCE_SCHEMA, table)).map((c) => c.name),
      );
      const columns = targetColumns.filter((c) =>
        sourceColumnNames.has(c.name),
      );
      const missingRequired = targetColumns.filter(
        (c) => !sourceColumnNames.has(c.name) && c.notNull,
      );
      if (missingRequired.length > 0) {
        // Columnas nuevas con valor por defecto se completan solas; sin
        // defecto, la inserción fallará y se deshace todo.
        console.warn(
          `  ! ${table}: el destino tiene columnas que el origen no: ${missingRequired.map((c) => c.name).join(", ")} (se usa su valor por defecto)`,
        );
      }

      const { rows: sourceRows } = await legacy.query<Record<string, unknown>>(
        `select ${columns.map((c) => quote(c.name)).join(", ")} from ${SOURCE_SCHEMA}.${quote(table)}`,
      );
      const selfFk = foreignKeys.find(
        (fk) =>
          fk.table === table &&
          fk.refSchema === TARGET_SCHEMA &&
          fk.refTable === table &&
          fk.columns.length === 1,
      );
      const rows = sortSelfReferences(sourceRows, selfFk?.columns[0]);
      const nulled = nulledColumns.get(table) ?? new Set<string>();

      for (let start = 0; start < rows.length; start += BATCH_SIZE) {
        const batch = rows.slice(start, start + BATCH_SIZE);
        const values: unknown[] = [];
        const tuples = batch.map((row) => {
          const placeholders = columns.map((column) => {
            let value = nulled.has(column.name) ? null : row[column.name];
            if (
              value !== null &&
              (column.type === "jsonb" || column.type === "json")
            ) {
              value = JSON.stringify(value);
            }
            values.push(value);
            return `$${values.length}::${column.type}`;
          });
          return `(${placeholders.join(", ")})`;
        });
        await target.query(
          `insert into ${TARGET_SCHEMA}.${quote(table)} (${columns.map((c) => quote(c.name)).join(", ")})
           overriding system value
           values ${tuples.join(", ")}`,
          values,
        );
      }

      // Contadores (identity/serial) al día, para que lo nuevo no choque.
      for (const column of columns) {
        const { rows: seq } = await target.query<{ seq: string | null }>(
          "select pg_get_serial_sequence($1, $2) as seq",
          [`${TARGET_SCHEMA}.${quote(table)}`, column.name],
        );
        if (seq[0]?.seq) {
          await target.query(
            `select setval($1, coalesce((select max(${quote(column.name)}) from ${TARGET_SCHEMA}.${quote(table)}), 0) + 1, false)`,
            [seq[0].seq],
          );
        }
      }

      const { rows: count } = await target.query<{ n: string }>(
        `select count(*)::text as n from ${TARGET_SCHEMA}.${quote(table)}`,
      );
      report.push({
        table,
        source: sourceRows.length,
        copied: Number(count[0].n),
      });
    }

    console.log(
      `\n${apply ? "COPIA" : "SIMULACRO (no se guarda nada)"}: ${SOURCE_SCHEMA} → proyecto nuevo\n`,
    );
    for (const { table, source: n, copied } of report) {
      const ok = n === copied ? "✓" : "✖";
      console.log(
        `  ${ok} ${table.padEnd(26)} ${String(copied).padStart(5)} / ${n}`,
      );
    }
    if (skipped.size > 0) {
      console.log("\n  No se copian (quedan en legacy, intactas):");
      for (const [table, reason] of skipped) {
        console.log(`    · ${table} — ${reason}`);
      }
    }
    if (notInTarget.length > 0) {
      console.log(
        `\n  No son tablas del directorio (se saltan): ${notInTarget.join(", ")}`,
      );
    }
    if (nulledColumns.size > 0) {
      console.log(
        `\n  Quedan vacías (apuntaban a cuentas de usuario): ${[
          ...nulledColumns,
        ]
          .map(([t, cols]) => `${t}.${[...cols].join("/")}`)
          .join(", ")}`,
      );
    }

    const mismatch = report.some((r) => r.source !== r.copied);
    if (mismatch) {
      await target.query("rollback");
      fail(
        "Las cantidades no calzan: se deshizo todo, el destino quedó igual.",
      );
    }
    if (apply) {
      await target.query("commit");
      console.log("\n✓ Copia guardada en el proyecto nuevo.\n");
    } else {
      await target.query("rollback");
      console.log(
        "\n✓ Simulacro OK: se deshizo todo. Para guardar de verdad, repite con --aplicar.\n",
      );
    }
  } catch (error) {
    await target.query("rollback").catch(() => {});
    throw error;
  } finally {
    await legacy.query("rollback").catch(() => {});
    await source.end();
    await target.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
