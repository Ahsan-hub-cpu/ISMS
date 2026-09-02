import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { FileStorage, StoredFile } from "../application/ports/file-storage";

/**
 * Evidence is written outside the public folder so files can only be reached
 * through the authenticated download route. The bundler is told to ignore these
 * paths because they are resolved at runtime and must not drag the project into
 * the server output.
 */
const storageDirectory = path.resolve(
  /* turbopackIgnore: true */
  process.env.EVIDENCE_STORAGE_DIR ?? path.join(process.cwd(), "storage", "evidence"),
);

const resolveInsideStorage = (storedFileName: string) => {
  const resolved = path.resolve(storageDirectory, storedFileName);
  if (!resolved.startsWith(storageDirectory + path.sep)) {
    throw new Error("Resolved evidence path escapes the storage directory.");
  }
  return resolved;
};

export const localFileStorage: FileStorage = {
  async save(file) {
    await mkdir(storageDirectory, { recursive: true });

    // The stored name is generated rather than taken from the upload, so a
    // crafted file name cannot influence where the file lands.
    const storedFileName = `${randomUUID()}${path.extname(file.name).slice(0, 12)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(resolveInsideStorage(storedFileName), buffer);

    return {
      storedFileName,
      fileName: path.basename(file.name),
      mimeType: file.type,
      fileSize: buffer.byteLength,
    } satisfies StoredFile;
  },

  read: (storedFileName) =>
    readFile(/* turbopackIgnore: true */ resolveInsideStorage(storedFileName)),

  async remove(storedFileName) {
    await rm(resolveInsideStorage(storedFileName), { force: true });
  },
};
