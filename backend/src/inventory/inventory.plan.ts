import { OutOfStockException } from '../common/errors';

export interface InventoryWant {
  productId: number;
  qty: number;
}

export interface InventorySnapshot {
  productId: number;
  stock: number;
  version: number;
}

export interface InventoryUpdate {
  operation: 'reserve' | 'release';
  productId: number;
  expectedVersion: number;
  qty: number;
  stock: number;
  version: number;
}

export function planReserve(
  wants: readonly InventoryWant[],
  current: readonly InventorySnapshot[],
): InventoryUpdate[] {
  const requested = new Map<number, number>();

  for (const want of wants) {
    if (!Number.isSafeInteger(want.qty) || want.qty <= 0) {
      throw new RangeError(
        `Quantity for product ${want.productId} must be a positive integer`,
      );
    }
    const totalQty = (requested.get(want.productId) ?? 0) + want.qty;
    if (!Number.isSafeInteger(totalQty)) {
      throw new RangeError(
        `Total quantity for product ${want.productId} exceeds the safe integer range`,
      );
    }
    requested.set(want.productId, totalQty);
  }

  const inventory = new Map(current.map((item) => [item.productId, item]));

  return [...requested].map(([productId, qty]) => {
    const item = inventory.get(productId);
    if (!item || item.stock < qty) {
      throw new OutOfStockException(productId);
    }

    return {
      operation: 'reserve',
      productId,
      expectedVersion: item.version,
      qty,
      stock: item.stock - qty,
      version: item.version + 1,
    };
  });
}

export function planRelease(
  items: readonly InventoryWant[],
  current: readonly InventorySnapshot[],
): InventoryUpdate[] {
  const quantities = new Map<number, number>();

  for (const item of items) {
    if (!Number.isSafeInteger(item.qty) || item.qty <= 0) {
      throw new RangeError(
        `Quantity for product ${item.productId} must be a positive integer`,
      );
    }

    const totalQty = (quantities.get(item.productId) ?? 0) + item.qty;
    if (!Number.isSafeInteger(totalQty)) {
      throw new RangeError(
        `Total quantity for product ${item.productId} exceeds the safe integer range`,
      );
    }
    quantities.set(item.productId, totalQty);
  }

  const inventory = new Map(current.map((item) => [item.productId, item]));

  return [...quantities].map(([productId, qty]) => {
    const item = inventory.get(productId);
    if (!item) {
      throw new RangeError(`Inventory snapshot missing product ${productId}`);
    }

    const stock = item.stock + qty;
    const version = item.version + 1;
    if (!Number.isSafeInteger(stock) || !Number.isSafeInteger(version)) {
      throw new RangeError(`Inventory update for product ${productId} overflows`);
    }

    return {
      operation: 'release',
      productId,
      expectedVersion: item.version,
      qty,
      stock,
      version,
    };
  });
}
