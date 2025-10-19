import { UnprocessableEntityException } from '@nestjs/common';

export class CsvProcessingException extends UnprocessableEntityException {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidCsvFormatException extends CsvProcessingException {
  constructor(details?: string) {
    const message = details
      ? `Formato CSV inválido: ${details}`
      : 'Formato CSV inválido';
    super(message);
  }
}

export class MissingRequiredColumnsException extends CsvProcessingException {
  constructor(missingColumns: string[], requiredColumns: string[]) {
    super(
      `Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}. Colunas esperadas: ${requiredColumns.join(', ')}`,
    );
  }
}

export class EmptyCsvException extends CsvProcessingException {
  constructor() {
    super('Arquivo CSV está vazio ou não possui dados válidos');
  }
}

export class CsvParsingException extends CsvProcessingException {
  constructor(originalError: string) {
    super(`Falha no processamento do CSV: ${originalError}`);
  }
}
