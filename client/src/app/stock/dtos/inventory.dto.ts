export type PurchaseMode = "normal" | "preorder_only" | "both";

export type Inventory = {
  inventory_id?: number;
  inventory_name: string;
  price: number;
  stock: number;
  purchase_mode?: PurchaseMode;
  preorder_discount?: number | null;
  preorder_release_date?: string | null;
};

export type ProductImage = {
  img_id: number;
  url: string;
  type: "cover" | "slide";
  is_cover: boolean;
  created_at: string;
  updated_at: string;
};