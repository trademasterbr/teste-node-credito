import {
  IsString,
  IsOptional,
  IsNumber,
  IsNotEmpty,
  IsPositive,
} from 'class-validator';

export class RequestUploadProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do produto é obrigatório' })
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsNumber({}, { message: 'Preço deve ser um número' })
  @IsPositive({ message: 'Preço deve ser positivo' })
  preco: number;
}
