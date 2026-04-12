#!/usr/bin/env node
// Compiles lesson-schema.tsp → JSON Schema, then validates every data/*.json
// file against the generated Lesson schema using ajv.

const { execSync } = require("child_process");
const { readFileSync, readdirSync } = require("fs");
const path = require("path");

// --- 1. Compile TypeSpec → JSON Schema ---

console.log("Compiling TypeSpec schema…");
execSync("npx tsp compile lesson-schema.tsp", { stdio: "inherit" });

const schemaPath = path.join(
  "tsp-output",
  "@typespec",
  "json-schema",
  "Lesson.json"
);
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

// --- 2. Validate all lesson files ---

const Ajv = require("ajv/dist/2020");
const ajv = new Ajv({ strict: false });
const validate = ajv.compile(schema);

const lessonFiles = readdirSync("data").filter((f) => f.endsWith(".json"));

if (lessonFiles.length === 0) {
  console.error("No lesson JSON files found in data/");
  process.exit(1);
}

let failed = 0;

console.log(`\nValidating ${lessonFiles.length} lesson file(s)…`);
for (const file of lessonFiles) {
  const filePath = path.join("data", file);
  const data = JSON.parse(readFileSync(filePath, "utf8"));

  if (validate(data)) {
    console.log(`  ✓  ${filePath}`);
  } else {
    console.error(`  ✗  ${filePath}`);
    for (const err of validate.errors) {
      const loc = err.instancePath || "(root)";
      console.error(`       ${loc}: ${err.message}`);
    }
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed validation.`);
  process.exit(1);
}

console.log("\nAll lesson files are valid.");
