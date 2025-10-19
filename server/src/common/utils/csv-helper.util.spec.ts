import { parseCsvBuffer, validateCsvColumns } from './csv-helper.util';
import {
  EmptyCsvException,
  MissingRequiredColumnsException,
} from '../exceptions';

describe('CsvHelperUtil', () => {
  describe('parseCsvBuffer', () => {
    it('should parse valid CSV content successfully', async () => {
      const csvContent =
        'nome,descricao,preco\nCaneta Azul,Esferográfica,2.50\nCaderno,96 folhas,12.90';
      const buffer = Buffer.from(csvContent);

      const result = await parseCsvBuffer(buffer, ',');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        nome: 'Caneta Azul',
        descricao: 'Esferográfica',
        preco: '2.50',
      });
      expect(result[1]).toEqual({
        nome: 'Caderno',
        descricao: '96 folhas',
        preco: '12.90',
      });
    });

    it('should handle CSV with custom separator', async () => {
      const csvContent =
        'nome;descricao;preco\nCaneta Azul;Esferográfica;2.50\nCaderno;96 folhas;12.90';
      const buffer = Buffer.from(csvContent);

      const result = await parseCsvBuffer(buffer, ';');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        nome: 'Caneta Azul',
        descricao: 'Esferográfica',
        preco: '2.50',
      });
    });

    it('should trim headers whitespace', async () => {
      const csvContent = ' nome , descricao , preco \nCaneta,Azul,2.50';
      const buffer = Buffer.from(csvContent);

      const result = await parseCsvBuffer(buffer, ',');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        nome: 'Caneta',
        descricao: 'Azul',
        preco: '2.50',
      });
    });

    it('should handle empty CSV content', async () => {
      const csvContent = 'nome,descricao,preco\n';
      const buffer = Buffer.from(csvContent);

      const result = await parseCsvBuffer(buffer, ',');

      expect(result).toHaveLength(0);
    });

    it('should handle CSV with quoted values', async () => {
      const csvContent =
        'nome,descricao,preco\n"Caneta Azul","Esferográfica, ponta fina","2,50"';
      const buffer = Buffer.from(csvContent);

      const result = await parseCsvBuffer(buffer, ',');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        nome: 'Caneta Azul',
        descricao: 'Esferográfica, ponta fina',
        preco: '2,50',
      });
    });

    it('should handle malformed CSV gracefully', async () => {
      const csvContent = 'invalid,csv,format\n"unclosed quote,test,value';
      const buffer = Buffer.from(csvContent);

      const result = await parseCsvBuffer(buffer, ',');

      // The CSV parser is tolerant and will parse even malformed CSV
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('invalid');
    });

    it('should handle buffer input correctly', async () => {
      const csvContent = 'nome,preco\nTeste,10.50';
      const buffer = Buffer.from(csvContent);

      const result = await parseCsvBuffer(buffer, ',');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        nome: 'Teste',
        preco: '10.50',
      });
    });
  });

  describe('validateCsvColumns', () => {
    it('should validate required columns successfully', () => {
      const rows = [
        { nome: 'Produto1', descricao: 'Desc1', preco: '10.50' },
        { nome: 'Produto2', descricao: 'Desc2', preco: '20.00' },
      ];
      const requiredColumns = ['nome', 'preco'];

      expect(() => validateCsvColumns(rows, requiredColumns)).not.toThrow();
    });

    it('should handle case insensitive column validation', () => {
      const rows = [{ NOME: 'Produto1', DESCRICAO: 'Desc1', PRECO: '10.50' }];
      const requiredColumns = ['nome', 'preco'];

      expect(() => validateCsvColumns(rows, requiredColumns)).not.toThrow();
    });

    it('should handle columns with extra whitespace', () => {
      const rows = [
        { ' nome ': 'Produto1', ' descricao ': 'Desc1', ' preco ': '10.50' },
      ];
      const requiredColumns = ['nome', 'preco'];

      expect(() => validateCsvColumns(rows, requiredColumns)).not.toThrow();
    });

    it('should throw EmptyCsvException for empty rows', () => {
      const rows: Record<string, string>[] = [];
      const requiredColumns = ['nome', 'preco'];

      expect(() => validateCsvColumns(rows, requiredColumns)).toThrow(
        EmptyCsvException,
      );
    });

    it('should throw MissingRequiredColumnsException for missing columns', () => {
      const rows = [
        { nome: 'Produto1', descricao: 'Desc1' }, // missing 'preco'
      ];
      const requiredColumns = ['nome', 'preco'];

      expect(() => validateCsvColumns(rows, requiredColumns)).toThrow(
        MissingRequiredColumnsException,
      );
    });

    it('should throw MissingRequiredColumnsException with correct missing columns', () => {
      const rows = [{ nome: 'Produto1' }];
      const requiredColumns = ['nome', 'descricao', 'preco'];

      try {
        validateCsvColumns(rows, requiredColumns);
      } catch (error) {
        expect(error).toBeInstanceOf(MissingRequiredColumnsException);
        expect((error as Error).message).toContain('descricao');
        expect((error as Error).message).toContain('preco');
      }
    });

    it('should allow extra columns in CSV', () => {
      const rows = [
        {
          nome: 'Produto1',
          descricao: 'Desc1',
          preco: '10.50',
          categoria: 'Cat1',
        },
      ];
      const requiredColumns = ['nome', 'preco'];

      expect(() => validateCsvColumns(rows, requiredColumns)).not.toThrow();
    });

    it('should validate all required columns are present', () => {
      const rows = [{ nome: 'Produto1', preco: '10.50', categoria: 'Cat1' }];
      const requiredColumns = ['nome', 'preco', 'categoria'];

      expect(() => validateCsvColumns(rows, requiredColumns)).not.toThrow();
    });
  });
});
