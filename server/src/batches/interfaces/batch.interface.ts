import { ValidationError } from 'class-validator';

export interface IBatchError<T = any> {
  item: T;
  error?: string;
  validationErrors?: ValidationError[];
}

export interface IBatchResult<T = any> {
  successCount: number;
  errorCount: number;
  errors: IBatchError<T>[];
}
