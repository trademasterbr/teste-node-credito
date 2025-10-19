import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './products.entity';
import {
  EmptyFileException,
  InvalidFileTypeException,
} from '../common/exceptions';

describe('ProductsController', () => {
  let controller: ProductsController;

  const mockProductsService = {
    findAll: jest.fn(),
    sendProductsCsvToBatch: jest.fn(),
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
    it('should upload CSV file successfully', () => {
      const csvContent = 'nome,descricao,preco\nCaneta,Esferográfica,2.50';
      const mockFile = createMockFile(csvContent, 'test.csv');

      const result = controller.uploadFile(mockFile);

      expect(mockProductsService.sendProductsCsvToBatch).toHaveBeenCalledWith({
        filename: 'test.csv',
        buffer: mockFile.buffer,
      });

      expect(result).toEqual({
        message: 'Arquivo recebido com sucesso e enviado para processamento',
        filename: 'test.csv',
      });
    });

    it('should throw error when no file is provided', () => {
      expect(() =>
        controller.uploadFile(undefined as unknown as Express.Multer.File),
      ).toThrow(EmptyFileException);

      expect(mockProductsService.sendProductsCsvToBatch).not.toHaveBeenCalled();
    });

    it('should throw error for non-CSV files', () => {
      const mockFile = createMockFile('content', 'test.txt', 'text/plain');

      expect(() => controller.uploadFile(mockFile)).toThrow(
        InvalidFileTypeException,
      );

      expect(mockProductsService.sendProductsCsvToBatch).not.toHaveBeenCalled();
    });

    it('should accept CSV files with different case extensions', () => {
      const csvContent = 'nome,descricao,preco\nCaneta,Esferográfica,2.50';
      const mockFile = createMockFile(csvContent, 'test.CSV');

      const result = controller.uploadFile(mockFile);

      expect(mockProductsService.sendProductsCsvToBatch).toHaveBeenCalledWith({
        filename: 'test.CSV',
        buffer: mockFile.buffer,
      });

      expect(result).toEqual({
        message: 'Arquivo recebido com sucesso e enviado para processamento',
        filename: 'test.CSV',
      });
    });

    it('should handle RabbitMQ errors', () => {
      const csvContent = 'nome,descricao,preco\nCaneta,Esferográfica,2.50';
      const mockFile = createMockFile(csvContent, 'test.csv');
      const serviceError = new Error('RabbitMQ connection failed');

      mockProductsService.sendProductsCsvToBatch.mockImplementation(() => {
        throw serviceError;
      });

      expect(() => controller.uploadFile(mockFile)).toThrow(serviceError);

      mockProductsService.sendProductsCsvToBatch.mockReset();
    });
  });
});
