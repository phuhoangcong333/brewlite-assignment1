import { InvalidTransitionException } from '../common/errors';
import { InventorySnapshot } from '../inventory/inventory.plan';
import { OrderStatus } from './order-state';
import { planCancel } from './order-cancel.plan';

const allowedStatuses: OrderStatus[] = [
  'PENDING',
  'PAYMENT_FAILED',
  'PAID',
];
const blockedStatuses: OrderStatus[] = [
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
];

describe('planCancel', () => {
  it.each(allowedStatuses)(
    'plans inventory release when cancelling %s',
    (status) => {
      expect(
        planCancel(
          status,
          [{ productId: 1, qty: 2 }],
          [{ productId: 1, stock: 3, version: 4 }],
        ),
      ).toEqual([
        {
          operation: 'release',
          productId: 1,
          expectedVersion: 4,
          qty: 2,
          stock: 5,
          version: 5,
        },
      ]);
    },
  );

  it.each(blockedStatuses)(
    'rejects cancellation from %s without producing inventory updates',
    (status) => {
      const current: InventorySnapshot[] = [
        { productId: 1, stock: 3, version: 4 },
      ];

      expect(() =>
        planCancel(
          status,
          [{ productId: 1, qty: 2 }],
          current,
        ),
      ).toThrow(InvalidTransitionException);
      expect(current).toEqual([{ productId: 1, stock: 3, version: 4 }]);
    },
  );
});
