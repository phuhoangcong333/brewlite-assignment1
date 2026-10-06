import { ConflictException } from '@nestjs/common';

export class InvalidTransitionException extends ConflictException {
  constructor(from: string, to: string) {
    super(`Cannot transition order from ${from} to ${to}`);
  }
}

export class OutOfStockException extends ConflictException {
  constructor(productId: string) {
    super(`Insufficient stock for product ${productId}`);
  }
}