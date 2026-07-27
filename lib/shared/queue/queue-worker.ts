import { logger } from '../observability/logger';

export type QueueTask<T = void> = () => Promise<T>;

interface QueueItem<T> {
  readonly id: string;
  readonly task: QueueTask<T>;
  readonly priority: number;
  readonly createdAt: number;
}

export class SimpleQueue {
  private readonly items: QueueItem<unknown>[] = [];
  private processing = false;
  private readonly concurrency: number;
  private activeCount = 0;

  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }

  enqueue<T>(task: QueueTask<T>, priority = 0, id?: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrappedTask: QueueTask<T> = async () => {
        try {
          const result = await task();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      };
      this.items.push({
        id: id ?? `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        task: wrappedTask,
        priority,
        createdAt: Date.now(),
      });
      this.items.sort((a, b) => b.priority - a.priority);
      void this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.processing && this.activeCount >= this.concurrency) return;
    this.processing = true;
    const item = this.items.shift();
    if (!item) {
      this.processing = false;
      return;
    }
    this.activeCount++;
    try {
      await item.task();
      logger.debug(`Queue task completed: ${item.id}`, { module: 'queue', metadata: { taskId: item.id } });
    } catch (error) {
      logger.error(`Queue task failed: ${item.id}`, error, { module: 'queue', metadata: { taskId: item.id } });
    } finally {
      this.activeCount--;
      void this.processNext();
      if (this.activeCount === 0) this.processing = false;
    }
  }

  get pendingCount(): number { return this.items.length; }
  get isProcessing(): boolean { return this.processing; }
}

export const globalQueue = new SimpleQueue(2);
