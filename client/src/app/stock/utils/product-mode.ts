export const DIRECT_VARIANT_NAME = "";
export const DIRECT_INVENTORY_NAME = "No Inventory";

export type ProductInputMode = "variant" | "direct";

type InventoryLike = {
  inventory_id?: number;
  inventory_name?: string | null;
  price?: number | null;
  stock?: number | null;
  purchase_mode?: string | null;
  preorder_discount?: number | null;
  preorder_release_date?: string | null;
  regular_discount?: number | null;
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
  purchaseMode,
  preorderDiscount,
  preorderReleaseDate,
  regularDiscount,
}: {
  variantId?: number;
  inventoryId?: number;
  price: number;
  stock: number;
  purchaseMode?: string;
  preorderDiscount?: number | null;
  preorderReleaseDate?: string | null;
  regularDiscount?: number | null;
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
        purchase_mode: purchaseMode ?? "normal",
        preorder_discount: preorderDiscount ?? null,
        preorder_release_date: preorderReleaseDate ?? null,
        regular_discount: regularDiscount ?? null,
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
          purchase_mode: inventory.purchase_mode ?? "normal",
          preorder_discount: inventory.preorder_discount ?? null,
          preorder_release_date: inventory.preorder_release_date ?? null,
          regular_discount: inventory.regular_discount ?? null,
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
