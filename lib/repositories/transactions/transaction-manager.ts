import { TransactionError } from '../errors';
import { getFirestoreInstance } from '../firestore/firestore.service';
import { Transaction } from 'firebase-admin/firestore';

interface TransactionOptions {
  readonly maxAttempts?: number;
  readonly idempotencyKey?: string;
  readonly requestId?: string;
}

export class TransactionManager {
  private static instance: TransactionManager;
  private transactionIdCounter = 0;

  private constructor() {}

  static getInstance(): TransactionManager {
    if (!TransactionManager.instance) {
      TransactionManager.instance = new TransactionManager();
    }
    return TransactionManager.instance;
  }

  generateTransactionId(requestId?: string): string {
    const timestamp = Date.now().toString(36);
    const counter = (++this.transactionIdCounter).toString(36);
    return `${requestId || ''}-${timestamp}-${counter}`.slice(0, 36);
  }

  async runTransaction<T>(
    updateFunction: (transaction: Transaction) => Promise<T>,
    _transactionId?: string,
    options: TransactionOptions = {},
  ): Promise<T> {
    const { maxAttempts = 3 } = options;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const db = getFirestoreInstance();
        const result = await db.runTransaction(async (transaction) => {
          return await updateFunction(transaction);
        });
        return result;
      } catch (error) {
        lastError = error as Error;
        if (this.isRetryableError(lastError) && attempt < maxAttempts) {
          await this.sleep(Math.pow(2, attempt) * 100);
          continue;
        }
        throw lastError;
      }
    }

    throw new TransactionError(
      `Transaction failed after ${maxAttempts} attempts: ${(lastError as Error).message}`,
    );
  }

  async executeBatch(
    operations: Array<(transaction: Transaction) => Promise<void>>,
    transactionId?: string,
    options: TransactionOptions = {},
  ): Promise<void> {
    await this.runTransaction(async (transaction) => {
      for (const operation of operations) {
        await operation(transaction);
      }
    }, transactionId, options);
  }

  isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('conflict') ||
      message.includes('unavailable') ||
      message.includes('resource-exhausted') ||
      message.includes('deadline exceeded')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
