import { ProductBatchError } from 'src/products/interfaces/product-batch.interface';

export class ProductBatchResponseDto {
  message: string;
  successCount: number;
  errorCount: number;
  errors: ProductBatchError[];
}
