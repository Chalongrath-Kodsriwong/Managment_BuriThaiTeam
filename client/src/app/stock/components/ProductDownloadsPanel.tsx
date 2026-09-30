"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoaderIcon, Upload, Trash2, Link2, FileDown, Pencil, Check, X } from "lucide-react";

/**
 * จัดการไฟล์ดาวน์โหลดของสินค้า — RCG / Software Config / Document
 *
 * แต่ละช่องใส่ได้ทั้ง "อัปโหลดไฟล์" และ "ลิงก์ภายนอก"
 * และใส่ได้มากกว่า 1 ไฟล์ต่อช่อง (เช่น RCG หลายรุ่น)
 */
type DownloadRow = {
  id: number;
  kind: string;
  label: string | null;
  url: string;
  is_uploaded: boolean;
};

const API = process.env.NEXT_PUBLIC_API_URL;

const KINDS = [
  { key: "rcg", title: "RCG", hint: "Receiver Card Generic — ไฟล์ตั้งค่าการ์ดรับสัญญาณ" },
  { key: "software", title: "Software Config", hint: "โปรแกรมตั้งค่าจอ" },
  { key: "document", title: "Document", hint: "คู่มือ / สเปก (PDF)" },
] as const;

export default function ProductDownloadsPanel({ productId }: { productId: string }) {
  const [rows, setRows] = useState<DownloadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ค่าที่กำลังกรอกของแต่ละช่อง (label + url) แยกตาม kind
  const [draft, setDraft] = useState<Record<string, { label: string; url: string }>>({
    rcg: { label: "", url: "" },
    software: { label: "", url: "" },
    document: { label: "", url: "" },
  });

  // แถวที่กำลังแก้ชื่อ + ข้อความที่พิมพ์อยู่
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/products/${productId}/downloads`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "โหลดรายการไฟล์ไม่สำเร็จ");
      setRows(json?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดรายการไฟล์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) fetchRows();
  }, [productId, fetchRows]);

  const submit = async (kind: string, file?: File) => {
    const d = draft[kind] ?? { label: "", url: "" };
    if (!file && !d.url.trim()) {
      setError("ต้องแนบไฟล์ หรือใส่ลิงก์อย่างใดอย่างหนึ่ง");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("kind", kind);
      if (d.label.trim()) form.append("label", d.label.trim());
      if (file) form.append("file", file);
      else form.append("url", d.url.trim());

      const res = await fetch(`${API}/products/${productId}/downloads`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "เพิ่มไฟล์ไม่สำเร็จ");

      setRows((prev) => [...prev, json.data]);
      setDraft((prev) => ({ ...prev, [kind]: { label: "", url: "" } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "เพิ่มไฟล์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  /** เปลี่ยนชื่อบนปุ่มของไฟล์ที่เพิ่มไปแล้ว — ใช้ได้ทั้งไฟล์อัปโหลดและลิงก์ */
  const saveLabel = async (row: DownloadRow) => {
    const next = editLabel.trim();
    if (next === (row.label ?? "")) {
      setEditingId(null);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API}/products/downloads/${row.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "เปลี่ยนชื่อไม่สำเร็จ");
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, label: json.data.label } : r)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เปลี่ยนชื่อไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: DownloadRow) => {
    if (!window.confirm(`ลบไฟล์นี้ออกจากสินค้า?\n${row.label || row.url}`)) return;

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API}/products/downloads/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "ลบไฟล์ไม่สำเร็จ");
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไฟล์ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">ไฟล์ดาวน์โหลดของสินค้า</CardTitle>
        <p className="text-sm text-muted-foreground">
          ไฟล์เหล่านี้จะขึ้นเป็นตารางให้ลูกค้าโหลดในหน้ารายละเอียดสินค้า —
          ใส่ได้ทั้งอัปโหลดไฟล์และลิงก์ภายนอก และใส่ได้มากกว่า 1 ไฟล์ต่อช่อง
        </p>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
            <LoaderIcon className="h-5 w-5 animate-spin" /> กำลังโหลด...
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {KINDS.map((k) => {
              const files = rows.filter((r) => r.kind === k.key);
              const d = draft[k.key] ?? { label: "", url: "" };

              return (
                <div key={k.key} className="rounded-lg border bg-gray-50/60 p-3">
                  <p className="font-semibold">{k.title}</p>
                  <p className="mb-2 text-[11px] text-gray-500">{k.hint}</p>

                  {/* ไฟล์ที่มีแล้ว */}
                  {files.length > 0 ? (
                    <ul className="mb-3 space-y-1.5">
                      {files.map((f) => (
                        <li
                          key={f.id}
                          className="flex items-center gap-2 rounded border bg-white px-2 py-1.5"
                        >
                          {f.is_uploaded ? (
                            <FileDown className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                          ) : (
                            <Link2 className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                          )}
                          {editingId === f.id ? (
                            <>
                              <Input
                                autoFocus
                                value={editLabel}
                                placeholder="ชื่อบนปุ่ม"
                                className="h-7 min-w-0 flex-1 text-xs"
                                disabled={busy}
                                onChange={(e) => setEditLabel(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    saveLabel(f);
                                  }
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                              />
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => saveLabel(f)}
                                className="shrink-0 rounded p-1 text-green-600 hover:bg-green-50"
                                aria-label="บันทึกชื่อ"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => setEditingId(null)}
                                className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100"
                                aria-label="ยกเลิก"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <a
                                href={f.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`min-w-0 flex-1 truncate text-xs hover:underline ${
                                  f.label ? "text-blue-700" : "italic text-gray-400"
                                }`}
                                title={f.url}
                              >
                                {f.label || "(ยังไม่ตั้งชื่อปุ่ม)"}
                              </a>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                  setEditingId(f.id);
                                  setEditLabel(f.label ?? "");
                                }}
                                className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100"
                                aria-label="เปลี่ยนชื่อปุ่ม"
                                title="เปลี่ยนชื่อบนปุ่ม"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => remove(f)}
                                className="shrink-0 rounded p-1 text-red-600 hover:bg-red-50"
                                aria-label="ลบไฟล์"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mb-3 text-xs text-gray-400">ยังไม่มีไฟล์</p>
                  )}

                  {/* เพิ่มใหม่ — ชื่อบนปุ่มใช้กับทั้ง 2 วิธี (อัปโหลดไฟล์ / ลิงก์) */}
                  <div className="rounded-md border border-dashed bg-white p-2.5">
                    <label className="mb-1 block text-[11px] font-semibold text-gray-700">
                      ① ชื่อบนปุ่ม
                      <span className="ml-1 font-normal text-gray-400">
                        ใช้ได้ทั้งไฟล์ที่อัปโหลดและลิงก์
                      </span>
                    </label>
                    <Input
                      value={d.label}
                      placeholder="เช่น MRV-412 (ไม่ใส่ก็ได้)"
                      className="mb-2.5 h-8 text-xs"
                      disabled={busy}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, [k.key]: { ...d, label: e.target.value } }))
                      }
                    />

                    <p className="mb-1 text-[11px] font-semibold text-gray-700">
                      ② เลือกไฟล์ หรือวางลิงก์
                    </p>

                    <div className="flex gap-1.5">
                      <Input
                        value={d.url}
                        placeholder="วางลิงก์ https://..."
                        className="h-8 flex-1 text-xs"
                        disabled={busy}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, [k.key]: { ...d, url: e.target.value } }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            submit(k.key);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 shrink-0"
                        disabled={busy || !d.url.trim()}
                        onClick={() => submit(k.key)}
                      >
                        เพิ่ม
                      </Button>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">หรือ</span>
                      <input
                      ref={(el) => {
                        fileInputs.current[k.key] = el;
                      }}
                        type="file"
                        className="hidden"
                        accept=".zip,.rar,.7z,.pdf,.rcfgx,.rcfg,.ncp,.txt,.csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) submit(k.key, file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8"
                        disabled={busy}
                        onClick={() => fileInputs.current[k.key]?.click()}
                      >
                        <Upload className="mr-1 h-3.5 w-3.5" /> อัปโหลดไฟล์
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-[11px] text-gray-500">
          รองรับไฟล์ .zip .rar .7z .pdf .rcfgx .rcfg .ncp .txt .csv (ไม่เกิน 50MB) —
          ไม่รับไฟล์โปรแกรม .exe เพื่อความปลอดภัย ถ้าจำเป็นให้บีบเป็น .zip ก่อน
        </p>
      </CardContent>
    </Card>
  );
}
