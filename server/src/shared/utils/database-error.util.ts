import { QueryFailedError } from 'typeorm';

export function getDetailFromError(err: unknown): string {
  if (!err) {
    return 'Erro desconhecido';
  }

  if (err instanceof QueryFailedError) {
    return err.message || 'Erro na consulta ao banco de dados';
  }

  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === 'object') {
    const errorObj = err as {
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
