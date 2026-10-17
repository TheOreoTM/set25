import { Prisma } from "@set25/database";
import type { CostAllocationMethodValue } from "@set25/shared";

type CostLine = {
  id: string;
  quantity: number;
  unitCost: Prisma.Decimal | string;
  exchangeRateToMvr: Prisma.Decimal | string;
};

export type AllocatedCostLine = {
  id: string;
  quantity: number;
  productCostMvr: Prisma.Decimal;
  allocatedSharedCostMvr: Prisma.Decimal;
  totalCostMvr: Prisma.Decimal;
  actualUnitCostMvr: Prisma.Decimal;
};

export function calculateImportCosts(
  lines: CostLine[],
  sharedCostMvr: Prisma.Decimal | string,
  method: CostAllocationMethodValue,
) {
  const shared = new Prisma.Decimal(sharedCostMvr).toDecimalPlaces(2);
  const prepared = lines.map((line) => ({
    ...line,
    productCostMvr: new Prisma.Decimal(line.unitCost)
      .mul(line.exchangeRateToMvr)
      .mul(line.quantity),
  }));
  const productValueDenominator = prepared.reduce(
    (sum, line) =>
      sum.add(method === "BY_QUANTITY" ? line.quantity : line.productCostMvr),
    new Prisma.Decimal(0),
  );
  const useQuantity = method === "BY_QUANTITY" || productValueDenominator.eq(0);
  const denominator = useQuantity
    ? prepared.reduce(
        (sum, line) => sum.add(line.quantity),
        new Prisma.Decimal(0),
      )
    : productValueDenominator;

  let allocated = new Prisma.Decimal(0);
  const allocatedLines: AllocatedCostLine[] = prepared.map((line, index) => {
    const isLast = index === prepared.length - 1;
    const weight = new Prisma.Decimal(
      useQuantity ? line.quantity : line.productCostMvr,
    );
    const share = isLast
      ? shared.sub(allocated)
      : denominator.eq(0)
        ? new Prisma.Decimal(0)
        : shared.mul(weight).div(denominator).toDecimalPlaces(2);
    allocated = allocated.add(share);
    const total = line.productCostMvr.add(share);
    return {
      id: line.id,
      quantity: line.quantity,
      productCostMvr: line.productCostMvr.toDecimalPlaces(2),
      allocatedSharedCostMvr: share,
      totalCostMvr: total.toDecimalPlaces(2),
      actualUnitCostMvr: total.div(line.quantity).toDecimalPlaces(4),
    };
  });

  return {
    lines: allocatedLines,
    productCostMvr: prepared
      .reduce(
        (sum, line) => sum.add(line.productCostMvr),
        new Prisma.Decimal(0),
      )
      .toDecimalPlaces(2),
    sharedCostMvr: shared,
    totalCostMvr: prepared
      .reduce((sum, line) => sum.add(line.productCostMvr), shared)
      .toDecimalPlaces(2),
  };
}

export function weightedAverageCost(
  existingStock: number,
  existingCost: Prisma.Decimal | null,
  receivedStock: number,
  receivedCost: Prisma.Decimal,
) {
  if (existingStock <= 0 || existingCost === null)
    return receivedCost.toDecimalPlaces(2);
  return existingCost
    .mul(existingStock)
    .add(receivedCost.mul(receivedStock))
    .div(existingStock + receivedStock)
    .toDecimalPlaces(2);
}
