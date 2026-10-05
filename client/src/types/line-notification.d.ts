export type LineTargetType = "USER" | "GROUP" | "ROOM";

export interface LineNotificationConfigItem {
  id: number;
  name: string;
  channel_access_token: string;
  target_type: LineTargetType;
  target_id: string;
  is_active: boolean;
  notify_new_order: boolean;
  notify_payment: boolean;
  created_at: string;
  updated_at: string;
}

export interface LineNotificationListResponse {
  status: "success" | "error";
  data: LineNotificationConfigItem[];
}

export interface LineNotificationSingleResponse {
  status: "success" | "error";
  data: LineNotificationConfigItem | null;
}

export interface LineNotificationPayload {
  name: string;
  channel_access_token: string;
  target_type: LineTargetType;
  target_id: string;
  is_active: boolean;
  notify_new_order: boolean;
  notify_payment: boolean;
}

/** ปลายทางจริงที่จะได้รับแจ้งเตือน รวมที่มาจาก env ไม่ใช่แค่ในฐานข้อมูล */
export interface LineDeliveryTargetItem {
  /** null = ปลายทางที่ตั้งไว้ในเซิร์ฟเวอร์ แก้จากหน้าเว็บไม่ได้ */
  config_id: number | null;
  name: string;
  source: "database" | "env";
  target_type: LineTargetType;
  target_id: string;
  notify_new_order: boolean;
  notify_payment: boolean;
  display_name: string | null;
  picture_url: string | null;
  member_count: number | null;
  reachable: boolean;
  error?: string;
}

export interface LineDeliveryTargetsResponse {
  status: "success" | "error";
  data: LineDeliveryTargetItem[];
}

/** คน/กลุ่มที่เคยทักเข้ามาหาบัญชี LINE ของร้าน */
export interface LineKnownSourceItem {
  id: number;
  source_type: LineTargetType;
  source_id: string;
  display_name: string | null;
  picture_url: string | null;
  seen_count: number;
  last_seen_at: string;
  is_target: boolean;
}

export interface LineKnownSourcesResponse {
  status: "success" | "error";
  data: LineKnownSourceItem[];
}
