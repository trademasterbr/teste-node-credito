import * as crypto from 'crypto';
Object.defineProperty(globalThis, 'crypto', {
  value: crypto,
  configurable: true,
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { rabbitmqConfigs } from './infra/rabbitmq/rabbitmq.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  Object.values(rabbitmqConfigs).forEach((config) => {
    app.connectMicroservice({
      transport: Transport.RMQ,
      options: config,
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
