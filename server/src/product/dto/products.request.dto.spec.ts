import { validate } from 'class-validator';
import { ProductRequestDto } from './products.request.dto';

describe('RequestUploadProductDto', () => {
  describe('validation', () => {
    it('should validate a valid product DTO', async () => {
      const dto = new ProductRequestDto();
      dto.nome = 'Produto Teste';
      dto.descricao = 'Descrição do produto teste';
      dto.preco = 19.99;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should validate a valid product DTO without description', async () => {
      const dto = new ProductRequestDto();
      dto.nome = 'Produto Teste';
      dto.preco = 19.99;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    describe('nome validation', () => {
      it('should fail when nome is empty', async () => {
        const dto = new ProductRequestDto();
        dto.nome = '';
        dto.preco = 19.99;

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('nome');
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
        expect(errors[0].constraints?.isNotEmpty).toBe(
          'Nome do produto é obrigatório',
        );
      });

      it('should fail when nome is undefined', async () => {
        const dto = new ProductRequestDto();
        dto.preco = 19.99;

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('nome');
        expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      });

      it('should fail when nome is null', async () => {
        const dto = new ProductRequestDto();
        dto.nome = null as unknown as string;
        dto.preco = 19.99;

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('nome');
        expect(errors[0].constraints).toHaveProperty('isString');
      });
    });

    describe('preco validation', () => {
      it('should fail when preco is undefined', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('preco');
        expect(errors[0].constraints).toHaveProperty('isNumber');
      });

      it('should fail when preco is null', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.preco = null as unknown as number;

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('preco');
        expect(errors[0].constraints).toHaveProperty('isNumber');
      });

      it('should fail when preco is not a number', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.preco = 'not a number' as unknown as number;

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('preco');
        expect(errors[0].constraints).toHaveProperty('isNumber');
      });

      it('should fail when preco is negative', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.preco = -10.5;

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('preco');
        expect(errors[0].constraints).toHaveProperty('isPositive');
        expect(errors[0].constraints?.isPositive).toBe(
          'Preço deve ser positivo',
        );
      });

      it('should fail when preco is zero', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.preco = 0;

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('preco');
        expect(errors[0].constraints).toHaveProperty('isPositive');
        expect(errors[0].constraints?.isPositive).toBe(
          'Preço deve ser positivo',
        );
      });

      it('should pass when preco is positive integer', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.preco = 20;

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should pass when preco is positive decimal', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.preco = 19.99;

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should fail when preco is NaN', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.preco = NaN;

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('preco');
        expect(errors[0].constraints).toHaveProperty('isNumber');
      });
    });

    describe('descricao validation', () => {
      it('should pass when descricao is undefined (optional field)', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.preco = 19.99;

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should pass when descricao is an empty string', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.descricao = '';
        dto.preco = 19.99;

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should pass when descricao is a valid string', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.descricao = 'Descrição válida do produto';
        dto.preco = 19.99;

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });

      it('should pass when descricao is null (optional field)', async () => {
        const dto = new ProductRequestDto();
        dto.nome = 'Produto Teste';
        dto.descricao = null as unknown as string;
        dto.preco = 19.99;

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
      });
    });
  });
});
