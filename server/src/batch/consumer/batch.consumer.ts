import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { BatchService } from '../batch.service';
import { RABBITMQ_QUEUES } from '../../infra/rabbitmq/rabbitmq.constants';
import { ICsvFileData } from '../dto/fileData.interface';

@Controller()
export class BatchConsumer {
  constructor(private readonly batchService: BatchService) {}

  @EventPattern(RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE)
  async handleFileBatch(
    @Payload()
    fileData: ICsvFileData,
  ): Promise<void> {
    await this.batchService.processProductCsvFile(fileData);
  }
}
