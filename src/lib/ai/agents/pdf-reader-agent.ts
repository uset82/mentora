import { transcribePdfPageImage } from "@/lib/ai/gateway";
import { getPDFParse } from "@/lib/ai/pdf-parser";

export interface PageText {
  num: number;
  text: string;
  source: "text" | "ocr";
}

const OCR_CONCURRENCY = 2; // Concurrency limit for local/dev
const OCR_PAGE_TIMEOUT_MS = 30_000;
const MIN_MEANINGFUL_CHARS = 80;
const MIN_MEANINGFUL_WORDS = 12;

function countMeaningfulChars(content: string): number {
  return (content.match(/[\p{L}\p{N}]/gu) ?? []).length;
}

function countMeaningfulWords(content: string): number {
  return (content.match(/[\p{L}\p{N}]{3,}/gu) ?? []).length;
}

function hasMeaningfulText(text: string): boolean {
  return (
    countMeaningfulChars(text) >= MIN_MEANINGFUL_CHARS &&
    countMeaningfulWords(text) >= MIN_MEANINGFUL_WORDS
  );
}

function normalizeExtractedContent(content: string): string {
  return content
    .replace(/\r/g, "")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * PDF Reader Agent
 * Extracts text page-by-page. Automatically detects image/scanned pages
 * and falls back to OCR using OpenRouter Vision on those specific pages.
 */
export async function readPdf(
  buffer: Buffer,
  onProgress?: (step: string) => void
): Promise<PageText[]> {
  onProgress?.("Extracting text layer...");
  const PDFParse = await getPDFParse();
  const parser = new PDFParse({ data: buffer });
  interface ParsedResult {
    pages?: { text: string }[];
    total?: number;
  }
  let parsed: ParsedResult;
  try {
    parsed = await parser.getText({ pageJoiner: "" }) as ParsedResult;
  } catch (error) {
    console.error("[Reader Agent] PDF text extraction failed, trying fallback:", error);
    parsed = { pages: [], total: 0 };
  } finally {
    await parser.destroy();
  }

  const totalPages = parsed.total || parsed.pages?.length || 0;
  if (totalPages === 0) {
    throw new Error("PDF contains no pages or is corrupt.");
  }

  // Parse structured pages
  const results: PageText[] = [];
  const ocrPageNumbers: number[] = [];

  for (let index = 0; index < totalPages; index++) {
    const rawPage = parsed.pages?.[index];
    const pageNum = index + 1;
    const pageText = rawPage ? normalizeExtractedContent(rawPage.text) : "";

    if (hasMeaningfulText(pageText)) {
      results.push({
        num: pageNum,
        text: pageText,
        source: "text",
      });
    } else {
      ocrPageNumbers.push(pageNum);
    }
  }

  // If some pages need OCR, process them in batches
  if (ocrPageNumbers.length > 0) {
    onProgress?.(`Detected ${ocrPageNumbers.length} empty or scanned pages. Running selective OCR...`);
    const ocrPages = await runOcrOnPages(buffer, ocrPageNumbers, onProgress);
    results.push(...ocrPages);
  }

  // Return all sorted by page number
  return results.sort((a, b) => a.num - b.num);
}

/**
 * Run selective OCR on specified pages with concurrency and timeouts
 */
async function runOcrOnPages(
  buffer: Buffer,
  pageNumbers: number[],
  onProgress?: (step: string) => void
): Promise<PageText[]> {
  const PDFParse = await getPDFParse();
  const parser = new PDFParse({ data: Buffer.from(buffer) });
  let screenshots: Array<{ pageNumber: number; data: Uint8Array }> = [];

  try {
    const screenshotResult = await parser.getScreenshot({
      desiredWidth: 1400,
      imageBuffer: true,
      imageDataUrl: false,
      partial: pageNumbers,
    });
    screenshots = screenshotResult.pages || [];
  } catch (error) {
    console.error("[Reader Agent] Failed to render PDF screenshots for OCR:", error);
    throw new Error("Unable to render document pages for OCR extraction.");
  } finally {
    await parser.destroy();
  }

  const ocrResults: PageText[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < screenshots.length) {
      const currentIndex = nextIndex;
      nextIndex++;

      const screenshot = screenshots[currentIndex];
      if (!screenshot || !screenshot.data || screenshot.data.byteLength === 0) {
        continue;
      }

      const pageNum = screenshot.pageNumber;
      try {
        onProgress?.(`OCRing page ${pageNum}...`);
        const ocrText = await withTimeout(
          transcribePdfPageImage({ image: screenshot.data, pageNumber: pageNum }),
          OCR_PAGE_TIMEOUT_MS
        );
        const normalized = normalizeExtractedContent(ocrText);

        if (normalized.length > 0) {
          ocrResults.push({
            num: pageNum,
            text: normalized,
            source: "ocr",
          });
        }
      } catch (error) {
        console.warn(`[Reader Agent] OCR failed on page ${pageNum}:`, error);
        // Continue and skip unreadable pages safely without crashing the whole pipeline
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(OCR_CONCURRENCY, screenshots.length) },
    () => worker()
  );
  await Promise.all(workers);

  return ocrResults;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`Page OCR timed out after ${timeoutMs}ms.`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
