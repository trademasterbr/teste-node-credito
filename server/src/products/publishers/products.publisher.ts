import { Injectable } from '@nestjs/common';
import { RabbitmqService } from '../../infra/rabbitmq/rabbitmq.service';

@Injectable()
export class ProductsPublisherProcessor {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  publishProductCsvBatch(fileData: { filename: string; buffer: Buffer }): void {
    try {
      this.rabbitmqService.emitProductCsvBatch(fileData);
    } catch (error) {
      throw new Error(
        `Failed to publish file to queue: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
