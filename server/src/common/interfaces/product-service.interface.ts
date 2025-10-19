import { Product } from 'src/product/products.entity';

export interface IProductService {
  create(product: any): Promise<Product>;
  findAll(): Promise<Product[]>;
}
