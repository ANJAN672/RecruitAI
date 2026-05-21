import mammoth from "mammoth";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc (best-effort via mammoth)
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  const text = result.text?.trim();
  if (!text) {
    throw new FileParseError("Could not extract text from PDF. The file may be image-based or empty.");
  }
  return text;
}

async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value?.trim();
  if (!text) {
    throw new FileParseError("Could not extract text from document. The file may be empty.");
  }
  return text;
}
