import { QueryFailedError } from 'typeorm';

export function handleDatabaseError(error: unknown): string {
  if (!error) {
    return 'Erro desconhecido';
  }

  if (error instanceof QueryFailedError) {
    return error.message || 'Erro na consulta ao banco de dados';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object') {
    const errorObj = error as {
      detail?: unknown;
      driverError?: { detail?: unknown };
      message?: unknown;
    };

    if (typeof errorObj.detail === 'string') {
      return errorObj.detail;
    }

    if (typeof errorObj.driverError?.detail === 'string') {
      return errorObj.driverError.detail;
    }

    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
  }

  return 'Erro interno do servidor';
}
