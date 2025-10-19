import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_QUEUES } from './rabbitmq.constants';

@Injectable()
export class RabbitmqService {
  constructor(
    @Inject(RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE)
    private client: ClientProxy,
  ) {}

  emitProductCsvBatch(data: any) {
    return this.client.emit(`${RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE}`, data);
  }
}
