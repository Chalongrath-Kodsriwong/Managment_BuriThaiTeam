export interface OrderResponse {
  status: string;
  data: PaginatedOrders;
}

export interface PaginatedOrders {
  page: number;
  limit: number;
  total: number;
  data: OrdersData;
}

export interface OrdersData {
  totalOrders: number;
  pendingOrdersCount: number;
  deliveryCount: number;
  completeCount: number;
  orders: OrderDetails[];
}

/** สินค้าแต่ละรายการในออเดอร์ ใช้ตอนกางดูในตาราง */
export interface OrderItemDetail {
  id_orderitem: number;
  product_id: number;
  name: string;
  image_url: string | null;
  variant_name: string | null;
  inventory_name: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_preorder: boolean;
}

export interface OrderDetails {
  id_order: number;
  created_at: string;
  status: "pending" | "confirmed" | "checking"  | "success" | "canceled";
  user: OrderUser;
  order_items_count: number;
  order_items: OrderItemDetail[];
  dynamic_total_price: number;
  payment: OrderPayment | null;
  tracking_number: string | null;
  shipping_fee: number;
}

export interface OrderUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
}

export interface OrderPayment {
  payment_id?: string;            
  payment_method: string;
  payload_id: string | null;      
  created_at?: string;
  amount: number;
  slip_img: PaymentSlipImage | null;
}

export interface PaymentSlipImage {
  url: string;
  payer_name_th: string;
  amount: string;
  bank_name: string;
  bank_code: string;
  transferred_at: string;
}

export type OrderInterface = {
  sku: string;
  customerName: string;
  orderDate: string;
  quantity: number;
  totalAmount: number;
  tracking_number: string;
  paymentMethod?: string;
  paymentAmount?: number;
  paymentPayloadId?: string | null;
  paymentStatus: "pending" | "confirmed" | "checking"  | "success" | "canceled";
  slipImage: PaymentSlipImage | null;
  items: OrderItemDetail[];
};
