import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { ProductBatchResponseDto } from './dto/product-batch.response.dto';
import { ProductsCsvProcessor } from './processor/products-csv.processor';
import {
  EmptyFileException,
  InvalidFileTypeException,
} from '../shared/exceptions';

@Controller('produtos')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly csvProcessor: ProductsCsvProcessor,
  ) {}

  @Get()
  async findAll(): Promise<Product[]> {
    return await this.productsService.findAll();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProductBatchResponseDto> {
    if (!file) {
      throw new EmptyFileException();
    }

    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new InvalidFileTypeException(['CSV'], file.originalname);
    }

    try {
      const result = await this.csvProcessor.importCsvBuffer(
        file.buffer,
        this.productsService.createProductsBatch.bind(this.productsService),
      );

      return {
        message: 'Processamento concluído',
        successCount: result.successCount,
        errorCount: result.errorCount,
        errors: result.errors.map((error) => ({
          product: error.product,
          error: error.error,
          validationErrors: error.validationErrors?.map((validationError) => ({
            property: validationError.property,
            constraints: validationError.constraints,
          })),
        })),
      };
    } catch (error) {
      this.logger.error(`Erro ao processar arquivo CSV ${file.originalname}:`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        filename: file.originalname,
      });
      // Re-throw para que o filtro global trate adequadamente
      throw error;
    }
  }
}
