import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitmqService } from './rabbitmq.service';
import { RABBITMQ_QUEUES } from './rabbitmq.constants';
import { rabbitmqConfigs } from './rabbitmq.config';

import { ClientProviderOptions } from '@nestjs/microservices';

const rabbitClients: ClientProviderOptions[] = Object.keys(rabbitmqConfigs).map(
  (key) => ({
    name: RABBITMQ_QUEUES[key as keyof typeof RABBITMQ_QUEUES],
    transport: Transport.RMQ as const,
    options: rabbitmqConfigs[key as keyof typeof rabbitmqConfigs],
  }),
);

@Module({
  imports: [ClientsModule.register(rabbitClients)],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
