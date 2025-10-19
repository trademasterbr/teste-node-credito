import { Test, TestingModule } from '@nestjs/testing';
import * as classValidator from 'class-validator';
import { ProductsCsvProcessor } from './products-csv.processor';
import * as csvHelperUtil from '../../common/utils/csv-helper.util';
import { ICsvFileData } from '../dto/fileData.interface';

describe('ProductsCsvProcessor', () => {
  let processor: ProductsCsvProcessor;
  let mockProductService: {
    create: jest.MockedFunction<(product: any) => Promise<any>>;
    findAll: jest.MockedFunction<() => Promise<any[]>>;
  };
  let mockValidate: jest.SpyInstance;
  let mockParseCsvBuffer: jest.SpyInstance;
  let mockValidateCsvColumns: jest.SpyInstance;

  beforeEach(async () => {
    const mockProductServiceValue = {
      create: jest.fn().mockResolvedValue({}),
      findAll: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsCsvProcessor,
        {
          provide: 'IProductService',
          useValue: mockProductServiceValue,
        },
      ],
    }).compile();

    processor = module.get<ProductsCsvProcessor>(ProductsCsvProcessor);
    mockProductService = module.get('IProductService');

    mockValidate = jest.spyOn(classValidator, 'validate');
    mockParseCsvBuffer = jest.spyOn(csvHelperUtil, 'parseCsvBuffer');
    mockValidateCsvColumns = jest.spyOn(csvHelperUtil, 'validateCsvColumns');

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('processProductCsvBatch', () => {
    it('should successfully process valid CSV data', async () => {
      const fileData: ICsvFileData = {
        filename: 'test-products.csv',
        buffer: Buffer.from('test csv content'),
      };
      const csvRows = [
        {
          nome: 'Caneta Azul',
          descricao: 'Esferográfica ponta fina',
          preco: '10.50',
        },
        {
          nome: 'Caderno',
          descricao: 'Caderno universitário 96 folhas',
          preco: '20.00',
        },
      ];

      mockParseCsvBuffer.mockResolvedValue(csvRows);
      mockValidateCsvColumns.mockReturnValue(undefined);
      mockValidate.mockResolvedValue([]);
      mockProductService.create.mockResolvedValue({} as any);

      const result = await processor.processProductCsvBatch(fileData);

      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockParseCsvBuffer).toHaveBeenCalledWith(fileData.buffer, ',');
      expect(mockValidateCsvColumns).toHaveBeenCalledWith(csvRows, [
        'nome',
        'preco',
      ]);
      expect(mockProductService.create).toHaveBeenCalledTimes(2);
    });

    it('should handle invalid CSV data with validation errors', async () => {
      const fileData: ICsvFileData = {
        filename: 'test-products.csv',
        buffer: Buffer.from('test csv content'),
      };
      const csvRows = [
        { nome: '', descricao: 'Produto sem nome', preco: 'abc' },
        {
          nome: 'Borracha',
          descricao: 'Borracha escolar branca',
          preco: '1.50',
        },
      ];

      mockParseCsvBuffer.mockResolvedValue(csvRows);
      mockValidateCsvColumns.mockReturnValue(undefined);

      const validationErrors = [
        {
          property: 'nome',
          constraints: { isNotEmpty: 'Nome do produto é obrigatório' },
        } as any,
        {
          property: 'preco',
          constraints: { isNumber: 'Preço deve ser um número' },
        } as any,
      ];

      mockValidate
        .mockResolvedValueOnce(validationErrors)
        .mockResolvedValueOnce([]);

      mockProductService.create.mockResolvedValue({} as any);

      const result = await processor.processProductCsvBatch(fileData);

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Erro de validação nos dados do CSV');
      expect(result.errors[0].validationErrors).toEqual(validationErrors);
    });

    it('should handle product already exists error', async () => {
      const fileData: ICsvFileData = {
        filename: 'test-products.csv',
        buffer: Buffer.from('test csv content'),
      };
      const csvRows = [
        {
          nome: 'Produto Existente',
          descricao: 'Produto já no banco',
          preco: '8.00',
        },
      ];

      mockParseCsvBuffer.mockResolvedValue(csvRows);
      mockValidateCsvColumns.mockReturnValue(undefined);
      mockValidate.mockResolvedValue([]);
      mockProductService.create.mockRejectedValue(
        new Error('Já existe um produto com o nome: Produto Existente'),
      );

      const result = await processor.processProductCsvBatch(fileData);

      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toContain(
        'Já existe um produto com o nome',
      );
    });

    it('should handle custom separator option', async () => {
      const fileData: ICsvFileData = {
        filename: 'test-products.csv',
        buffer: Buffer.from('test csv content'),
        options: { separator: ';' },
      };
      const csvRows = [
        { nome: 'Estojo', descricao: 'Estojo escolar duplo', preco: '12.50' },
        { nome: 'Tesoura', descricao: 'Tesoura ponta redonda', preco: '8.90' },
      ];

      mockParseCsvBuffer.mockResolvedValue(csvRows);
      mockValidateCsvColumns.mockReturnValue(undefined);
      mockValidate.mockResolvedValue([]);
      mockProductService.create.mockResolvedValue({} as any);

      const result = await processor.processProductCsvBatch(fileData);

      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(mockParseCsvBuffer).toHaveBeenCalledWith(fileData.buffer, ';');
    });

    it('should handle database save errors', async () => {
      const fileData: ICsvFileData = {
        filename: 'test-products.csv',
        buffer: Buffer.from('test csv content'),
      };
      const csvRows = [
        { nome: 'Produto Teste', descricao: 'Descrição teste', preco: '5.00' },
      ];

      mockParseCsvBuffer.mockResolvedValue(csvRows);
      mockValidateCsvColumns.mockReturnValue(undefined);
      mockValidate.mockResolvedValue([]);
      mockProductService.create.mockRejectedValue(new Error('Database error'));

      const result = await processor.processProductCsvBatch(fileData);

      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Database error');
    });
  });
});
