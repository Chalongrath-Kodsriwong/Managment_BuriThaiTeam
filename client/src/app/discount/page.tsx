"use client";

import React, { useEffect, useState, useCallback } from "react";
import { SidebarComponent } from "../components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderIcon, Tag } from "lucide-react";
import Image from "next/image";
import { StockResponse } from "@/types/stock.d";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/* ─── Types ─── */
type InvItem = {
  inventory_id: number;
  inventory_name: string;
  price: number;
  stock: number;
  purchase_mode?: string;
  preorder_discount?: number | null;
  regular_discount?: number | null;
};

type VariantItem = {
  variant_id: number;
  variant_name: string;
  inventories: InvItem[];
};

type ProductItem = {
  id_products: number;
  name: string;
  quality?: string;
  category?: { name: string };
  images?: { img_id: string; url: string; type: string }[];
  variants: VariantItem[];
};

type Campaign = {
  campaign_id: string;
  name: string;
  discountType: string;
  discountValue: number;
  isActive: boolean;
  targets: { targetType: string; targetId: number | null }[];
};

type DiscountState = {
  selectedId: number | "all";
  inputValue: string;
  saving: boolean;
  error?: string;
  campaignId?: string;
  campaignValue: string;
  inventoryValues: Record<number, string>;
};

/* ─── Helpers ─── */
function getAllInventories(product: ProductItem): InvItem[] {
  return product.variants.flatMap((v) => v.inventories);
}

function formatPrice(price: number) {
  return `฿ ${Math.round(price).toLocaleString()}`;
}

type PreorderInfo = { name: string; pct: number; orig: number; discounted: number };

function getPreorderInfoList(product: ProductItem): PreorderInfo[] {
  return getAllInventories(product)
    .filter(
      (i) =>
        (i.purchase_mode === "preorder_only" || i.purchase_mode === "both") &&
        i.preorder_discount != null &&
        Number(i.preorder_discount) > 0 &&
        Number(i.price) > 0
    )
    .map((i) => ({
      name: i.inventory_name || "ไม่มีชื่อ",
      pct: Number(i.preorder_discount),
      orig: Number(i.price),
      discounted: Math.round(Number(i.price) * (1 - Number(i.preorder_discount) / 100)),
    }));
}

