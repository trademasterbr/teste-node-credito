import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchService } from './batch.service';
import { RabbitmqModule } from '../infra/rabbitmq/rabbitmq.module';
import { Product } from '../product/products.entity';
import { ProductsCsvProcessor } from './processor/products-csv.processor';
import { BatchConsumer } from './consumer/batch.consumer';
import { ProductsModule } from '../product/products.module';

@Module({
  imports: [
    RabbitmqModule,
    TypeOrmModule.forFeature([Product]),
    ProductsModule,
  ],
  controllers: [BatchConsumer],
  providers: [BatchService, ProductsCsvProcessor],
})
export class BatchModule {}
