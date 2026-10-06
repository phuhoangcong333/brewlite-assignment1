import { InvalidTransitionException } from '../common/errors';
import { assertTransition, OrderStatus } from './order-state';

const statuses: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PAYMENT_FAILED',
  'CANCELLED',
];

const validTransitions: ReadonlyArray<readonly [OrderStatus, OrderStatus]> = [
  ['PENDING', 'PAID'],
  ['PENDING', 'PAYMENT_FAILED'],
  ['PENDING', 'CANCELLED'],
  ['PAYMENT_FAILED', 'PAID'],
  ['PAYMENT_FAILED', 'CANCELLED'],
];

describe('assertTransition', () => {
  it.each(statuses.flatMap((from) => statuses.map((to) => [from, to] as const)))(
    'checks transition %s -> %s',
    (from, to) => {
      const isValid = validTransitions.some(
        ([validFrom, validTo]) => validFrom === from && validTo === to,
      );

      if (isValid) {
        expect(() => assertTransition(from, to)).not.toThrow();
      } else {
        expect(() => assertTransition(from, to)).toThrow(
          new InvalidTransitionException(from, to),
        );
      }
    },
  );
});
