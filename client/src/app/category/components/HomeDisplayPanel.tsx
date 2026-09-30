"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LoaderIcon, ImageIcon, Upload, Trash2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * ตั้งค่าหมวดหมู่ที่จะแสดงบนหน้าแรกของเว็บหลัก
 *
 * แสดงหมวดหมู่ทั้งหมด (รวมหมวดย่อย) พร้อมช่องค้นหาที่มี dropdown แนะนำคำใกล้เคียง
 */
type HomeCategory = {
  id_category: number;
  name: string | null;
  parent_id: number | null;
  parent_name: string | null;
  image_url: string | null;
  show_on_home: boolean;
  home_order: number | null;
  home_tagline: string | null;
  has_image: boolean;
  child_count: number;
  product_count: number;
};

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * ให้คะแนนความใกล้เคียงระหว่างคำค้นกับชื่อหมวด (ยิ่งมากยิ่งตรง · 0 = ไม่เข้าเลย)
 *
 * ไล่จากตรงที่สุดลงมา เพื่อให้ dropdown เรียงอันที่น่าจะใช่ไว้บนสุด
 *   3 = ขึ้นต้นตรงกัน  ·  2 = มีคำนี้อยู่ข้างใน  ·  1 = ตัวอักษรเรียงตามกัน (พิมพ์ตกหล่นก็ยังเจอ)
 */
function matchScore(name: string, q: string): number {
  const n = name.toLowerCase();
  const s = q.toLowerCase().trim();
  if (!s) return 0;
  if (n.startsWith(s)) return 3;
  if (n.includes(s)) return 2;

  // subsequence — พิมพ์ "recvcard" ก็ยังเจอ "Receiver card"
  let i = 0;
  for (const ch of n) {
    if (ch === s[i]) i++;
    if (i === s.length) return 1;
  }
  return 0;
}

