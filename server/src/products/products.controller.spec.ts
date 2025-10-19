import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsCsvProcessor } from './processor/products-csv.processor';
import { Product } from './product.entity';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProductsService = {
    findAll: jest.fn(),
    createProductsBatch: jest.fn(),
  };

  const mockCsvProcessor = {
    importCsvBuffer: jest.fn(),
  };

  const createMockFile = (
    content: string,
    filename = 'test.csv',
    mimetype = 'text/csv',
  ): Express.Multer.File => ({
    buffer: Buffer.from(content),
    fieldname: 'file',
    originalname: filename,
    encoding: '7bit',
    mimetype,
    size: content.length,
    destination: '',
    filename: '',
    path: '',
    stream: {} as import('stream').Readable,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: ProductsCsvProcessor,
          useValue: mockCsvProcessor,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      const mockProducts: Product[] = [
        {
          id: '1',
          nome: 'Product 1',
          descricao: 'Description 1',
          preco: 10.5,
        },
        {
          id: '2',
          nome: 'Product 2',
          descricao: 'Description 2',
          preco: 20.0,
        },
      ];

      mockProductsService.findAll.mockResolvedValue(mockProducts);

      const result = await controller.findAll();

      expect(mockProductsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection error');
      mockProductsService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow(error);
      expect(mockProductsService.findAll).toHaveBeenCalled();
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const csvContent = [
        'nome,descricao,preco',
        'Caneta Azul,Esferográfica ponta fina,15.99',
      ].join('\n');

      const mockFile = createMockFile(csvContent);

      const mockImportResult = {
        successCount: 1,
        errorCount: 0,
        errors: [],
      };

      mockCsvProcessor.importCsvBuffer.mockResolvedValue(mockImportResult);

      const result = await controller.uploadFile(mockFile);

      expect(mockCsvProcessor.importCsvBuffer).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.any(Function),
      );
      expect(result).toEqual({
        message: 'Processamento concluído',
        successCount: 1,
        errorCount: 0,
        errors: [],
      });
    });

    it('should throw error when no file is provided', async () => {
      await expect(
        controller.uploadFile(undefined as unknown as Express.Multer.File),
      ).rejects.toThrow('Arquivo não enviado ou está vazio');

      expect(mockCsvProcessor.importCsvBuffer).not.toHaveBeenCalled();
    });

    it('should handle file processing errors', async () => {
      const csvContent = 'conteúdo inválido sem estrutura CSV';
      const mockFile = createMockFile(csvContent);

      const processingError = new Error('CSV processing failed');
      mockCsvProcessor.importCsvBuffer.mockRejectedValue(processingError);

      await expect(controller.uploadFile(mockFile)).rejects.toThrow(
        processingError,
      );

      expect(mockCsvProcessor.importCsvBuffer).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.any(Function),
      );
    });

    it('should handle import with validation errors', async () => {
      const csvContent = [
        'nome,descricao,preco',
        'Produto Válido,Descrição válida,10.50',
        ',Produto sem nome,15.00',
      ].join('\n');

      const mockFile = createMockFile(csvContent);

      const mockImportResult = {
        successCount: 1,
        errorCount: 1,
        errors: [
          {
            product: {
              nome: '',
              descricao: 'Desc Sem Nome',
              preco: 15.0,
            },
            error: 'Erro de validação nos dados do CSV',
            validationErrors: [
              {
                property: 'nome',
                constraints: { isNotEmpty: 'Nome do produto é obrigatório' },
              },
            ],
          },
        ],
      };

      mockCsvProcessor.importCsvBuffer.mockResolvedValue(mockImportResult);

      const result = await controller.uploadFile(mockFile);

      expect(mockCsvProcessor.importCsvBuffer).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.any(Function),
      );
      expect(result).toEqual({
        message: 'Processamento concluído',
        successCount: 1,
        errorCount: 1,
        errors: [
          {
            product: {
              nome: '',
              descricao: 'Desc Sem Nome',
              preco: 15.0,
            },
            error: 'Erro de validação nos dados do CSV',
            validationErrors: [
              {
                property: 'nome',
                constraints: { isNotEmpty: 'Nome do produto é obrigatório' },
              },
            ],
          },
        ],
      });
    });

    it('should handle import with database persistence errors', async () => {
      const csvContent = [
        'nome,descricao,preco',
        'Produto Existente,Descrição do produto,10.50',
      ].join('\n');

      const mockFile = createMockFile(csvContent);

      const mockImportResult = {
        successCount: 0,
        errorCount: 1,
        errors: [
          {
            product: {
              nome: 'Produto Existente',
              descricao: 'Desc',
              preco: 10.5,
            },
            error: 'Produto com este nome já existe',
          },
        ],
      };

      mockCsvProcessor.importCsvBuffer.mockResolvedValue(mockImportResult);

      const result = await controller.uploadFile(mockFile);

      expect(mockCsvProcessor.importCsvBuffer).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.any(Function),
      );
      expect(result).toEqual({
        message: 'Processamento concluído',
        successCount: 0,
        errorCount: 1,
        errors: [
          {
            product: {
              nome: 'Produto Existente',
              descricao: 'Desc',
              preco: 10.5,
            },
            error: 'Produto com este nome já existe',
          },
        ],
      });
    });

    it('should handle empty file upload', async () => {
      const csvContent = ['nome,descricao,preco', ''].join('\n');

      const mockFile = createMockFile(csvContent, 'empty.csv');

      const mockImportResult = {
        successCount: 0,
        errorCount: 0,
        errors: [],
      };

      mockCsvProcessor.importCsvBuffer.mockResolvedValue(mockImportResult);

      const result = await controller.uploadFile(mockFile);

      expect(mockCsvProcessor.importCsvBuffer).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.any(Function),
      );
      expect(result).toEqual({
        message: 'Processamento concluído',
        successCount: 0,
        errorCount: 0,
        errors: [],
      });
    });

    it('should reject non-CSV files', async () => {
      const textContent = 'Este é um arquivo de texto comum, não CSV';
      const mockFile = createMockFile(textContent, 'test.txt', 'text/plain');

      await expect(controller.uploadFile(mockFile)).rejects.toThrow(
        'Tipo de arquivo não suportado: test.txt. Tipos permitidos: CSV',
      );

      expect(mockCsvProcessor.importCsvBuffer).not.toHaveBeenCalled();
    });

    it('should reject files without .csv extension (case insensitive)', async () => {
      const mockFile = createMockFile(
        'nome,descricao,preco\nTest,Desc,10.99',
        'test.TXT',
        'text/csv',
      );

      await expect(controller.uploadFile(mockFile)).rejects.toThrow(
        'Tipo de arquivo não suportado: test.TXT. Tipos permitidos: CSV',
      );

      expect(mockCsvProcessor.importCsvBuffer).not.toHaveBeenCalled();
    });

    it('should pass the correct callback function to CSV processor', async () => {
      const csvContent = [
        'nome,descricao,preco',
        'Lápis,Lápis de escrever HB,1.50',
      ].join('\n');

      const mockFile = createMockFile(csvContent);

      const mockImportResult = {
        successCount: 1,
        errorCount: 0,
        errors: [],
      };

      mockCsvProcessor.importCsvBuffer.mockResolvedValue(mockImportResult);

      await controller.uploadFile(mockFile);

      expect(mockCsvProcessor.importCsvBuffer).toHaveBeenCalledWith(
        mockFile.buffer,
        expect.any(Function),
      );
    });

    describe('error response format', () => {
      it('should return properly formatted response with validation errors', async () => {
        const csvContent = [
          'nome,descricao,preco',
          ',Produto com dados inválidos,abc',
        ].join('\n');

        const mockFile = createMockFile(csvContent);

        const mockImportResult = {
          successCount: 0,
          errorCount: 1,
          errors: [
            {
              product: {
                nome: '',
                descricao: 'Invalid Product',
                preco: Number.NaN,
              },
              error: 'Validation failed',
              validationErrors: [
                {
                  property: 'nome',
                  constraints: { isNotEmpty: 'Nome é obrigatório' },
                },
                {
                  property: 'preco',
                  constraints: { isNumber: 'Preço deve ser um número' },
                },
              ],
            },
          ],
        };

        mockCsvProcessor.importCsvBuffer.mockResolvedValue(mockImportResult);

        const result = await controller.uploadFile(mockFile);

        expect(result).toEqual({
          message: 'Processamento concluído',
          successCount: 0,
          errorCount: 1,
          errors: [
            {
              product: {
                nome: '',
                descricao: 'Invalid Product',
                preco: Number.NaN,
              },
              error: 'Validation failed',
              validationErrors: [
                {
                  property: 'nome',
                  constraints: { isNotEmpty: 'Nome é obrigatório' },
                },
                {
                  property: 'preco',
                  constraints: { isNumber: 'Preço deve ser um número' },
                },
              ],
            },
          ],
        });
      });

      it('should handle errors without validation details', async () => {
        const csvContent = [
          'nome,descricao,preco',
          'Produto Duplicado,Descrição do produto duplicado,10.99',
        ].join('\n');

        const mockFile = createMockFile(csvContent);

        const mockImportResult = {
          successCount: 0,
          errorCount: 1,
          errors: [
            {
              product: {
                nome: 'Produto Duplicado',
                descricao: 'Descrição do produto duplicado',
                preco: 10.99,
              },
              error: 'Produto já existe no banco de dados',
            },
          ],
        };

        mockCsvProcessor.importCsvBuffer.mockResolvedValue(mockImportResult);

        const result = await controller.uploadFile(mockFile);

        expect(result.errors[0]).toEqual({
          product: {
            nome: 'Produto Duplicado',
            descricao: 'Descrição do produto duplicado',
            preco: 10.99,
          },
          error: 'Produto já existe no banco de dados',
          validationErrors: undefined,
        });
      });
    });
  });
});
