import path from "node:path";
import { pathToFileURL } from "node:url";

type PDFParseConstructor = typeof import("pdf-parse")["PDFParse"];

let pdfParsePromise: Promise<PDFParseConstructor> | null = null;

export function getPDFParse(): Promise<PDFParseConstructor> {
  if (!pdfParsePromise) {
    pdfParsePromise = import("pdf-parse")
      .then(({ PDFParse }) => {
        try {
          const pdfWorkerPath = path.join(
            process.cwd(),
            "node_modules",
            "pdf-parse",
            "dist",
            "worker",
            "pdf.worker.mjs"
          );
          PDFParse.setWorker(pathToFileURL(pdfWorkerPath).href);
        } catch (error) {
          console.warn("[Mentora] PDF worker setup failed; using pdf-parse default worker.", error);
        }

        return PDFParse;
      })
      .catch((error) => {
        pdfParsePromise = null;
        throw error;
      });
  }

  return pdfParsePromise;
}
