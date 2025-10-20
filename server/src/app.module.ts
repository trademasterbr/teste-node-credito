import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { ProductsModule } from './products/products.module';
import { BatchModule } from './batches/batches.module';
import { RabbitmqModule } from './infra/rabbitmq/rabbitmq.module';
import { Product } from './products/products.entity';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        username: process.env.POSTGRES_USER || 'user',
        password: process.env.POSTGRES_PASSWORD || 'password',
        database: process.env.POSTGRES_DB || 'batch_processing',
        entities: [Product],
        synchronize:
          process.env.NODE_ENV !== 'production' &&
          process.env.TYPEORM_SYNCHRONIZE === 'true',
      }),
    }),
    ProductsModule,
    BatchModule,
    RabbitmqModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
