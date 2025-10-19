import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products.entity';
import { ProductsService } from './products.service';
import { ProductRequestDto } from './dto/products.request.dto';
import { ProductsPublisherProcessor } from './publisher/product.publishers';

jest.mock('../common/utils/database-helper.util', () => ({
  handleDatabaseError: jest.fn((error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message;
    }
    return 'Erro desconhecido';
  }),
}));

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<Repository<Product>>;

  const mockRepository = {
    create: jest.fn() as jest.MockedFunction<Repository<Product>['create']>,
    save: jest.fn() as jest.MockedFunction<Repository<Product>['save']>,
    find: jest.fn() as jest.MockedFunction<Repository<Product>['find']>,
    exists: jest.fn() as jest.MockedFunction<Repository<Product>['exists']>,
  };

  const mockPublisher = {
    publishProductCsvBatch: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
        },
        {
          provide: ProductsPublisherProcessor,
          useValue: mockPublisher,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(getRepositoryToken(Product));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a product successfully', async () => {
      const productData: ProductRequestDto = {
        nome: 'Test Product',
        descricao: 'Test Description',
        preco: 10.5,
      };

      const mockProduct = { id: '1', ...productData } as Product;

      repository.exists.mockResolvedValue(false);
      repository.create.mockReturnValue(mockProduct);
      repository.save.mockResolvedValue(mockProduct);

      const result = await service.create(productData);

      expect(mockRepository.exists).toHaveBeenCalledWith({
        where: { nome: productData.nome },
      });
      expect(mockRepository.create).toHaveBeenCalledWith(productData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });

    it('should throw an error if repository.save fails', async () => {
      const productData: ProductRequestDto = {
        nome: 'Test Product',
        descricao: 'Test Description',
        preco: 10.5,
      };

      const mockProduct = { id: '1', ...productData } as Product;
      const dbError = new Error('Database error');

      repository.exists.mockResolvedValue(false);
      repository.create.mockReturnValue(mockProduct);
      repository.save.mockRejectedValue(dbError);

      await expect(service.create(productData)).rejects.toThrow();
    });

    it('should throw an error if product already exists', async () => {
      const productData: ProductRequestDto = {
        nome: 'Existing Product',
        descricao: 'Test Description',
        preco: 10.5,
      };

      repository.exists.mockResolvedValue(true);

      await expect(service.create(productData)).rejects.toThrow(
        'Já existe um produto com o nome: Existing Product',
      );
    });
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

      repository.find.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });

    it('should throw an error if repository.find fails', async () => {
      const dbError = new Error('Database connection error');
      repository.find.mockRejectedValue(dbError);

      await expect(service.findAll()).rejects.toThrow(dbError);
    });
  });

  describe('sendProductsCsvToBatch', () => {
    it('should send file data to batch processing', () => {
      const fileData = {
        filename: 'test.csv',
        buffer: Buffer.from('nome,preco\nProduto,10.5'),
      };

      service.sendProductsCsvToBatch(fileData);

      expect(mockPublisher.publishProductCsvBatch).toHaveBeenCalledWith(
        fileData,
      );
    });
  });
});
