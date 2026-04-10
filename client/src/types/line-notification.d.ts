export type LineTargetType = "USER" | "GROUP" | "ROOM";

export interface LineNotificationConfigItem {
  id: number;
  name: string;
  channel_access_token: string;
  target_type: LineTargetType;
  target_id: string;
  is_active: boolean;
  notify_new_order: boolean;
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
}
