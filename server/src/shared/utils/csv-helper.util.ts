import { Logger } from '@nestjs/common';
import { Readable } from 'stream';
import * as csv from 'csv-parser';

const logger = new Logger('CsvHandlersUtil');

export async function parseCsvBuffer(
  buffer: Buffer,
  separator: string,
): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    const readable = Readable.from(buffer);

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
        reject(new Error(`Falha no processamento do CSV: ${error.message}`));
      });
  });
}

export function validateCsvColumns(
  rows: Record<string, string>[],
  requiredColumns: string[],
): {
  isValid: boolean;
  error?: string;
} {
  if (rows.length === 0) {
    return {
      isValid: false,
      error: 'Arquivo CSV está vazio ou não possui dados válidos',
    };
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

    return {
      isValid: false,
      error: `
      Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}.
      Colunas esperadas: ${requiredColumns.join(', ')}
      `,
    };
  }

  logger.debug('Validação das colunas do CSV realizada com sucesso', {
    colunasEncontradas: availableColumns,
  });

  return { isValid: true };
}
