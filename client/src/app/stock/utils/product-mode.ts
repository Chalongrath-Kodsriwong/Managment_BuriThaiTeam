export const DIRECT_VARIANT_NAME = "";
export const DIRECT_INVENTORY_NAME = "No Inventory";

export type ProductInputMode = "variant" | "direct";

type InventoryLike = {
  inventory_id?: number;
  inventory_name?: string | null;
  price?: number | null;
  stock?: number | null;
};

type VariantLike = {
  variant_id?: number;
  variant_name?: string | null;
  inventories?: InventoryLike[] | null;
};

export const isDirectVariant = (variant?: VariantLike | null) => {
  if (!variant) return false;
  const name = `${variant.variant_name ?? ""}`.trim();
  return name.length === 0;
};

export const buildDirectVariantsPayload = ({
  variantId,
  inventoryId,
  price,
  stock,
}: {
  variantId?: number;
  inventoryId?: number;
  price: number;
  stock: number;
}) => [
  {
    ...(variantId ? { variant_id: variantId } : {}),
    variant_name: DIRECT_VARIANT_NAME,
    inventories: [
      {
        ...(inventoryId ? { inventory_id: inventoryId } : {}),
        inventory_name: DIRECT_INVENTORY_NAME,
        price,
        stock,
      },
    ],
  },
];

export const sanitizeVariantsPayload = (variants: VariantLike[] = []) =>
  variants
    .map((variant) => ({
      ...(variant.variant_id ? { variant_id: variant.variant_id } : {}),
      variant_name: `${variant.variant_name ?? ""}`.trim(),
      inventories: (variant.inventories ?? [])
        .map((inventory) => ({
          ...(inventory.inventory_id ? { inventory_id: inventory.inventory_id } : {}),
          inventory_name: `${inventory.inventory_name ?? ""}`.trim(),
          price: Number(inventory.price ?? 0),
          stock: Number(inventory.stock ?? 0),
        }))
        .filter(
          (inventory) =>
            inventory.inventory_name.length > 0 ||
            inventory.price > 0 ||
            inventory.stock > 0
        ),
    }))
    .filter(
      (variant) =>
        variant.variant_name.length > 0 || variant.inventories.length > 0
    );
