export type TextChunk = {
  content: string;
  pageNumber: number | null;
};

export type PageText = {
  num: number;
  text: string;
};

const MIN_CHUNK_CHARS = 600;
const MAX_CHUNK_CHARS = 1400;

export function chunkTextByPage(text: string): TextChunk[] {
  const normalized = text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const pages = normalized.split(/\n--\s*\d+\s+of\s+\d+\s*--\s*\n|\n-{3,}\s*Page\s+\d+\s*-{3,}\n/i);
  const sourcePages = pages.length > 1 ? pages : [normalized];

  return sourcePages.flatMap((pageText, index) => chunkPage(pageText, pages.length > 1 ? index + 1 : null));
}

export function chunkPdfPages(pages: PageText[]): TextChunk[] {
  return pages.flatMap((page) => chunkPage(page.text, page.num));
}

function chunkPage(pageText: string, pageNumber: number | null): TextChunk[] {
  const paragraphs = pageText
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const chunks: TextChunk[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph;

    if (candidate.length > MAX_CHUNK_CHARS && buffer.length >= MIN_CHUNK_CHARS) {
      chunks.push({ content: buffer, pageNumber });
      buffer = paragraph;
      continue;
    }

    if (candidate.length > MAX_CHUNK_CHARS) {
      chunks.push(...splitLongParagraph(candidate, pageNumber));
      buffer = "";
      continue;
    }

    buffer = candidate;
  }

  if (buffer.length > 0) {
    chunks.push({ content: buffer, pageNumber });
  }

  return chunks;
}

function splitLongParagraph(text: string, pageNumber: number | null): TextChunk[] {
  const sentences = text.match(/[^.!?]+[.!?]+|\S.+$/g) ?? [text];
  const chunks: TextChunk[] = [];
  let buffer = "";

  for (const sentence of sentences) {
    const candidate = `${buffer} ${sentence}`.trim();
    if (candidate.length > MAX_CHUNK_CHARS && buffer) {
      chunks.push({ content: buffer, pageNumber });
      buffer = sentence.trim();
    } else {
      buffer = candidate;
    }
  }

  if (buffer) {
    chunks.push({ content: buffer, pageNumber });
  }

  return chunks;
}
