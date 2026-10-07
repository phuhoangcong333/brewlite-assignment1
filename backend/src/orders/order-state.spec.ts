import { InvalidTransitionException } from '../common/errors';
import { assertTransition, OrderStatus } from './order-state';

const statuses: OrderStatus[] = [
  'PENDING',
  'PAID',
  'PREPARING',
  'READY',
  'COMPLETED',
  'PAYMENT_FAILED',
  'CANCELLED',
];

const validTransitions: ReadonlyArray<readonly [OrderStatus, OrderStatus]> = [
  ['PENDING', 'PAID'],
  ['PENDING', 'PAYMENT_FAILED'],
  ['PENDING', 'CANCELLED'],
  ['PAYMENT_FAILED', 'PENDING'],
  ['PAYMENT_FAILED', 'CANCELLED'],
  ['PAID', 'PREPARING'],
  ['PAID', 'CANCELLED'],
  ['PREPARING', 'READY'],
  ['READY', 'COMPLETED'],
];

describe('assertTransition', () => {
  it('covers all 49 status pairs and the 9 allowed transitions', () => {
    const allPairs = statuses.flatMap((from) =>
      statuses.map((to) => [from, to] as const),
    );

    expect(statuses).toHaveLength(7);
    expect(allPairs).toHaveLength(49);
    expect(validTransitions).toHaveLength(9);
  });

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
