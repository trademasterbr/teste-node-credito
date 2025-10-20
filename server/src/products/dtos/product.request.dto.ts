import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsPositive,
  MaxLength,
} from 'class-validator';

export class ProductRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do produto é obrigatório' })
  @MaxLength(100, {
    message: 'Nome do produto deve ter no máximo 100 caracteres',
  })
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNumber({}, { message: 'Preço deve ser um número' })
  @IsPositive({ message: 'Preço deve ser positivo' })
  preco: number;
}
