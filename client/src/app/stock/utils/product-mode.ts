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
  regular_discount_end_date?: string | null;
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
  regularDiscountEndDate,
}: {
  variantId?: number;
  inventoryId?: number;
  price: number;
  stock: number;
  purchaseMode?: string;
  preorderDiscount?: number | null;
  preorderReleaseDate?: string | null;
  regularDiscount?: number | null;
  regularDiscountEndDate?: string | null;
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
        regular_discount_end_date: regularDiscountEndDate || null,
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
          regular_discount_end_date: inventory.regular_discount_end_date ?? null,
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

/**
 * คำอธิบายว่า "โหมดการขาย" แต่ละแบบ ลูกค้าจะเห็นอะไรบนหน้าเว็บเมื่อสต็อก = 0
 * ใช้โชว์ใต้ปุ่มเลือกโหมด เพื่อให้คนดูแลสต็อกตัดสินใจได้โดยไม่ต้องเดา
 */
export const purchaseModeHint = (mode?: string | null) => {
  switch (mode) {
    case "preorder_only":
      return "ลูกค้าสั่งจองล่วงหน้าได้อย่างเดียว (ไม่สนใจจำนวนสต็อก) หน้าเว็บจะขึ้นราคา Preorder ตลอด";
    case "both":
      return "มีของ = ซื้อได้ทันที · ของหมด = หน้าเว็บขึ้นป้าย SOLD OUT สีแดง + \"ยังสั่งจองล่วงหน้าได้\" ลูกค้ากดเข้าไป Preorder ต่อได้";
    default:
      return "ขายเฉพาะของที่มีในคลัง · ของหมด = หน้าเว็บขึ้นป้าย SOLD OUT สีเทา รูปเป็นขาวดำ และลูกค้าสั่งซื้อไม่ได้";
  }
};

/** ของหมดแล้วยังสั่งจองได้หรือไม่ (ใช้ตัดสินสถานะในตาราง Stock) */
export const canPreorderWhenEmpty = (mode?: string | null) =>
  mode === "both" || mode === "preorder_only";