export default function HomeDisplayPanel() {
  const [rows, setRows] = useState<HomeCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // ── ค้นหา ──
  // query = สิ่งที่พิมพ์อยู่ (ใช้ทำ dropdown) · applied = คำที่กด Enter/ปุ่มแล้ว (ใช้กรองจริง)
  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [openSuggest, setOpenSuggest] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  // เก็บ ref ของ input file แยกตามหมวด จะได้สั่งเปิดตัวที่ถูกต้อง
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/category/home-display`, {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "โหลดข้อมูลไม่สำเร็จ");
      setRows(json?.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const toggleShow = async (row: HomeCategory, next: boolean) => {
    // กันเปิดแสดงทั้งที่ยังไม่มีรูป — การ์ดจะโล่งบนหน้าแรก
    if (next && !row.has_image) {
      const ok = window.confirm(
        `"${row.name}" ยังไม่มีรูป ถ้าเปิดตอนนี้การ์ดบนหน้าแรกจะเป็นพื้นลายเปล่าๆ\n\nต้องการเปิดเลยหรือไม่?`
      );
      if (!ok) return;
    }

    setBusyId(row.id_category);
    setError(null);
    try {
      const res = await fetch(`${API}/category/${row.id_category}/home-display`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ show_on_home: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "บันทึกไม่สำเร็จ");

      setRows((prev) =>
        prev.map((r) =>
          r.id_category === row.id_category ? { ...r, show_on_home: next } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  /** บันทึกข้อความโปรโมท — เรียกตอน blur หรือกด Enter ไม่ยิงทุกตัวอักษรที่พิมพ์ */
  const saveTagline = async (row: HomeCategory, text: string) => {
    const next = text.trim();
    if (next === (row.home_tagline ?? "").trim()) return; // ไม่เปลี่ยนก็ไม่ต้องยิง

    setBusyId(row.id_category);
    setError(null);
    try {
      const res = await fetch(`${API}/category/${row.id_category}/home-display`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ home_tagline: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "บันทึกข้อความไม่สำเร็จ");

      setRows((prev) =>
        prev.map((r) =>
          r.id_category === row.id_category ? { ...r, home_tagline: next || null } : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกข้อความไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const uploadImage = async (row: HomeCategory, file: File) => {
    setBusyId(row.id_category);
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);

      const res = await fetch(`${API}/category/${row.id_category}/image`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "อัปโหลดรูปไม่สำเร็จ");

      const url: string | null = json?.data?.image_url ?? null;
      setRows((prev) =>
        prev.map((r) =>
          r.id_category === row.id_category
            ? { ...r, image_url: url, has_image: !!url }
            : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  const removeImage = async (row: HomeCategory) => {
    if (!window.confirm(`ลบรูปของ "${row.name}" ใช่หรือไม่?`)) return;

    setBusyId(row.id_category);
    setError(null);
    try {
      const res = await fetch(`${API}/category/${row.id_category}/image`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "ลบรูปไม่สำเร็จ");

      setRows((prev) =>
        prev.map((r) =>
          r.id_category === row.id_category
            ? { ...r, image_url: null, has_image: false }
            : r
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบรูปไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  // คลิกนอกกล่องค้นหาแล้วปิด dropdown
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpenSuggest(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const shownCount = rows.filter((r) => r.show_on_home).length;

  // รายการแนะนำใน dropdown — เรียงตามความใกล้เคียง เอา 8 อันแรกพอ
  const suggestions =
    query.trim().length === 0
      ? []
      : rows
          .map((r) => ({ row: r, score: matchScore(r.name ?? "", query) }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score || (a.row.name ?? "").localeCompare(b.row.name ?? ""))
          .slice(0, 8);

  // รายการที่แสดงจริง — กรองด้วยคำที่ "กดค้นหา" แล้วเท่านั้น
  const visibleRows =
    applied.trim().length === 0
      ? rows
      : rows
          .map((r) => ({ row: r, score: matchScore(r.name ?? "", applied) }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((x) => x.row);

  const runSearch = (value?: string) => {
    const term = value !== undefined ? value : query;
    setQuery(term);
    setApplied(term);
    setOpenSuggest(false);
  };

  const clearSearch = () => {
    setQuery("");
    setApplied("");
    setOpenSuggest(false);
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <CardTitle className="text-xl">หมวดหมู่ที่แสดงบนหน้าแรก</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              เปิดไว้ <span className="font-semibold text-blue-700">{shownCount}</span> หมวด
              จากทั้งหมด {rows.length} หมวด · แนะนำ 4 หมวดเพื่อให้เรียงพอดีหนึ่งแถวบนหน้าแรก
            </p>
          </div>

          {/* ── ช่องค้นหา ── */}
          <div ref={boxRef} className="relative w-full lg:w-[380px] shrink-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={query}
                  placeholder="ค้นหาหมวดหมู่..."
                  className="h-11 border-2 border-gray-300 pl-9 pr-9 text-base focus-visible:border-blue-500"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setOpenSuggest(true);
                  }}
                  onFocus={() => setOpenSuggest(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      runSearch();
                    } else if (e.key === "Escape") {
                      setOpenSuggest(false);
                    }
                  }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="ล้างคำค้นหา"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Button type="button" className="h-11 px-5" onClick={() => runSearch()}>
                <Search className="mr-1 h-4 w-4" /> ค้นหา
              </Button>
            </div>

            {/* dropdown คำใกล้เคียง */}
            {openSuggest && suggestions.length > 0 && (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-xl">
                {suggestions.map(({ row }) => (
                  <button
                    key={row.id_category}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runSearch(row.name ?? "")}
                    className="flex w-full items-center gap-2 border-b px-3 py-2 text-left last:border-0 hover:bg-blue-50"
                  >
                    <Search className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {row.name}
                    </span>
                    {row.parent_name && (
                      <span className="shrink-0 text-[11px] text-gray-400">
                        ใน {row.parent_name}
                      </span>
                    )}
                    {row.show_on_home && (
                      <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        เปิดอยู่
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {openSuggest && query.trim() && suggestions.length === 0 && (
              <div className="absolute z-30 mt-1 w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500 shadow-xl">
                ไม่พบหมวดหมู่ที่ใกล้เคียง
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border-2 border-red-400 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
            <LoaderIcon className="h-5 w-5 animate-spin" /> กำลังโหลด...
          </div>
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            ยังไม่มีหมวดหมู่ — สร้างหมวดหมู่ก่อน
          </p>
        ) : visibleRows.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-gray-500">
              ไม่พบหมวดหมู่ที่ตรงกับ &ldquo;{applied}&rdquo;
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={clearSearch}>
              ล้างคำค้นหา
            </Button>
          </div>
        ) : (
          <>
            {applied && (
              <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
                <span>
                  ผลการค้นหา &ldquo;<span className="font-semibold">{applied}</span>&rdquo; ·{" "}
                  {visibleRows.length} หมวด
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={clearSearch}>
                  <X className="mr-1 h-3.5 w-3.5" /> ล้าง
                </Button>
              </div>
            )}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleRows.map((row) => {
              const busy = busyId === row.id_category;
              return (
                <div
                  key={row.id_category}
                  className={`flex gap-3 rounded-lg border p-3 transition-colors ${
                    row.show_on_home
                      ? "border-blue-300 bg-blue-50/40"
                      : "border-gray-200 bg-gray-50/60"
                  }`}
                >
                  {/* รูปตัวอย่าง */}
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md border bg-white">
                    {row.image_url ? (
                      <Image
                        src={row.image_url}
                        alt={row.name ?? ""}
                        fill
                        sizes="96px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-400">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-[10px]">ยังไม่มีรูป</span>
                      </div>
                    )}
                    {busy && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                        <LoaderIcon className="h-5 w-5 animate-spin text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* รายละเอียด + ปุ่ม */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{row.name}</p>
                        <p className="truncate text-[11px] text-gray-500">
                          {row.parent_name ? `หมวดย่อยของ ${row.parent_name}` : "หมวดหมู่หลัก"}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          สินค้า {row.product_count} · หมวดย่อย {row.child_count}
                        </p>
                      </div>
                      <Switch
                        checked={row.show_on_home}
                        disabled={busy}
                        onCheckedChange={(next) => toggleShow(row, next)}
                        aria-label={`แสดง ${row.name} บนหน้าแรก`}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <input
                        ref={(el) => {
                          fileInputs.current[row.id_category] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(row, file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => fileInputs.current[row.id_category]?.click()}
                      >
                        <Upload className="mr-1 h-3.5 w-3.5" />
                        {row.has_image ? "เปลี่ยนรูป" : "อัปโหลดรูป"}
                      </Button>

                      {row.has_image && (
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={busy}
                          onClick={() => removeImage(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* ข้อความโปรโมทสั้นๆ ที่จะโชว์ในแผงหมวดหมู่หน้าแรก */}
                    <div className="mt-2">
                      <Input
                        defaultValue={row.home_tagline ?? ""}
                        placeholder="ข้อความโปรโมทสั้นๆ (ไม่ใส่ก็ได้)"
                        maxLength={120}
                        disabled={busy}
                        className="h-8 text-xs"
                        onBlur={(e) => saveTagline(row, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                      />
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        กด Enter หรือคลิกนอกช่องเพื่อบันทึก
                      </p>
                    </div>

                    {row.show_on_home && !row.has_image && (
                      <p className="mt-1.5 text-[11px] font-semibold text-amber-600">
                        ⚠️ เปิดแสดงแล้วแต่ยังไม่มีรูป การ์ดจะเป็นพื้นลายเปล่า
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
