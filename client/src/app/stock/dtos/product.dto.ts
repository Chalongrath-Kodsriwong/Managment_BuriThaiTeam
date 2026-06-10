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
  direct_preorder_discount?: number | null;
  direct_preorder_release_date?: string | null;
  spec_table?: ProductSpecTable | null;
  variants: ProductVariant[];
};
