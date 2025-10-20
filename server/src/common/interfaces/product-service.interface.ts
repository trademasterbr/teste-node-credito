import { Product } from 'src/products/products.entity';

export interface IProductService {
  create(product: any): Promise<Product>;
  findAll(): Promise<Product[]>;
}
