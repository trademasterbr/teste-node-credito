import { Test, TestingModule } from '@nestjs/testing';
import * as classValidator from 'class-validator';
import { ProductsCsvProcessor } from './products-csv.processor';
import { ProductBatchError } from '../interfaces/product-batch.interface';
import { ProductRequestDto } from '../dto/product.request.dto';

describe('ProductsCsvProcessor', () => {
  let processor: ProductsCsvProcessor;
  let mockPersistProductsBatch: jest.MockedFunction<
    (
      products: ProductRequestDto[],
    ) => Promise<{ successCount: number; errors: ProductBatchError[] }>
  >;
  let mockValidate: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsCsvProcessor],
    }).compile();

    processor = module.get<ProductsCsvProcessor>(ProductsCsvProcessor);

    mockPersistProductsBatch = jest.fn();
    mockValidate = jest.spyOn(classValidator, 'validate');
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('importCsvBuffer', () => {
    it('should successfully import valid CSV data', async () => {
      const csvContent = [
        'nome,descricao,preco',
        'Caneta Azul,Esferográfica ponta fina,10.50',
        'Caderno,Caderno universitário 96 folhas,20.00',
      ].join('\n');

      const buffer = Buffer.from(csvContent);

      mockValidate.mockResolvedValue([]);
      mockPersistProductsBatch.mockResolvedValue({
        successCount: 2,
        errors: [],
      });

      const result = await processor.importCsvBuffer(
        buffer,
        mockPersistProductsBatch,
      );

      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockPersistProductsBatch).toHaveBeenCalledWith([
        {
          nome: 'Caneta Azul',
          descricao: 'Esferográfica ponta fina',
          preco: 10.5,
        },
        {
          nome: 'Caderno',
          descricao: 'Caderno universitário 96 folhas',
          preco: 20.0,
        },
      ]);
    });

    it('should handle invalid CSV data with validation errors', async () => {
      const csvContent = [
        'nome,descricao,preco',
        ',Produto sem nome,abc',
        'Borracha,Borracha escolar branca,1.50',
      ].join('\n');

      const buffer = Buffer.from(csvContent);

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

      mockPersistProductsBatch.mockResolvedValue({
        successCount: 1,
        errors: [],
      });

      const result = await processor.importCsvBuffer(
        buffer,
        mockPersistProductsBatch,
      );

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Erro de validação nos dados do CSV');
      expect(result.errors[0].validationErrors).toEqual(validationErrors);
      expect(mockPersistProductsBatch).toHaveBeenCalledWith([
        { nome: 'Borracha', descricao: 'Borracha escolar branca', preco: 1.5 },
      ]);
    });

    it('should handle empty CSV buffer', async () => {
      const csvContent = ['nome,descricao,preco', ''].join('\n');

      const buffer = Buffer.from(csvContent);

      await expect(
        processor.importCsvBuffer(buffer, mockPersistProductsBatch),
      ).rejects.toThrow('Arquivo CSV está vazio ou não possui dados válidos');
    });

    it('should handle malformed CSV gracefully', async () => {
      const csvContent = 'conteúdo malformado sem estrutura CSV válida';
      const buffer = Buffer.from(csvContent);

      await expect(
        processor.importCsvBuffer(buffer, mockPersistProductsBatch),
      ).rejects.toThrow('Arquivo CSV está vazio ou não possui dados válidos');
    });

    it('should validate missing required columns', async () => {
      const csvContent = ['nome,descricao', 'Régua,Régua escolar 30cm'].join(
        '\n',
      );

      const buffer = Buffer.from(csvContent);

      await expect(
        processor.importCsvBuffer(buffer, mockPersistProductsBatch),
      ).rejects.toThrow(
        'Colunas obrigatórias não encontradas: preco. Colunas esperadas: nome, preco',
      );
    });

    it('should validate required fields correctly', async () => {
      const csvContent = [
        'nome,descricao,preco',
        ',Produto sem nome,10.50',
        'Lápis,,abc',
        'Apontador,Apontador com depósito,3.00',
      ].join('\n');

      const buffer = Buffer.from(csvContent);

      const nameError = [
        {
          property: 'nome',
          constraints: { isNotEmpty: 'Nome do produto é obrigatório' },
        } as any,
      ];

      const priceError = [
        {
          property: 'preco',
          constraints: { isNumber: 'Preço deve ser um número' },
        } as any,
      ];

      mockValidate
        .mockResolvedValueOnce(nameError)
        .mockResolvedValueOnce(priceError)
        .mockResolvedValueOnce([]);

      mockPersistProductsBatch.mockResolvedValue({
        successCount: 1,
        errors: [],
      });

      const result = await processor.importCsvBuffer(
        buffer,
        mockPersistProductsBatch,
      );

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it('should handle positive price validation', async () => {
      const csvContent = [
        'nome,descricao,preco',
        'Produto Negativo,Descrição do produto,-10.50',
        'Produto Zero,Descrição do produto,0',
        'Marca Texto,Marca texto amarelo,4.50',
      ].join('\n');

      const buffer = Buffer.from(csvContent);

      const negativeError = [
        {
          property: 'preco',
          constraints: { isPositive: 'Preço deve ser positivo' },
        } as any,
      ];

      const zeroError = [
        {
          property: 'preco',
          constraints: { isPositive: 'Preço deve ser positivo' },
        } as any,
      ];

      mockValidate
        .mockResolvedValueOnce(negativeError)
        .mockResolvedValueOnce(zeroError)
        .mockResolvedValueOnce([]);

      mockPersistProductsBatch.mockResolvedValue({
        successCount: 1,
        errors: [],
      });

      const result = await processor.importCsvBuffer(
        buffer,
        mockPersistProductsBatch,
      );

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(2);
    });

    it('should handle persistence errors from callback', async () => {
      const csvContent = [
        'nome,descricao,preco',
        'Cola Bastão,Cola em bastão 40g,5.50',
        'Produto Existente,Produto já no banco,8.00',
      ].join('\n');

      const buffer = Buffer.from(csvContent);

      mockValidate.mockResolvedValue([]);

      const persistenceErrors: ProductBatchError[] = [
        {
          product: {
            nome: 'Produto Existente',
            descricao: 'Produto já no banco',
            preco: 8.0,
          },
          error: 'Produto já existe',
        },
      ];

      mockPersistProductsBatch.mockResolvedValue({
        successCount: 1,
        errors: persistenceErrors,
      });

      const result = await processor.importCsvBuffer(
        buffer,
        mockPersistProductsBatch,
      );

      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Produto já existe');
    });

    it('should handle custom separator option', async () => {
      const csvContent = [
        'nome;descricao;preco',
        'Estojo;Estojo escolar duplo;12.50',
        'Tesoura;Tesoura ponta redonda;8.90',
      ].join('\n');

      const buffer = Buffer.from(csvContent);

      mockValidate.mockResolvedValue([]);
      mockPersistProductsBatch.mockResolvedValue({
        successCount: 2,
        errors: [],
      });

      const result = await processor.importCsvBuffer(
        buffer,
        mockPersistProductsBatch,
        { separator: ';' },
      );

      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(mockPersistProductsBatch).toHaveBeenCalledWith([
        { nome: 'Estojo', descricao: 'Estojo escolar duplo', preco: 12.5 },
        { nome: 'Tesoura', descricao: 'Tesoura ponta redonda', preco: 8.9 },
      ]);
    });
  });
});
