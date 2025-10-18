import {
  Injectable,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Product } from './product.entity';
import { Repository } from 'typeorm';
import { ProductRequestDto } from './dto/product.request.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { handleDatabaseError } from '../shared/utils/database-helper.util';
import { ProductBatchError } from './interfaces/product-batch.interface';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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
        throw new ConflictException(
          `Ja existe um produto com o nome ${productData.nome}`,
        );
      }

      const product = this.productRepository.create(productData);
      return await this.productRepository.save(product);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }

      this.logger.error('Erro ao criar produto', error);
      const handledError = handleDatabaseError(error);
      throw new InternalServerErrorException(handledError);
    }
  }

  async createProductsBatch(
    products: ProductRequestDto[],
  ): Promise<{ successCount: number; errors: ProductBatchError[] }> {
    const errors: ProductBatchError[] = [];
    let successCount = 0;

    for (const product of products) {
      try {
        await this.create(product);
        successCount++;
      } catch (error) {
        this.logger.warn('Falha ao processar produto no lote', {
          product: product.nome,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });

        errors.push({
          product,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
        });
      }
    }

    this.logger.log(
      `Processamento em lote concluído: ${successCount} sucessos, ${errors.length} erros`,
    );

    return { successCount, errors };
  }
}
