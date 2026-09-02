// DatPhotography's fixed print packages. Single-business app — same
// reasoning as src/lib/business.ts for not making this a database table.
export type PrintSize = "4x5" | "5x7" | "8x10";

export const PRINT_SIZE_LABELS: Record<PrintSize, string> = {
  "4x5": "4 x 5 Inches Photo Print Lustre",
  "5x7": "5 x 7 Inches Photo Print Lustre",
  "8x10": "8 x 10 Inches Photo Print Lustre",
};

export type PackageSlot = { size: PrintSize; count: number };

export type PackageDef = {
  id: "ultimate" | "silver" | "basic";
  name: string;
  priceCents: number;
  slots: PackageSlot[];
};

export const PACKAGES: PackageDef[] = [
  {
    id: "ultimate",
    name: "Ultimate",
    priceCents: 4300,
    slots: [
      { size: "4x5", count: 4 },
      { size: "5x7", count: 2 },
      { size: "8x10", count: 1 },
    ],
  },
  {
    id: "silver",
    name: "Silver",
    priceCents: 3300,
    slots: [
      { size: "5x7", count: 2 },
      { size: "8x10", count: 1 },
    ],
  },
  {
    id: "basic",
    name: "Basic",
    priceCents: 2800,
    slots: [
      { size: "4x5", count: 4 },
      { size: "5x7", count: 2 },
    ],
  },
];

export function getPackage(id: string): PackageDef | undefined {
  return PACKAGES.find((p) => p.id === id);
}

// À la carte pricing — for a client who doesn't want a fixed package, just
// individual reprints of specific photos.
export const INDIVIDUAL_PRICES_CENTS: Record<PrintSize, number> = {
  "4x5": 1200,
  "5x7": 1500,
  "8x10": 2000,
};

// Flattens a package's slots into individually addressable print slots, e.g.
// Ultimate -> [{size:"4x5",slotIndex:0}, {size:"4x5",slotIndex:1}, ...,
// {size:"8x10",slotIndex:0}], for a UI that assigns one photo per slot.
export function packageSlotList(
  pkg: PackageDef
): { size: PrintSize; slotIndex: number; key: string }[] {
  return pkg.slots.flatMap((slot) =>
    Array.from({ length: slot.count }, (_, i) => ({
      size: slot.size,
      slotIndex: i,
      key: `${slot.size}-${i}`,
    }))
  );
}
