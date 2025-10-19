import { validate } from 'class-validator';
import { Injectable, Logger } from '@nestjs/common';
import { IBatchError, IBatchResult } from '../dto/batch.interface';
import { ProductRequestDto } from '../../product/dto/products.request.dto';
import {
  parseCsvBuffer,
  validateCsvColumns,
} from '../../common/utils/csv-helper.util';
import { IProductService } from '../../common/interfaces/product-service.interface';
import { Inject } from '@nestjs/common';
import { ICsvFileData } from '../dto/fileData.interface';

@Injectable()
export class ProductsCsvProcessor {
  private readonly logger = new Logger(ProductsCsvProcessor.name);

  constructor(
    @Inject('IProductService')
    private readonly productService: IProductService,
  ) {}

  async processProductCsvBatch(
    fileData: ICsvFileData,
  ): Promise<IBatchResult<ProductRequestDto>> {
    const separator = fileData.options?.separator || ',';
    const rows = await parseCsvBuffer(fileData.buffer, separator);

    validateCsvColumns(rows, ['nome', 'preco']);

    const { validProducts, errors: parseErrors } =
      await this.rowsToProducts(rows);

    const persistResult = await this.persistProductsBatch(validProducts);
    const result = {
      successCount: persistResult.successCount,
      errorCount: parseErrors.length + persistResult.errors.length,
      errors: [...parseErrors, ...persistResult.errors],
    };

    this.logger.log({
      message: 'Processamento do arquivo CSV concluído',
      filename: fileData.filename,
      successCount: result.successCount,
      errorCount: result.errorCount,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  private async rowsToProducts(rows: Record<string, string>[]): Promise<{
    validProducts: ProductRequestDto[];
    errors: IBatchError<ProductRequestDto>[];
  }> {
    const validProducts: ProductRequestDto[] = [];
    const errors: IBatchError<ProductRequestDto>[] = [];

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
          item: product,
          error: 'Erro de validação nos dados do CSV',
          validationErrors,
        });
      } else {
        validProducts.push(product);
      }
    }
    return { validProducts, errors };
  }

  async persistProductsBatch(products: ProductRequestDto[]): Promise<{
    successCount: number;
    errors: IBatchError<ProductRequestDto>[];
  }> {
    const errors: IBatchError<ProductRequestDto>[] = [];
    let successCount = 0;

    for (const product of products) {
      try {
        await this.productService.create(product);
        successCount++;
      } catch (error) {
        this.logger.warn('Falha ao processar produto no lote', {
          item: product.nome,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
        errors.push({
          item: product,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }
    return { successCount, errors };
  }
}
