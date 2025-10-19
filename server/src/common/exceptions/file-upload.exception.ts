import { BadRequestException } from '@nestjs/common';

export class FileUploadException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class InvalidFileTypeException extends FileUploadException {
  constructor(allowedTypes: string[], receivedType?: string) {
    const message = receivedType
      ? `Tipo de arquivo não suportado: ${receivedType}. Tipos permitidos: ${allowedTypes.join(', ')}`
      : `Tipos de arquivo permitidos: ${allowedTypes.join(', ')}`;
    super(message);
  }
}

export class EmptyFileException extends FileUploadException {
  constructor() {
    super('Arquivo não enviado ou está vazio');
  }
}

export class FileTooLargeException extends FileUploadException {
  constructor(maxSize: string) {
    super(`Arquivo muito grande. Tamanho máximo permitido: ${maxSize}`);
  }
}
