export type VisualNode = {
  label: string;
  children: VisualNode[];
};

export type ChatBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; rows: string[][] }
  | { type: "visual-tree"; nodes: VisualNode[] };

export type Flashcard = {
  front: string;
  back: string;
  hint?: string;
  source?: string;
};

export function parseChatBlocks(content: string): ChatBlock[] {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks: ChatBlock[] = [];
  let paragraph: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      blocks.push({ type: "paragraph", text: paragraph.join(" ").trim() });
      paragraph = [];
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (isMarkdownTableLine(line) && index + 1 < lines.length && isMarkdownDividerLine(lines[index + 1].trim())) {
      flushParagraph();
      const rows: string[][] = [splitMarkdownTableLine(line)];
      index += 2;

      while (index < lines.length && isMarkdownTableLine(lines[index].trim())) {
        rows.push(splitMarkdownTableLine(lines[index].trim()));
        index += 1;
      }

      index -= 1;
      blocks.push({ type: "table", rows });
      continue;
    }

    if (isVisualHeading(line)) {
      flushParagraph();
      const visualLines: string[] = [];
      index += 1;

      while (index < lines.length) {
        const currentLine = lines[index];
        if (!currentLine.trim()) {
          break;
        }
        if (!looksLikeVisualTreeLine(currentLine)) {
          index -= 1;
          break;
        }
        visualLines.push(currentLine);
        index += 1;
      }

      if (visualLines.length > 0) {
        blocks.push({ type: "visual-tree", nodes: parseVisualTree(visualLines) });
        continue;
      }
    }

    const heading = line.match(/^#{1,4}\s+(.+)$/) ?? line.match(/^\*\*(.+):\*\*$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: "heading", text: stripMarkdown(heading[1]) });
      continue;
    }

    const orderedItems: string[] = [];
    while (index < lines.length) {
      const match = lines[index].trim().match(/^\d+[\).]\s+(.+)$/);
      if (!match) {
        break;
      }
      orderedItems.push(stripMarkdown(match[1]));
      index += 1;
    }
    if (orderedItems.length > 0) {
      flushParagraph();
      index -= 1;
      blocks.push({ type: "list", ordered: true, items: orderedItems });
      continue;
    }

    const bulletItems: string[] = [];
    while (index < lines.length) {
      const match = lines[index].trim().match(/^[-*\u2022]\s+(.+)$/);
      if (!match) {
        break;
      }
      bulletItems.push(stripMarkdown(match[1]));
      index += 1;
    }
    if (bulletItems.length > 0) {
      flushParagraph();
      index -= 1;
      blocks.push({ type: "list", ordered: false, items: bulletItems });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();
  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: content }];
}

export function parseFlashcards(content: string): Flashcard[] {
  const starts = [...content.matchAll(/^(?:CARD\s+\d+\s*:?\s*\n)?(?:Front|Frente):/gim)];

  return starts.flatMap((match, index) => {
    const start = match.index ?? 0;
    const end = starts[index + 1]?.index ?? content.length;
    const chunk = content.slice(start, end);
    const front = readField(chunk, ["Front", "Frente"]);
    const back = readField(chunk, ["Back", "Respuesta", "Reverso"]);

    if (!front || !back) {
      return [];
    }

    const hint = readField(chunk, ["Hint", "Pista"]);
    const source = readField(chunk, ["Source", "Fuente"]);
    return [{ front, back, hint: hint || undefined, source: source || undefined }];
  });
}

function isMarkdownTableLine(line: string) {
  return line.startsWith("|") && line.endsWith("|") && line.split("|").length > 2;
}

function isMarkdownDividerLine(line: string) {
  return /^\|?[\s:-]+\|[\s|:-]+\|?$/.test(line);
}

function splitMarkdownTableLine(line: string) {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => stripMarkdown(cell.trim()))
    .filter(Boolean);
}

function stripMarkdown(text: string) {
  return text.replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").trim();
}

function isVisualHeading(line: string) {
  const normalized = stripMarkdown(line.replace(/^#{1,4}\s+/, "")).replace(/:$/, "").trim();
  return /^(visual map|mapa visual|mind map|mapa mental|study diagram|gr(?:a|á)fico|esquema)$/iu.test(normalized);
}

function looksLikeVisualTreeLine(line: string) {
  return /^\s*[-*]\s+.+$/.test(line);
}

function parseVisualTree(lines: string[]): VisualNode[] {
  const roots: VisualNode[] = [];
  const stack: Array<{ depth: number; node: VisualNode }> = [];

  for (const rawLine of lines) {
    const match = rawLine.match(/^(\s*)[-*]\s+(.+)$/);
    if (!match) {
      continue;
    }

    const depth = Math.floor(match[1].replace(/\t/g, "  ").length / 2);
    const node: VisualNode = { label: stripMarkdown(match[2]), children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ depth, node });
  }

  return roots;
}

function readField(chunk: string, labels: string[]) {
  return chunk.match(new RegExp(`^(?:${labels.join("|")}):\\s*(.+)$`, "im"))?.[1]?.trim() ?? "";
}
