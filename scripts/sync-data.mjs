/* npm run sync-data — pull the herb list from MySQL (the team's PHP api/herbs_export.php)
   into src/data/herbs.json, then run the tests. If any test fails, the old file is put back,
   so a wrong row in MySQL never reaches a herb card.

   Set in .env.local:
     HERBS_EXPORT_URL=https://<php-server>/thaiherbalcare/api/herbs_export.php
     HERBS_EXPORT_TOKEN=...   (only if EXPORT_TOKEN is set in the PHP config) */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const FILE = "src/data/herbs.json";

function loadEnvLocal() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

loadEnvLocal();
const base = process.env.HERBS_EXPORT_URL;
if (!base) {
  console.error("ตั้ง HERBS_EXPORT_URL ใน .env.local ก่อน (ดู .env.example)");
  process.exit(1);
}
const url = new URL(base);
if (process.env.HERBS_EXPORT_TOKEN) url.searchParams.set("token", process.env.HERBS_EXPORT_TOKEN);

const res = await fetch(url, { headers: { accept: "application/json" } });
if (!res.ok) {
  console.error(`ดึงข้อมูลไม่สำเร็จ: HTTP ${res.status}`);
  process.exit(1);
}
const next = await res.json();
if (!Array.isArray(next.herbs) || next.herbs.length === 0) {
  console.error("ข้อมูลที่ได้ไม่มี herbs[] — ไม่เขียนทับไฟล์");
  process.exit(1);
}

const before = readFileSync(FILE, "utf8");
const prev = new Map(JSON.parse(before).herbs.map((h) => [h.id, h]));
const ids = new Set(next.herbs.map((h) => h.id));
const added = next.herbs.filter((h) => !prev.has(h.id)).map((h) => h.id);
const removed = [...prev.keys()].filter((id) => !ids.has(id));
const changed = next.herbs
  .filter((h) => prev.has(h.id) && JSON.stringify(h) !== JSON.stringify(prev.get(h.id)))
  .map((h) => h.id);

if (!added.length && !removed.length && !changed.length) {
  console.log(`ไม่มีอะไรเปลี่ยน (${next.herbs.length} รายการ)`);
  process.exit(0);
}

writeFileSync(FILE, JSON.stringify(next, null, 2) + "\n");
console.log(`เพิ่ม ${added.length} · ลบ ${removed.length} · แก้ ${changed.length}`);
for (const [label, list] of [["+", added], ["-", removed], ["~", changed]]) {
  for (const id of list) console.log(`  ${label} ${id}`);
}

try {
  execSync("npx vitest run", { stdio: "inherit" });
  console.log(`\nเขียน ${FILE} แล้ว — ตรวจ git diff แล้ว commit`);
} catch {
  writeFileSync(FILE, before);
  console.error(`\nเทสต์ไม่ผ่าน — คืนค่า ${FILE} เดิมแล้ว แก้ข้อมูลใน MySQL แล้วลองใหม่`);
  process.exit(1);
}
