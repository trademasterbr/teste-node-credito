import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductsService } from './products.service';
import { ProductRequestDto } from './dto/product.request.dto';

jest.mock('../shared/utils/database-helper.util', () => ({
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository,
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
        'Ja existe um produto com o nome Existing Product',
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

  describe('createProductsBatch', () => {
    it('should successfully create multiple products', async () => {
      const productsData: ProductRequestDto[] = [
        { nome: 'Produto 1', descricao: 'Descrição 1', preco: 10.5 },
        { nome: 'Produto 2', descricao: 'Descrição 2', preco: 20.0 },
      ];

      const mockProduct1 = {
        id: '1',
        nome: 'Produto 1',
        descricao: 'Descrição 1',
        preco: 10.5,
      } as Product;
      const mockProduct2 = {
        id: '2',
        nome: 'Produto 2',
        descricao: 'Descrição 2',
        preco: 20.0,
      } as Product;

      repository.exists.mockResolvedValue(false);
      repository.create
        .mockReturnValueOnce(mockProduct1)
        .mockReturnValueOnce(mockProduct2);
      repository.save
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      const result = await service.createProductsBatch(productsData);

      expect(result.successCount).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockRepository.create).toHaveBeenCalledTimes(2);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in batch creation', async () => {
      const productsData: ProductRequestDto[] = [
        { nome: 'Produto 1', descricao: 'Descrição 1', preco: 10.5 },
        { nome: 'Produto 2', descricao: 'Descrição 2', preco: 20.0 },
      ];

      const mockProduct1 = {
        id: '1',
        nome: 'Produto 1',
        descricao: 'Descrição 1',
        preco: 10.5,
      } as Product;
      const mockProduct2 = {
        id: '2',
        nome: 'Produto 2',
        descricao: 'Descrição 2',
        preco: 20.0,
      } as Product;

      repository.exists
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      repository.create
        .mockReturnValueOnce(mockProduct1)
        .mockReturnValueOnce(mockProduct2);
      repository.save.mockResolvedValueOnce(mockProduct1);

      const result = await service.createProductsBatch(productsData);

      expect(result.successCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe(
        'Ja existe um produto com o nome Produto 2',
      );
      expect(result.errors[0].product).toEqual(productsData[1]);
    });

    it('should handle empty batch', async () => {
      const productsData: ProductRequestDto[] = [];

      const result = await service.createProductsBatch(productsData);

      expect(result.successCount).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle all failures in batch creation', async () => {
      const productsData: ProductRequestDto[] = [
        { nome: 'Produto 1', descricao: 'Descrição 1', preco: 10.5 },
        { nome: 'Produto 2', descricao: 'Descrição 2', preco: 20.0 },
      ];

      const mockProduct1 = {
        id: '1',
        nome: 'Produto 1',
        descricao: 'Descrição 1',
        preco: 10.5,
      } as Product;
      const mockProduct2 = {
        id: '2',
        nome: 'Produto 2',
        descricao: 'Descrição 2',
        preco: 20.0,
      } as Product;

      repository.exists.mockResolvedValue(true);
      repository.create
        .mockReturnValueOnce(mockProduct1)
        .mockReturnValueOnce(mockProduct2);

      const result = await service.createProductsBatch(productsData);

      expect(result.successCount).toBe(0);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].error).toBe(
        'Ja existe um produto com o nome Produto 1',
      );
      expect(result.errors[1].error).toBe(
        'Ja existe um produto com o nome Produto 2',
      );
    });
  });
});
