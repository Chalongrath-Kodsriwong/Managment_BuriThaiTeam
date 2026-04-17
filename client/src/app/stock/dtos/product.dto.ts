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
  spec_table?: ProductSpecTable | null;
  variants: ProductVariant[];
};
