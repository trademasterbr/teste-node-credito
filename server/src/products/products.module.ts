import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './products.entity';
import { ProductsPublisherProcessor } from './publishers/products.publisher';
import { RabbitmqModule } from '../infra/rabbitmq/rabbitmq.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsCsvProcessor } from '../batches/processors/products-csv.processor';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), RabbitmqModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    ProductsCsvProcessor,
    ProductsPublisherProcessor,
    {
      provide: 'IProductService',
      useClass: ProductsService,
    },
  ],
  exports: ['IProductService'],
})
export class ProductsModule {}
