export interface ICsvFileData {
  filename: string;
  buffer: Buffer;
  options?: { separator?: string };
}
