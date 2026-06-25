import assert from "node:assert/strict";
import { parseChatBlocks, parseFlashcards } from "../src/lib/study-content.ts";

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
