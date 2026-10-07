import { InventorySnapshot, planRelease } from './inventory.plan';

describe('planRelease', () => {
  it('restores requested quantities and increments each product version', () => {
    expect(
      planRelease(
        [
          { productId: 1, qty: 2 },
          { productId: 2, qty: 1 },
        ],
        [
          { productId: 1, stock: 3, version: 4 },
          { productId: 2, stock: 0, version: 7 },
        ],
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
      {
        operation: 'release',
        productId: 2,
        expectedVersion: 7,
        qty: 1,
        stock: 1,
        version: 8,
      },
    ]);
  });

  it('combines multiple order items for the same product', () => {
    expect(
      planRelease(
        [
          { productId: 1, qty: 2 },
          { productId: 1, qty: 3 },
        ],
        [{ productId: 1, stock: 10, version: 2 }],
      ),
    ).toEqual([
      {
        operation: 'release',
        productId: 1,
        expectedVersion: 2,
        qty: 5,
        stock: 15,
        version: 3,
      },
    ]);
  });

  it('does not mutate the current inventory snapshots', () => {
    const current: InventorySnapshot[] = [
      { productId: 1, stock: 3, version: 4 },
    ];

    planRelease([{ productId: 1, qty: 2 }], current);

    expect(current).toEqual([{ productId: 1, stock: 3, version: 4 }]);
  });
});
