export interface StoredFile {
  readonly storedFileName: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly fileSize: number;
}

/**
 * Keeps the use cases free of any knowledge about where evidence files live,
 * so local disk can be swapped for object storage without touching them.
 */
export interface FileStorage {
  save(file: File): Promise<StoredFile>;
  read(storedFileName: string): Promise<Buffer>;
  remove(storedFileName: string): Promise<void>;
}