/* ─── ProductCard ─── */
function ProductCard({
  product,
  state,
  onSelectInventory,
  onInputChange,
  onSave,
  onReset,
}: {
  product: ProductItem;
  state: DiscountState;
  onSelectInventory: (id: number | "all") => void;
  onInputChange: (val: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const imgUrl = product.images?.[0]?.url ?? "/image/logo_white.jpeg";
  const allInvs = getAllInventories(product);
  const pct = Number(state.inputValue);
  const showPreview = pct > 0;
  const preorderList = getPreorderInfoList(product);

  const selectedLabel =
    state.selectedId === "all"
      ? "ใช้กับทุกตัวเลือก"
      : allInvs.find((i) => i.inventory_id === state.selectedId)?.inventory_name || "ไม่มีชื่อ";

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
      {/* Image */}
      <div className="relative w-full aspect-square bg-gray-100">
        <Image
          src={imgUrl}
          alt={product.name}
          fill
          className="object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/image/logo_white.jpeg";
          }}
        />
        {state.campaignValue && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
            ทั้งหมด -{state.campaignValue}%
          </span>
        )}
        {Object.values(state.inventoryValues).some((v) => !!v) && (
          <span className="absolute top-2 right-2 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
            รายตัว
          </span>
        )}
        {preorderList.length > 0 && (
          <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
            PREORDER ลด {preorderList[0].pct}%
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col gap-3 flex-1">
        {/* Name */}
        <p className="text-[11px] font-semibold line-clamp-2 leading-snug min-h-[2.2rem]">
          {product.name}
        </p>
        {product.category?.name && (
          <p className="text-[10px] text-muted-foreground -mt-2">{product.category.name}</p>
        )}

        {/* ─── Inventory selector ─── */}
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide px-2.5 pt-2 pb-1">
            ราคาปกติ
          </p>

          <div className="max-h-[160px] overflow-y-auto divide-y divide-gray-100">
            {/* ทั้งหมด */}
            <button
              type="button"
              onClick={() => onSelectInventory("all")}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 text-left transition-colors ${
                state.selectedId === "all" ? "bg-orange-50" : "hover:bg-gray-50"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  state.selectedId === "all" ? "border-orange-500" : "border-gray-300"
                }`}
              >
                {state.selectedId === "all" && (
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                )}
              </span>
              <span className="flex-1 text-[11px] font-semibold text-gray-700">ทั้งหมด</span>
              {state.campaignValue && (
                <span className="text-[10px] font-bold text-orange-500">
                  -{state.campaignValue}%
                </span>
              )}
            </button>

            {/* individual inventories */}
            {allInvs.map((inv) => {
              const savedVal = state.inventoryValues[inv.inventory_id];
              const discountedPrice = savedVal
                ? Math.round(inv.price * (1 - Number(savedVal) / 100))
                : null;
              const isSelected = state.selectedId === inv.inventory_id;
              return (
                <button
                  key={inv.inventory_id}
                  type="button"
                  onClick={() => onSelectInventory(inv.inventory_id)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 text-left transition-colors ${
                    isSelected ? "bg-orange-50" : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      isSelected ? "border-orange-500" : "border-gray-300"
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                  </span>
                  <span className="flex-1 text-[10px] text-gray-600 truncate">
                    {inv.inventory_name || "ไม่มีชื่อ"}
                  </span>
                  <div className="text-right flex-shrink-0">
                    {savedVal ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-400 line-through">
                          {formatPrice(inv.price)}
                        </span>
                        <span className="text-[10px] font-bold text-orange-500">
                          {formatPrice(discountedPrice!)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-700">
                        {formatPrice(inv.price)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Preorder info (read-only) ─── */}
        {preorderList.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 space-y-1">
            <p className="text-[9px] font-semibold text-blue-400 uppercase tracking-wide">
              Preorder <span className="normal-case font-normal text-blue-300">(ตั้งค่าจาก Stock Management)</span>
            </p>
            {preorderList.map((p, i) => (
              <div key={i} className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-blue-600 truncate flex-1">{p.name}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[9px] text-blue-300 line-through">{formatPrice(p.orig)}</span>
                  <span className="text-[10px] font-bold text-blue-700">{formatPrice(p.discounted)}</span>
                  <span className="text-[9px] bg-blue-100 text-blue-600 px-1 rounded">-{p.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Input + Save ─── */}
        <div className="space-y-1.5">
          <p className="text-[9px] text-gray-400 font-medium">
            ส่วนลดราคาปกติ{" "}
            <span className="text-orange-500 font-semibold">({selectedLabel})</span>
          </p>

          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Input
                type="number"
                min={0}
                max={99}
                value={state.inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="0"
                className="pr-6 text-sm"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">
                %
              </span>
            </div>
            <Button
              size="sm"
              onClick={onSave}
              disabled={state.saving}
              className="bg-gray-900 hover:bg-gray-700 text-white px-3 text-xs"
            >
              {state.saving ? <LoaderIcon className="w-3 h-3 animate-spin" /> : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReset}
              disabled={state.saving}
              className="border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600 px-3 text-xs"
            >
              Reset
            </Button>
          </div>

          {/* Real-time preview */}
          {showPreview && state.selectedId !== "all" &&
            (() => {
              const inv = allInvs.find((i) => i.inventory_id === state.selectedId);
              if (!inv) return null;
              return (
                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="text-gray-400 line-through">{formatPrice(inv.price)}</span>
                  <span className="font-bold text-orange-500">
                    → {formatPrice(Math.round(inv.price * (1 - pct / 100)))}
                  </span>
                </div>
              );
            })()}

          {showPreview && state.selectedId === "all" &&
            (() => {
              const prices = allInvs.map((i) => i.price).filter((p) => p > 0);
              if (prices.length === 0) return null;
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              const dMin = Math.round(min * (1 - pct / 100));
              const dMax = Math.round(max * (1 - pct / 100));
              return (
                <p className="text-[10px] text-orange-500 font-semibold">
                  {min === max
                    ? formatPrice(dMin)
                    : `${formatPrice(dMin)} – ${formatPrice(dMax)}`}
                </p>
              );
            })()}

          {state.selectedId === "all" && allInvs.length > 0 && (
            <p className="text-[9px] text-amber-500 leading-tight">
              ⚠️ Save จะล้างส่วนลดรายตัวทั้งหมดแล้วใช้ % นี้แทน
            </p>
          )}

          {state.error && <p className="text-[10px] text-red-500">{state.error}</p>}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function DiscountPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [discounts, setDiscounts] = useState<Record<number, DiscountState>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, campRes] = await Promise.all([
        fetch(`${API_URL}/products/stocks?page=${page}&limit=${limit}&search=${search}`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/discounts/campaigns`, { credentials: "include" }),
      ]);

      const prodJson: StockResponse = await prodRes.json();
      const campsJson = await campRes.json().catch(() => ({ data: [] }));
      const camps: Campaign[] = Array.isArray(campsJson) ? campsJson : (campsJson.data ?? []);

      const prods = (prodJson.data?.data ?? []) as ProductItem[];
      setTotal(prodJson.data?.total ?? 0);

      const init: Record<number, DiscountState> = {};
      for (const p of prods) {
        const existing = Array.isArray(camps)
          ? camps.find(
              (c) =>
                c.isActive &&
                c.discountType === "Percentage" &&
                c.targets.some((t) => t.targetType === "Product" && t.targetId === p.id_products)
            )
          : undefined;

        const allInvs = p.variants.flatMap((v) => v.inventories);
        const inventoryValues: Record<number, string> = {};
        for (const inv of allInvs) {
          if (inv.regular_discount != null && inv.regular_discount > 0) {
            inventoryValues[inv.inventory_id] = String(inv.regular_discount);
          }
        }

        const campaignValue = existing ? String(existing.discountValue) : "";
        init[p.id_products] = {
          selectedId: "all",
          inputValue: campaignValue,
          saving: false,
          campaignId: existing?.campaign_id,
          campaignValue,
          inventoryValues,
        };
      }
      setProducts(prods);
      setDiscounts((prev) => ({ ...prev, ...init }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectInventory = (productId: number, selectedId: number | "all") => {
    setDiscounts((prev) => {
      const s = prev[productId];
      if (!s) return prev;
      const newInput =
        selectedId === "all"
          ? s.campaignValue
          : s.inventoryValues[selectedId as number] ?? "";
      return {
        ...prev,
        [productId]: { ...s, selectedId, inputValue: newInput, error: undefined },
      };
    });
  };

  const handleInputChange = (productId: number, val: string) => {
    setDiscounts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], inputValue: val, error: undefined },
    }));
  };

  const handleSave = async (product: ProductItem) => {
    const state = discounts[product.id_products];
    if (!state) return;
    const pct = Number(state.inputValue);

    setDiscounts((prev) => ({
      ...prev,
      [product.id_products]: { ...prev[product.id_products], saving: true, error: undefined },
    }));

    try {
      if (state.selectedId === "all") {
        /* ── Campaign (ทั้งหมด) ── */
        if (!state.inputValue || pct === 0) {
          if (state.campaignId) {
            const res = await fetch(`${API_URL}/discounts/campaigns/${state.campaignId}`, {
              method: "DELETE",
              credentials: "include",
            });
            if (!res.ok) throw new Error(await res.text());
          }
          setDiscounts((prev) => ({
            ...prev,
            [product.id_products]: {
              ...prev[product.id_products],
              campaignId: undefined,
              campaignValue: "",
              inputValue: "",
              saving: false,
            },
          }));
          return;
        }
        if (pct < 1 || pct > 99) throw new Error("ต้องอยู่ระหว่าง 1–99%");

        const payload = {
          name: `Discount - ${product.name}`,
          discountType: "Percentage",
          discountValue: pct,
          startDate: new Date().toISOString(),
          endDate: new Date("2099-12-31T23:59:59Z").toISOString(),
          isActive: true,
          targets: [{ targetType: "Product", targetId: product.id_products }],
        };

        let newId = state.campaignId;
        if (state.campaignId) {
          const res = await fetch(`${API_URL}/discounts/campaigns/${state.campaignId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await res.text());
        } else {
          const res = await fetch(`${API_URL}/discounts/campaigns`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await res.text());
          const data = await res.json();
          newId = data.campaign_id;
        }

        // Reset all individual inventory discounts when saving campaign
        const allInvIds = getAllInventories(product).map((inv) => inv.inventory_id);
        await Promise.all(
          allInvIds.map((invId) =>
            fetch(`${API_URL}/products/inventories/${invId}/discount`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ regular_discount: null }),
            })
          )
        );

        setDiscounts((prev) => ({
          ...prev,
          [product.id_products]: {
            ...prev[product.id_products],
            campaignId: newId,
            campaignValue: String(pct),
            inputValue: String(pct),
            inventoryValues: {},
            saving: false,
          },
        }));
      } else {
        /* ── Per inventory ── */
        const inv_id = state.selectedId as number;
        const discountVal = !state.inputValue || pct === 0 ? null : pct;
        if (discountVal !== null && (discountVal < 1 || discountVal > 99))
          throw new Error("ต้องอยู่ระหว่าง 1–99%");

        const res = await fetch(`${API_URL}/products/inventories/${inv_id}/discount`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ regular_discount: discountVal }),
        });
        if (!res.ok) throw new Error(await res.text());

        const newVal = discountVal ? String(discountVal) : "";
        setDiscounts((prev) => {
          const cur = prev[product.id_products];
          return {
            ...prev,
            [product.id_products]: {
              ...cur,
              inventoryValues: { ...cur.inventoryValues, [inv_id]: newVal },
              // only update inputValue if user is still viewing this inventory
              inputValue: cur.selectedId === inv_id ? newVal : cur.inputValue,
              saving: false,
            },
          };
        });
      }
    } catch (err) {
      setDiscounts((prev) => ({
        ...prev,
        [product.id_products]: {
          ...prev[product.id_products],
          saving: false,
          error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
        },
      }));
    }
  };

  const handleReset = async (product: ProductItem) => {
    const state = discounts[product.id_products];
    if (!state) return;

    setDiscounts((prev) => ({
      ...prev,
      [product.id_products]: { ...prev[product.id_products], saving: true, error: undefined },
    }));

    try {
      if (state.selectedId === "all") {
        if (state.campaignId) {
          const res = await fetch(`${API_URL}/discounts/campaigns/${state.campaignId}`, {
            method: "DELETE",
            credentials: "include",
          });
          if (!res.ok) throw new Error(await res.text());
        }
        // Also reset all individual inventory discounts
        const allInvIds = getAllInventories(product).map((inv) => inv.inventory_id);
        await Promise.all(
          allInvIds.map((invId) =>
            fetch(`${API_URL}/products/inventories/${invId}/discount`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ regular_discount: null }),
            })
          )
        );
        setDiscounts((prev) => ({
          ...prev,
          [product.id_products]: {
            ...prev[product.id_products],
            campaignId: undefined,
            campaignValue: "",
            inputValue: "",
            inventoryValues: {},
            saving: false,
          },
        }));
      } else {
        const inv_id = state.selectedId as number;
        const res = await fetch(`${API_URL}/products/inventories/${inv_id}/discount`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ regular_discount: null }),
        });
        if (!res.ok) throw new Error(await res.text());
        setDiscounts((prev) => {
          const cur = prev[product.id_products];
          return {
            ...prev,
            [product.id_products]: {
              ...cur,
              inventoryValues: { ...cur.inventoryValues, [inv_id]: "" },
              inputValue: cur.selectedId === inv_id ? "" : cur.inputValue,
              saving: false,
            },
          };
        });
      }
    } catch (err) {
      setDiscounts((prev) => ({
        ...prev,
        [product.id_products]: {
          ...prev[product.id_products],
          saving: false,
          error: err instanceof Error ? err.message : "เกิดข้อผิดพลาด",
        },
      }));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <SidebarComponent>
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Tag className="w-6 h-6 text-orange-500" />
          <h1 className="text-2xl font-bold">Discount Management</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          ตั้งค่าส่วนลด (%) ให้แต่ละสินค้า — เลือกทั้งหมดหรือเฉพาะตัวเลือก
        </p>

        <Input
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-sm"
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderIcon className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">ไม่พบสินค้า</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => {
                const state = discounts[product.id_products] ?? {
                  selectedId: "all",
                  inputValue: "",
                  saving: false,
                  campaignValue: "",
                  inventoryValues: {},
                };
                return (
                  <ProductCard
                    key={product.id_products}
                    product={product}
                    state={state}
                    onSelectInventory={(id) => handleSelectInventory(product.id_products, id)}
                    onInputChange={(val) => handleInputChange(product.id_products, val)}
                    onSave={() => handleSave(product)}
                    onReset={() => handleReset(product)}
                  />
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ย้อนกลับ
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </SidebarComponent>
  );
}
