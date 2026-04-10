"use client";

import * as React from "react";
import { SidebarComponent } from "@/app/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import DeleteButton from "@/components/deleteButton";
import { LoaderIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  LineNotificationConfigItem,
  LineNotificationListResponse,
  LineNotificationPayload,
  LineTargetType,
} from "@/types/line-notification";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const defaultForm: LineNotificationPayload = {
  name: "",
  channel_access_token: "",
  target_type: "USER",
  target_id: "",
  is_active: true,
  notify_new_order: true,
};

export default function LineNotificationPage() {
  const [configs, setConfigs] = React.useState<LineNotificationConfigItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<LineNotificationPayload>(defaultForm);
  const [testMessage, setTestMessage] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  const fetchConfigs = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/line-notification`, {
        credentials: "include",
      });
      const data: LineNotificationListResponse = await res.json();

      if (!res.ok) {
        throw new Error((data as { message?: string }).message || "Load failed");
      }

      setConfigs(data.data);
    } catch (err) {
      console.error(err);
      setError("Load LINE notification configs failed");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const resetForm = React.useCallback(() => {
    setEditingId(null);
    setForm(defaultForm);
  }, []);

  const handleEdit = React.useCallback((item: LineNotificationConfigItem) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      channel_access_token: "",
      target_type: item.target_type,
      target_id: item.target_id,
      is_active: item.is_active,
      notify_new_order: item.notify_new_order,
    });
    setSuccess("");
    setError("");
  }, []);

  const handleChange = <K extends keyof LineNotificationPayload>(
    key: K,
    value: LineNotificationPayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = editingId
        ? `${API_URL}/line-notification/${editingId}`
        : `${API_URL}/line-notification`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(data.message || "Save failed");
      }

      setSuccess(
        editingId
          ? "Updated LINE notification config successfully"
          : "Created LINE notification config successfully"
      );
      resetForm();
      setSelectedIds([]);
      await fetchConfigs();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_URL}/line-notification/test`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMessage }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
        throw new Error(data.message || "Test failed");
      }

      setSuccess("Sent LINE test notification successfully");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Test failed");
    } finally {
      setTesting(false);
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <SidebarComponent>
      <div className="px-5 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">LINE Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>หน้านี้ใช้ตั้งค่า LINE Messaging API สำหรับแจ้งเตือนเมื่อมี Order ใหม่</p>
            <p>ถ้าแก้ไข config เดิมโดยไม่กรอก token ใหม่ ระบบจะใช้ token เดิมต่อ</p>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit Config" : "Create Config"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="line-name">Config Name</Label>
                <Input
                  id="line-name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Primary LINE Bot"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="line-token">Channel Access Token</Label>
                <Textarea
                  id="line-token"
                  value={form.channel_access_token}
                  onChange={(e) =>
                    handleChange("channel_access_token", e.target.value)
                  }
                  placeholder={
                    editingId
                      ? "Leave blank to keep the current token"
                      : "Paste LINE channel access token"
                  }
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Target Type</Label>
                  <Select
                    value={form.target_type}
                    onValueChange={(value: LineTargetType) =>
                      handleChange("target_type", value)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select target type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">USER</SelectItem>
                      <SelectItem value="GROUP">GROUP</SelectItem>
                      <SelectItem value="ROOM">ROOM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line-target-id">Target ID</Label>
                  <Input
                    id="line-target-id"
                    value={form.target_id}
                    onChange={(e) => handleChange("target_id", e.target.value)}
                    placeholder="Uxxxx / Cxxxx / Rxxxx"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => handleChange("is_active", checked)}
                  />
                  <Label>Set as active config</Label>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={form.notify_new_order}
                    onCheckedChange={(checked) =>
                      handleChange("notify_new_order", checked)
                    }
                  />
                  <Label>Notify new order</Label>
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              {success && <p className="text-sm text-green-600">{success}</p>}

              <div className="flex flex-wrap gap-3">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <LoaderIcon className="h-4 w-4 animate-spin" /> : null}
                  {editingId ? "Update Config" : "Create Config"}
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={saving}>
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Notification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="line-test-message">Message</Label>
                <Textarea
                  id="line-test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Leave blank to use the default test message"
                />
              </div>

              <Button onClick={handleTest} disabled={testing}>
                {testing ? <LoaderIcon className="h-4 w-4 animate-spin" /> : null}
                Send Test Message
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Saved Configs</CardTitle>
            <DeleteButton
              endpoint="line-notification"
              ids={selectedIds}
              confirmMessage="ต้องการลบ LINE config ที่เลือกหรือไม่?"
              disabled={selectedIds.length === 0}
              onSuccess={async () => {
                setSelectedIds([]);
                if (editingId && selectedIds.includes(editingId)) {
                  resetForm();
                }
                await fetchConfigs();
              }}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center py-10">
                <LoaderIcon className="h-10 w-10 animate-spin" />
                <p>Loading data...</p>
              </div>
            ) : configs.length === 0 ? (
              <div className="rounded-md border p-6 text-sm text-muted-foreground">
                ยังไม่มี LINE notification config
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left">Select</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Target</th>
                      <th className="p-3 text-left">Token</th>
                      <th className="p-3 text-left">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelected(item.id)}
                          />
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            className="text-left text-blue-600 hover:underline"
                            onClick={() => handleEdit(item)}
                          >
                            {item.name}
                          </button>
                          {item.is_active ? (
                            <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                              active
                            </span>
                          ) : null}
                        </td>
                        <td className="p-3">
                          <div>{item.target_type}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.target_id}
                          </div>
                        </td>
                        <td className="p-3">
                          {"*".repeat(Math.max(8, item.channel_access_token.length > 12 ? 12 : item.channel_access_token.length))}
                        </td>
                        <td className="p-3">
                          <div>{item.notify_new_order ? "new order on" : "new order off"}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarComponent>
  );
}
