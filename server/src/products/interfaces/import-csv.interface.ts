import { ValidationError } from 'class-validator';
import { RequestUploadProductDto } from 'src/products/dto/request/upload.product.dto';

export interface ImportProductCsvError {
  product: RequestUploadProductDto;
  detail?: string;
  validationErrors?: ValidationError[];
}

export interface ImportProductCsvResult {
  successCount: number;
  errorCount: number;
  errors: ImportProductCsvError[];
}
