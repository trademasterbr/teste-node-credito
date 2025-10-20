import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatchService } from './batches.service';
import { RabbitmqModule } from '../infra/rabbitmq/rabbitmq.module';
import { Product } from '../products/products.entity';
import { ProductsCsvProcessor } from './processors/products-csv.processor';
import { BatchConsumer } from './consumers/batch.consumer';
import { ProductsModule } from '../products/products.module';

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
