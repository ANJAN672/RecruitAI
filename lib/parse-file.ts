import mammoth from "mammoth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

export class FileParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileParseError";
  }
}

export async function parseUploadedFile(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new FileParseError(
      "Unsupported file type. Please upload a PDF or DOCX file."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new FileParseError("File is too large. Maximum size is 10 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf") {
    return parsePdf(buffer);
  }

  return parseDocx(buffer);
}

async function parsePdf(buffer: Buffer): Promise<string> {
  // pdf-parse v2 exposes a PDFParse class; import dynamically so pdfjs-dist
  // is only loaded when a PDF is actually uploaded.
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const text = result.text?.trim();
    if (!text) {
      throw new FileParseError(
        "Could not extract text from PDF. The file may be image-based or empty."
      );
    }
    return text;
  } finally {
    await parser.destroy();
  }
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim();
  if (!text) {
    throw new FileParseError(
      "Could not extract text from document. The file may be empty."
    );
  }
  return text;
}
