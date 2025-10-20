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
import { Product } from './products.entity';
import {
  EmptyFileException,
  InvalidFileTypeException,
} from '../common/exceptions';

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
  uploadFile(@UploadedFile() file: Express.Multer.File): {
    message: string;
    filename: string;
  } {
    if (!file) {
      throw new EmptyFileException();
    }

    if (!file.originalname.toLowerCase().endsWith('.csv')) {
      throw new InvalidFileTypeException(['CSV'], file.originalname);
    }

    try {
      this.productsService.sendProductsCsvToBatch({
        filename: file.originalname,
        buffer: file.buffer,
      });

      this.logger.log(
        `Arquivo ${file.originalname} enviado para processamento em lote`,
      );

      return {
        message: 'Arquivo recebido com sucesso e enviado para processamento',
        filename: file.originalname,
      };
    } catch (error) {
      this.logger.error(`Erro ao processar arquivo CSV ${file.originalname}:`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        filename: file.originalname,
      });
      throw error;
    }
  }
}
