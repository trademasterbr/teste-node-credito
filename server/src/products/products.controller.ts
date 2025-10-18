import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Get,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { ResponseUploadProductDto } from './dto/response/upload.product.dto';

@Controller('produtos')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(): Promise<Product[]> {
    return await this.productsService.findAll();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ResponseUploadProductDto> {
    if (!file) {
      throw new HttpException('Arquivo não enviado', HttpStatus.BAD_REQUEST);
    }
    try {
      const result = await this.productsService.importCsvBuffer(file.buffer);
      return {
        message: 'Processamento concluído',
        successCount: result.successCount,
        errorCount: result.errorCount,
        errors: result.errors.map((error) => ({
          product: error.product,
          detail: error.detail,
          validationErrors: error.validationErrors?.map((err) => ({
            property: err.property,
            constraints: err.constraints,
          })),
        })),
      };
    } catch (error) {
      this.logger.error('Erro ao processar arquivo CSV: ', error);
      throw new HttpException(
        'Erro ao processar arquivo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
