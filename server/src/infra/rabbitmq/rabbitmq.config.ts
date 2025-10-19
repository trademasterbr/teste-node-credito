import { RABBITMQ_QUEUES } from './rabbitmq.constants';

export const rabbitmqConfigs = {
  PRODUCT_CSV_BATCH_QUEUE: {
    urls: [process.env.RABBITMQ_URL || 'amqp://user:password@localhost:5672'],
    queue: RABBITMQ_QUEUES.PRODUCT_CSV_BATCH_QUEUE,
    queueOptions: {
      durable: true,
    },
  },
};
