import { validate } from 'class-validator';
import { Injectable, Logger } from '@nestjs/common';
import { ProductRequestDto } from '../dto/product.request.dto';
import {
  ProductBatchError,
  ProductBatchResult,
} from '../interfaces/product-batch.interface';
import {
  parseCsvBuffer,
  validateCsvColumns,
} from '../../shared/utils/csv-helper.util';

@Injectable()
export class ProductsCsvProcessor {
  private readonly logger = new Logger(ProductsCsvProcessor.name);

  async importCsvBuffer(
    buffer: Buffer,
    persistProductsBatch: (
      products: ProductRequestDto[],
    ) => Promise<{ successCount: number; errors: ProductBatchError[] }>,
    options?: { separator?: string },
  ): Promise<ProductBatchResult> {
    const separator = options?.separator || ',';
    const rows = await parseCsvBuffer(buffer, separator);

    validateCsvColumns(rows, ['nome', 'preco']);

    const { validProducts, errors: parseErrors } =
      await this.rowsToProducts(rows);

    const persistResult = await persistProductsBatch(validProducts);
    return {
      successCount: persistResult.successCount,
      errorCount: parseErrors.length + persistResult.errors.length,
      errors: [...parseErrors, ...persistResult.errors],
    };
  }

  private async rowsToProducts(rows: Record<string, string>[]): Promise<{
    validProducts: ProductRequestDto[];
    errors: ProductBatchError[];
  }> {
    const validProducts: ProductRequestDto[] = [];
    const errors: ProductBatchError[] = [];

    for (const row of rows) {
      const product = new ProductRequestDto();

      product.nome = row.nome?.trim() || '';
      product.descricao = row.descricao?.trim() || '';
      const precoStr = row.preco;
      product.preco = precoStr ? Number(precoStr) : NaN;

      const validationErrors = await validate(product);

      if (validationErrors.length > 0) {
        this.logger.warn('Linha inválida encontrada', {
          row,
          validationErrors: validationErrors.map((validationError) => ({
            property: validationError.property,
            constraints: validationError.constraints,
          })),
        });
        errors.push({
          product,
          error: 'Erro de validação nos dados do CSV',
          validationErrors,
        });
      } else {
        validProducts.push(product);
      }
    }

    return { validProducts, errors };
  }
}
