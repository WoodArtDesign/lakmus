/* ============================================================
   Извлечение текста из файлов: TXT · DOCX · PDF
   Ограничение по весу файла: 5 МБ
   ============================================================ */

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const ACCEPT_ATTR =
  ".txt,.md,.markdown,.text,.csv,.log,.docx,.pdf," +
  "text/plain,application/pdf," +
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export type FileKind = "txt" | "docx" | "pdf" | "doc" | "unknown";

const EXT_RE = /\.(txt|md|markdown|text|csv|log|docx|doc|pdf)$/i;

export function detectKind(f: File): FileKind {
  const m = f.name.match(EXT_RE);
  if (m) {
    const e = m[1].toLowerCase();
    if (e === "docx") return "docx";
    if (e === "doc") return "doc";
    if (e === "pdf") return "pdf";
    return "txt";
  }
  if (f.type === "application/pdf") return "pdf";
  if (
    f.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "docx";
  if (f.type.startsWith("text/")) return "txt";
  return "unknown";
}

export const kindLabel: Record<FileKind, string> = {
  txt: "текст",
  docx: "Word",
  pdf: "PDF",
  doc: "Word (устаревший .doc)",
  unknown: "файл",
};

const readAsText = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("read-failed"));
    r.readAsText(f);
  });

async function extractDocx(f: File): Promise<string> {
  const { extractRawText } = await import("mammoth");
  const arrayBuffer = await f.arrayBuffer();
  const res = await extractRawText({ arrayBuffer });
  return res.value ?? "";
}

async function extractPdf(
  f: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const data = new Uint8Array(await f.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      onProgress?.(`Чтение PDF — страница ${i} из ${doc.numPages}`);
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      const line = tc.items
        .map((it) => ("str" in it ? it.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (line) parts.push(line);
      // отдаём кадр интерфейсу на длинных документах
      if (i % 10 === 0) await new Promise((r) => setTimeout(r, 0));
    }
  } finally {
    await doc.cleanup().catch(() => undefined);
  }
  return parts.join("\n\n");
}

/**
 * Извлекает «сырой» текст из файла.
 * Бросает исключение, если формат не поддержан или текст не найден.
 */
export async function extractTextFromFile(
  f: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  const kind = detectKind(f);
  switch (kind) {
    case "txt":
      onProgress?.("Чтение текстового файла…");
      return await readAsText(f);
    case "docx":
      onProgress?.("Распаковка документа Word…");
      return await extractDocx(f);
    case "pdf":
      return await extractPdf(f, onProgress);
    case "doc":
      throw new Error(
        "Формат .doc (Word 97–2003) не поддерживается — сохраните документ как .docx"
      );
    default:
      throw new Error("Формат файла не поддерживается. Загрузите TXT, DOCX или PDF");
  }
}

export const mbSize = (bytes: number) =>
  (bytes / 1048576).toLocaleString("ru-RU", { maximumFractionDigits: 1 });
