import { Logger } from '@nestjs/common';
import { Readable } from 'stream';
import * as csv from 'csv-parser';
import {
  CsvParsingException,
  EmptyCsvException,
  MissingRequiredColumnsException,
} from '../exceptions';

const logger = new Logger('CsvHandlersUtil');

export async function parseCsvBuffer(
  buffer: Buffer,
  separator: string,
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    const bufferInstance = Buffer.isBuffer(buffer)
      ? buffer
      : Buffer.from(buffer);
    const csvContent = bufferInstance.toString('utf-8');
    const readable = Readable.from([csvContent]);

    readable
      .pipe(
        csv({
          separator,
          mapHeaders: ({ header }) => header.trim(),
        }),
      )
      .on('data', (row: Record<string, string>) => {
        if (Object.keys(row).length > 0) {
          rows.push(row);
        }
      })
      .on('end', () => {
        logger.debug(`CSV processado com sucesso: ${rows.length} linhas`);
        resolve(rows);
      })
      .on('error', (error: Error) => {
        logger.error('Erro ao processar arquivo CSV', {
          error: error.message,
          stack: error.stack,
        });
        reject(new CsvParsingException(error.message));
      });
  });
}

export function validateCsvColumns(
  rows: Record<string, string>[],
  requiredColumns: string[],
): void {
  if (rows.length === 0) {
    throw new EmptyCsvException();
  }

  const firstRow = rows[0];
  const availableColumns = Object.keys(firstRow).map((col) =>
    col.toLowerCase().trim(),
  );

  const missingColumns = requiredColumns.filter(
    (required) => !availableColumns.includes(required.toLowerCase()),
  );

  if (missingColumns.length > 0) {
    logger.error('Colunas obrigatórias não encontradas no CSV', {
      requiredColumns,
      availableColumns,
      missingColumns,
    });

    throw new MissingRequiredColumnsException(missingColumns, requiredColumns);
  }

  logger.debug('Validação das colunas do CSV realizada com sucesso', {
    colunasEncontradas: availableColumns,
  });
}
