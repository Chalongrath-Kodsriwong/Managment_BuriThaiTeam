import type { ProductVariant } from "./variant.dto";

export type ProductFormValues = {
  name: string;
  brand: string;
  quality?: string;
  short_description: string;
  description: string;
  id_category: string;
  variants: ProductVariant[];
};
