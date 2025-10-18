import { Readable } from 'stream';
import * as csv from 'csv-parser';
import { validate } from 'class-validator';
import { Injectable, Logger } from '@nestjs/common';
import { Product } from './product.entity';
import { Repository } from 'typeorm';
import { RequestUploadProductDto } from './dto/request/upload.product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ImportProductCsvError,
  ImportProductCsvResult,
} from './interfaces/import-csv.interface';
import { getDetailFromError } from '../shared/utils/database-error.util';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(
    productData: Product | RequestUploadProductDto,
  ): Promise<Product> {
    try {
      const product = this.productRepository.create(productData);
      return await this.productRepository.save(product);
    } catch (err) {
      const detail = getDetailFromError(err);

      const error = new Error(detail) as Error & { originalError?: unknown };
      error.originalError = err;
      throw error;
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      return await this.productRepository.find();
    } catch (error) {
      this.logger.error('Erro ao buscar produtos', error);
      throw error;
    }
  }

  async importCsvBuffer(
    buffer: Buffer,
    options?: { separator?: string },
  ): Promise<ImportProductCsvResult> {
    const separator = options?.separator || ',';
    const rows = await this.parseCsvBuffer(buffer, separator);
    const { validProducts, errors: parseErrors } =
      await this.rowsToProducts(rows);

    const persistResult = await this.persistProducts(validProducts);
    return {
      successCount: persistResult.successCount,
      errorCount: parseErrors.length + persistResult.errors.length,
      errors: [...parseErrors, ...persistResult.errors],
    };
  }

  private async parseCsvBuffer(
    buffer: Buffer,
    separator: string,
  ): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      const rows: Record<string, string>[] = [];
      const readable = Readable.from(buffer);

      readable
        .pipe(
          csv({
            separator,
            mapHeaders: ({ header }) => header.trim(),
          }),
        )
        .on('data', (row: Record<string, string>) => {
          if (Object.keys(row).length > 0) {
            rows.push(row);
          }
        })
        .on('end', () => {
          this.logger.debug(
            `CSV processado com sucesso: ${rows.length} linhas`,
          );
          resolve(rows);
        })
        .on('error', (error: Error) => {
          this.logger.error('Erro ao processar arquivo CSV', {
            error: error.message,
            stack: error.stack,
          });
          reject(new Error(`Falha no processamento do CSV: ${error.message}`));
        });
    });
  }

  private async rowsToProducts(rows: Record<string, string>[]): Promise<{
    validProducts: RequestUploadProductDto[];
    errors: ImportProductCsvError[];
  }> {
    const validProducts: RequestUploadProductDto[] = [];
    const errors: ImportProductCsvError[] = [];

    for (const row of rows) {
      const product = new RequestUploadProductDto();

      product.nome = row.nome?.trim() || '';
      product.descricao = row.descricao?.trim() || '';
      const precoStr = row.preco;
      product.preco = precoStr ? Number(precoStr) : NaN;

      const validationErrors = await validate(product);

      if (validationErrors.length > 0) {
        this.logger.warn('Linha inválida encontrada', {
          row,
          validationErrors: validationErrors.map((err) => ({
            property: err.property,
            constraints: err.constraints,
          })),
        });
        errors.push({
          product,
          detail: 'Erro de validação nos dados do CSV',
          validationErrors,
        });
      } else {
        validProducts.push(product);
      }
    }

    return { validProducts, errors };
  }

  private async persistProducts(
    products: RequestUploadProductDto[],
  ): Promise<{ successCount: number; errors: ImportProductCsvError[] }> {
    let successCount = 0;
    const errors: ImportProductCsvError[] = [];

    for (const product of products) {
      const validationErrors = await validate(product);
      if (validationErrors.length > 0) {
        errors.push({
          product,
          detail: 'Erro de validação',
          validationErrors,
        });
        continue;
      }

      try {
        await this.create(product);
        successCount++;
      } catch (err) {
        const detail = err instanceof Error ? err.message : 'Erro desconhecido';
        errors.push({ product, detail });
      }
    }
    return { successCount, errors };
  }
}
