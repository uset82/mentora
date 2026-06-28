import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const sourcePath = resolve("src/lib/study-content.ts");
const source = await readFile(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
});
const tempDir = await mkdtemp(join(tmpdir(), "mentora-study-content-"));
const compiledPath = join(tempDir, "study-content.mjs");
await writeFile(compiledPath, compiled.outputText, "utf8");

const { parseChatBlocks, parseFlashcards } = await import(pathToFileURL(compiledPath).href);

const cards = parseFlashcards(`Flashcards generated

Front: Primera pregunta
Back: Primera respuesta [1]

CARD 2
Front: Segunda pregunta
Back: Segunda respuesta [2]
Hint: Recuerda el concepto
Source: [2]`);

assert.equal(cards.length, 2);
assert.equal(cards[0].front, "Primera pregunta");
assert.equal(cards[1].hint, "Recuerda el concepto");

const blocks = parseChatBlocks(`**Mapa visual:**
- Tema central
  - Rama
    - Detalle`);
const visual = blocks.find((block) => block.type === "visual-tree");

assert.ok(visual && visual.type === "visual-tree");
assert.equal(visual.nodes[0].children[0].children[0].label, "Detalle");

console.log("Study-content parser checks passed.");
