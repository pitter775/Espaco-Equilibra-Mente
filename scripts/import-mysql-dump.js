const fs = require("fs");
const { Client } = require("pg");

const dumpPath = process.argv[2] || "dump-railway-202607071253.sql";
const env = fs.readFileSync(".env.local", "utf8");
const vars = Object.fromEntries(
  env
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split(/=(.*)/s).slice(0, 2))
);

const booleanColumns = new Set([
  "users.cadastro_completo",
  "imagens_salas.principal",
  "bloqueios_salas.ativo",
]);

const loadOrder = [
  "enderecos",
  "users",
  "salas",
  "conveniencias",
  "sala_conveniencias",
  "imagens_salas",
  "fechaduras",
  "bloqueios_salas",
  "atividades",
  "contracts",
  "contratos_usuarios",
  "newsletters",
  "debug_logs",
  "reservas",
  "transacoes",
  "faturas",
  "notas_fiscais",
  "failed_jobs",
  "password_reset_tokens",
  "personal_access_tokens",
  "migrations",
];

function parseColumns(sql) {
  const tables = {};
  const re = /CREATE TABLE `([^`]+)` \(([\s\S]*?)\n\) ENGINE=/g;
  let match;
  while ((match = re.exec(sql))) {
    const [, table, body] = match;
    tables[table] = [];
    for (const line of body.split(/\r?\n/)) {
      const col = line.match(/^\s*`([^`]+)`/);
      if (col) tables[table].push(col[1]);
    }
  }
  return tables;
}

function unescapeMysqlString(value) {
  return value.replace(/\\([0bnrtZ'"\\])/g, (_, char) => {
    switch (char) {
      case "0":
        return "\0";
      case "b":
        return "\b";
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "\t";
      case "Z":
        return "\x1a";
      default:
        return char;
    }
  });
}

function parseValues(valuesSql) {
  const rows = [];
  let i = 0;

  while (i < valuesSql.length) {
    while (i < valuesSql.length && /[\s,]/.test(valuesSql[i])) i++;
    if (valuesSql[i] !== "(") break;
    i++;

    const row = [];
    while (i < valuesSql.length) {
      while (i < valuesSql.length && /\s/.test(valuesSql[i])) i++;
      if (valuesSql[i] === "'") {
        i++;
        let value = "";
        while (i < valuesSql.length) {
          const char = valuesSql[i];
          if (char === "\\") {
            value += char + valuesSql[i + 1];
            i += 2;
            continue;
          }
          if (char === "'") {
            i++;
            break;
          }
          value += char;
          i++;
        }
        row.push(unescapeMysqlString(value));
      } else {
        const start = i;
        while (i < valuesSql.length && valuesSql[i] !== "," && valuesSql[i] !== ")") i++;
        const raw = valuesSql.slice(start, i).trim();
        row.push(raw.toUpperCase() === "NULL" ? null : raw);
      }

      while (i < valuesSql.length && /\s/.test(valuesSql[i])) i++;
      if (valuesSql[i] === ",") {
        i++;
        continue;
      }
      if (valuesSql[i] === ")") {
        i++;
        rows.push(row);
        break;
      }
    }
  }

  return rows;
}

function extractInserts(sql) {
  const inserts = {};
  const marker = "INSERT INTO `";
  let index = 0;

  while ((index = sql.indexOf(marker, index)) !== -1) {
    const tableStart = index + marker.length;
    const tableEnd = sql.indexOf("`", tableStart);
    const table = sql.slice(tableStart, tableEnd);
    const valuesStartMarker = " VALUES ";
    const valuesStart = sql.indexOf(valuesStartMarker, tableEnd) + valuesStartMarker.length;

    let i = valuesStart;
    let inString = false;
    while (i < sql.length) {
      const char = sql[i];
      if (inString) {
        if (char === "\\") {
          i += 2;
          continue;
        }
        if (char === "'") inString = false;
      } else {
        if (char === "'") inString = true;
        else if (char === ";") break;
      }
      i++;
    }

    const valuesSql = sql.slice(valuesStart, i);
    inserts[table] ||= [];
    inserts[table].push(...parseValues(valuesSql));
    index = i + 1;
  }
  return inserts;
}

function normalizeValue(table, column, value) {
  if (value === null) return null;
  if (booleanColumns.has(`${table}.${column}`)) return value === "1" || value === 1 || value === true;
  if (
    table === "users" && column === "id" ||
    ["usuario_id", "created_by", "user_id", "id_usuario"].includes(column)
  ) {
    return String(value);
  }
  return value;
}

async function recreateSchema(client) {
  await client.query("drop schema public cascade");
  await client.query("create schema public");
  await client.query("grant usage on schema public to anon, authenticated, service_role");
  await client.query("grant all on schema public to postgres, service_role");
  await client.query(fs.readFileSync("supabase/schema.sql", "utf8"));
}

async function insertRows(client, table, columns, rows) {
  if (!rows.length) return 0;
  const quotedColumns = columns.map((col) => `"${col}"`).join(", ");
  let count = 0;
  const chunkSize = Math.max(1, Math.floor(3000 / columns.length));

  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    const values = [];
    const rowSql = chunk.map((row, rowIndex) => {
      const placeholders = columns.map((column, columnIndex) => {
        values.push(normalizeValue(table, column, row[columnIndex]));
        return `$${rowIndex * columns.length + columnIndex + 1}`;
      });
      return `(${placeholders.join(", ")})`;
    });

    const sql = `insert into public."${table}" (${quotedColumns}) values ${rowSql.join(", ")} on conflict do nothing`;
    const result = await client.query(sql, values);
    count += result.rowCount || 0;
  }
  return count;
}

async function resetSequences(client) {
  const serialTables = loadOrder.filter((table) => table !== "users" && table !== "password_reset_tokens");
  for (const table of serialTables) {
    const hasId = await client.query(
      "select 1 from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name = 'id'",
      [table]
    );
    if (!hasId.rowCount) continue;
    const { rows } = await client.query("select pg_get_serial_sequence($1, 'id') as seq", [`public.${table}`]);
    if (rows[0]?.seq) {
      await client.query(`select setval($1, coalesce((select max(id) from public."${table}"), 1), true)`, [rows[0].seq]);
    }
  }
}

async function main() {
  if (!vars.DATABASE_URL) throw new Error("DATABASE_URL ausente em .env.local");
  const noRecreate = process.argv.includes("--no-recreate");
  const startAtArg = process.argv.find((arg) => arg.startsWith("--start-at="));
  const startAt = startAtArg ? startAtArg.split("=")[1] : null;
  const dump = fs.readFileSync(dumpPath, "utf8");
  const columnsByTable = parseColumns(dump);
  const insertsByTable = extractInserts(dump);

  const client = new Client({ connectionString: vars.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  if (!noRecreate) await recreateSchema(client);

  const summary = {};
  let shouldImport = !startAt;
  for (const table of loadOrder) {
    if (table === startAt) shouldImport = true;
    if (!shouldImport) continue;
    const columns = columnsByTable[table];
    const rows = insertsByTable[table] || [];
    if (!columns) {
      summary[table] = "missing create table in dump";
      continue;
    }
    summary[table] = await insertRows(client, table, columns, rows);
    console.log(`${table}: ${summary[table]}`);
  }

  await resetSequences(client);
  await client.end();
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
