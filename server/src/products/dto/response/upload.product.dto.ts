import { ImportProductCsvError } from 'src/products/interfaces/import-csv.interface';

export class ResponseUploadProductDto {
  message: string;
  successCount: number;
  errorCount: number;
  errors: ImportProductCsvError[];
}
