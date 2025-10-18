import { ValidationError } from 'class-validator';
import { ProductRequestDto } from 'src/products/dto/product.request.dto';

export interface ProductBatchError {
  product: ProductRequestDto;
  error?: string;
  validationErrors?: ValidationError[];
}

export interface ProductBatchResult {
  successCount: number;
  errorCount: number;
  errors: ProductBatchError[];
}
