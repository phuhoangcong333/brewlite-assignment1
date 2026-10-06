import { InvalidTransitionException } from '../common/errors';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

const validTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> =
  {
    PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
    PAID: [],
    PAYMENT_FAILED: ['PAID', 'CANCELLED'],
    CANCELLED: [],
  };

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!validTransitions[from].includes(to)) {
    throw new InvalidTransitionException(from, to);
  }
}