#!/usr/bin/env node
// Payload 3.90's object-key field is nullable for existing stored media.
// The Google-only users collection disables local strategy and adds no reset fields.
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "../generated/prisma/index.js";

const db = new PrismaClient({ log: [] });
try {
  const columns = await db.$queryRawUnsafe(
    "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'media' ORDER BY ordinal_position",
  );
  const existing = columns.find((c) => c.column_name === "_objectkey");
  if (
    existing &&
    (existing.data_type !== "character varying" ||
      existing.is_nullable !== "YES")
  )
    throw new Error("Unexpected existing field type");
  await mkdir(".vercel", { recursive: true });
  if (!existing)
    await writeFile(
      ".vercel/payload-390-schema-before.json",
      JSON.stringify(columns, null, 2) + "\n",
      { flag: "wx" },
    );
  const fingerprint =
    "SELECT count(*)::int AS rows, md5(coalesce(string_agg(md5((to_jsonb(m) - '_objectkey')::text), '' ORDER BY id), '')) AS fingerprint FROM payload.media m";
  const result = await db.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '5s'");
      await tx.$executeRawUnsafe(
        "LOCK TABLE payload.media IN ACCESS EXCLUSIVE MODE",
      );
      const [before] = await tx.$queryRawUnsafe(fingerprint);
      await tx.$executeRawUnsafe(
        'ALTER TABLE payload.media ADD COLUMN IF NOT EXISTS "_objectkey" varchar',
      );
      const [after] = await tx.$queryRawUnsafe(fingerprint);
      if (
        before.rows !== after.rows ||
        before.fingerprint !== after.fingerprint
      )
        throw new Error("Existing media changed");
      return { rows: after.rows, added: !existing };
    },
    { maxWait: 5000, timeout: 10000 },
  );
  console.log(
    `PASS Payload 3.90 nullable object-key migration; ${result.rows} existing media rows unchanged; added=${result.added}.`,
  );
} catch (error) {
  console.error(
    `Payload migration stopped (${error.code ?? error.constructor.name}); credentials and media records were not logged.`,
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
