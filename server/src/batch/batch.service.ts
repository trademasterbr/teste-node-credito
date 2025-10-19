import { Injectable, Logger } from '@nestjs/common';
import { ProductsCsvProcessor } from './processor/products-csv.processor';
import { ICsvFileData } from './dto/fileData.interface';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(private readonly csvProcessor: ProductsCsvProcessor) {}

  async processProductCsvFile(fileData: ICsvFileData): Promise<void> {
    try {
      this.logger.log(`Processando arquivo CSV: ${fileData.filename}`);

      await this.csvProcessor.processProductCsvBatch(fileData);
    } catch (error) {
      this.logger.error(`Erro ao processar arquivo ${fileData.filename}:`, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        filename: fileData.filename,
      });
      throw error;
    }
  }
}
