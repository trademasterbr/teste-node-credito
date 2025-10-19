import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { RabbitmqService } from './rabbitmq.service';
import { RABBITMQ_QUEUES } from './rabbitmq.constants';

describe('RabbitmqService', () => {
  let service: RabbitmqService;
  let clientProxy: ClientProxy;
  let emitSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockClientProxy = {
      emit: jest.fn(),
      send: jest.fn(),
      connect: jest.fn(),
      close: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RabbitmqService,
        {
          provide: RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<RabbitmqService>(RabbitmqService);
    clientProxy = module.get<ClientProxy>(
      RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
    );

    emitSpy = jest.spyOn(clientProxy, 'emit');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('emitProductCsvBatch', () => {
    it('should emit message to the correct queue', () => {
      const testData = {
        filename: 'test.csv',
        buffer: Buffer.from('nome,preco\nProduto,10.50'),
      };

      service.emitProductCsvBatch(testData);

      expect(emitSpy).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
        testData,
      );
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle different data types', () => {
      const testData = {
        filename: 'products.csv',
        buffer: Buffer.from('name,price\nItem1,15.99\nItem2,25.50'),
        metadata: {
          uploadedBy: 'user123',
          timestamp: new Date().toISOString(),
        },
      };

      service.emitProductCsvBatch(testData);

      expect(emitSpy).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
        testData,
      );
    });

    it('should handle empty data', () => {
      const testData = {};

      service.emitProductCsvBatch(testData);

      expect(emitSpy).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
        testData,
      );
    });

    it('should handle null data', () => {
      const testData = null;

      service.emitProductCsvBatch(testData);

      expect(emitSpy).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
        testData,
      );
    });

    it('should handle undefined data', () => {
      const testData = undefined;

      service.emitProductCsvBatch(testData);

      expect(emitSpy).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
        testData,
      );
    });

    it('should call client.emit and return the result', () => {
      const testData = { filename: 'test.csv', buffer: Buffer.from('data') };

      service.emitProductCsvBatch(testData);

      expect(emitSpy).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
        testData,
      );
    });

    it('should handle large buffer data', () => {
      const largeContent = 'nome,preco\n' + 'Produto,10.50\n'.repeat(10000);
      const testData = {
        filename: 'large-file.csv',
        buffer: Buffer.from(largeContent),
      };

      service.emitProductCsvBatch(testData);

      expect(emitSpy).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
        testData,
      );
      expect(testData.buffer.length).toBeGreaterThan(100000);
    });

    it('should handle special characters in filename', () => {
      const testData = {
        filename: 'produtos-açúde-çañão.csv',
        buffer: Buffer.from('nome,preço\nProduto Açúde,10.50'),
      };

      service.emitProductCsvBatch(testData);

      expect(emitSpy).toHaveBeenCalledWith(
        RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
        testData,
      );
    });
  });
});
