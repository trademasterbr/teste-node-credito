import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from '@nestjs/common';

export class CustomBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}

export class CustomConflictException extends ConflictException {
  constructor(message: string) {
    super(message);
  }
}

export class CustomNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(message);
  }
}

export class CustomUnprocessableEntityException extends UnprocessableEntityException {
  constructor(message: string) {
    super(message);
  }
}

export class CustomInternalServerErrorException extends InternalServerErrorException {
  constructor(message: string) {
    super(message);
  }
}
