import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { IProductService } from '../common/interfaces/product-service.interface';
import { Product } from './products.entity';
import { Repository } from 'typeorm';
import { ProductRequestDto } from './dtos/product.request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { handleDatabaseError } from '../common/utils/database-helpers.util';
import { CustomConflictException } from '../common/exceptions';
import { ProductsPublisherProcessor } from './publishers/products.publisher';

@Injectable()
export class ProductsService implements IProductService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly publisherProcessor: ProductsPublisherProcessor,
  ) {}

  async findAll(): Promise<Product[]> {
    try {
      return await this.productRepository.find();
    } catch (error) {
      this.logger.error('Erro ao buscar produtos', error);
      throw error;
    }
  }
  async create(productData: ProductRequestDto): Promise<Product> {
    try {
      const productAlreadySaved: boolean = await this.productRepository.exists({
        where: { nome: productData.nome },
      });
      if (productAlreadySaved) {
        throw new CustomConflictException(
          `Já existe um produto com o nome: ${productData.nome}`,
        );
      }
      const product = this.productRepository.create(productData);
      return await this.productRepository.save(product);
    } catch (error) {
      if (error instanceof CustomConflictException) {
        throw error;
      }

      this.logger.error('Erro ao criar produto', error);
      const handledError = handleDatabaseError(error);
      throw new InternalServerErrorException(handledError);
    }
  }

  sendProductsCsvToBatch(fileData: { filename: string; buffer: Buffer }): void {
    try {
      this.publisherProcessor.publishProductCsvBatch(fileData);
      this.logger.log(
        `Arquivo ${fileData.filename} enviado para processamento em lote`,
      );
    } catch (error) {
      this.logger.error('Erro ao enviar arquivo para fila', error);
      throw new InternalServerErrorException(
        'Falha ao enviar arquivo para processamento',
      );
    }
  }
}
