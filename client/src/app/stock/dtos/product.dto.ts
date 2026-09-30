import type { ProductVariant } from "./variant.dto";
import type { ProductSpecTable } from "./spec-table.dto";

export type ProductFormValues = {
  name: string;
  brand: string;
  quality?: string;
  short_description: string;
  description: string;
  id_category: string;
  direct_price?: number;
  direct_stock?: number;
  direct_purchase_mode?: string;
  /** ส่วนลดปกติ % — ใช้ได้ทุกโหมดการขาย รวมถึง "สั่งซื้อเลยเท่านั้น" */
  direct_regular_discount?: number | null;
  /** วันสิ้นสุดส่วนลดปกติ — ว่าง = ไม่มีกำหนด */
  direct_regular_discount_end_date?: string | null;
  direct_preorder_discount?: number | null;
  direct_preorder_release_date?: string | null;
  spec_table?: ProductSpecTable | null;
  variants: ProductVariant[];
};
