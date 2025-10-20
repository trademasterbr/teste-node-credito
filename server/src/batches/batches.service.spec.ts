import { Test, TestingModule } from '@nestjs/testing';
import { BatchService } from './batches.service';
import { ProductsCsvProcessor } from './processors/products-csv.processor';
import { ICsvFileData } from './interfaces/fileData.interface';

describe('BatchService', () => {
  let service: BatchService;
  let csvProcessor: ProductsCsvProcessor;
  let processProductCsvBatchSpy: jest.SpyInstance;

  beforeEach(async () => {
    const mockProcessor = {
      processProductCsvBatch: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        {
          provide: ProductsCsvProcessor,
          useValue: mockProcessor,
        },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
    csvProcessor = module.get<ProductsCsvProcessor>(ProductsCsvProcessor);

    processProductCsvBatchSpy = jest.spyOn(
      csvProcessor,
      'processProductCsvBatch',
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processProductCsvFile', () => {
    it('should process CSV file successfully', async () => {
      const fileData: ICsvFileData = {
        filename: 'test-products.csv',
        buffer: Buffer.from('nome,preco\nCaneta,10.50\nCaderno,25.90'),
      };

      const mockResult = {
        successCount: 2,
        errorCount: 0,
        errors: [],
      };

      processProductCsvBatchSpy.mockResolvedValue(mockResult);

      await service.processProductCsvFile(fileData);

      expect(processProductCsvBatchSpy).toHaveBeenCalledWith(fileData);
      expect(processProductCsvBatchSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle CSV processing with validation errors', async () => {
      const fileData: ICsvFileData = {
        filename: 'invalid-products.csv',
        buffer: Buffer.from('nome,preco\n,10.50\nCaderno,invalid'),
      };

      const mockResult = {
        successCount: 0,
        errorCount: 2,
        errors: [
          {
            item: { nome: '', preco: 10.5 },
            error: 'Nome é obrigatório',
          },
          {
            item: { nome: 'Caderno', preco: NaN },
            error: 'Preço deve ser um número válido',
          },
        ],
      };

      processProductCsvBatchSpy.mockResolvedValue(mockResult);

      await service.processProductCsvFile(fileData);

      expect(processProductCsvBatchSpy).toHaveBeenCalledWith(fileData);
    });

    it('should handle empty CSV file', async () => {
      const fileData: ICsvFileData = {
        filename: 'empty.csv',
        buffer: Buffer.from('nome,preco\n'),
      };

      const mockResult = {
        successCount: 0,
        errorCount: 0,
        errors: [],
      };

      processProductCsvBatchSpy.mockResolvedValue(mockResult);

      await service.processProductCsvFile(fileData);

      expect(processProductCsvBatchSpy).toHaveBeenCalledWith(fileData);
    });

    it('should handle CSV file with custom options', async () => {
      const fileData: ICsvFileData = {
        filename: 'custom-separator.csv',
        buffer: Buffer.from('nome;preco\nCaneta;10.50'),
        options: {
          separator: ';',
        },
      };

      const mockResult = {
        successCount: 1,
        errorCount: 0,
        errors: [],
      };

      processProductCsvBatchSpy.mockResolvedValue(mockResult);

      await service.processProductCsvFile(fileData);

      expect(processProductCsvBatchSpy).toHaveBeenCalledWith(fileData);
    });

    it('should propagate errors from CSV processor', async () => {
      const fileData: ICsvFileData = {
        filename: 'error-file.csv',
        buffer: Buffer.from('invalid,csv,format'),
      };

      const processingError = new Error('Invalid CSV format');
      processProductCsvBatchSpy.mockRejectedValue(processingError);

      await expect(service.processProductCsvFile(fileData)).rejects.toThrow(
        'Invalid CSV format',
      );

      expect(processProductCsvBatchSpy).toHaveBeenCalledWith(fileData);
    });

    it('should handle large CSV files', async () => {
      const largeCsvContent = 'nome,preco\n' + 'Produto,15.50\n'.repeat(1000);
      const fileData: ICsvFileData = {
        filename: 'large-file.csv',
        buffer: Buffer.from(largeCsvContent),
      };

      const mockResult = {
        successCount: 1000,
        errorCount: 0,
        errors: [],
      };

      processProductCsvBatchSpy.mockResolvedValue(mockResult);

      await service.processProductCsvFile(fileData);

      expect(processProductCsvBatchSpy).toHaveBeenCalledWith(fileData);
      expect(fileData.buffer.length).toBeGreaterThan(10000);
    });

    it('should handle files with special characters', async () => {
      const fileData: ICsvFileData = {
        filename: 'produtos-especiais.csv',
        buffer: Buffer.from('nome,preco\nCaneta Azul ção,10.50'),
      };

      const mockResult = {
        successCount: 1,
        errorCount: 0,
        errors: [],
      };

      processProductCsvBatchSpy.mockResolvedValue(mockResult);

      await service.processProductCsvFile(fileData);

      expect(processProductCsvBatchSpy).toHaveBeenCalledWith(fileData);
    });

    it('should handle processor throwing generic error', async () => {
      const fileData: ICsvFileData = {
        filename: 'test.csv',
        buffer: Buffer.from('nome,preco\nTeste,10.50'),
      };

      processProductCsvBatchSpy.mockRejectedValue('Unknown error');

      await expect(service.processProductCsvFile(fileData)).rejects.toBe(
        'Unknown error',
      );
    });
  });
});
