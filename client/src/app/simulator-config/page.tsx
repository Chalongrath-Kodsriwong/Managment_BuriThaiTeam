"use client";

import { useEffect, useMemo, useState } from "react";
import { SidebarComponent } from "@/app/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderIcon, Save } from "lucide-react";

type ProductImage = { url: string; type?: string };

type ProductRecord = {
  id_products: number;
  id_category?: number;
  name: string;
  brand?: string | null;
  short_description?: string | null;
  description?: string | null;
  spec_table?: unknown;
  category?: { name?: string | null } | null;
  images?: ProductImage[];
};

type SimulatorConfigForm = {
  widthMm: string;
  heightMm: string;
  pixelWidth: string;
  pixelHeight: string;
};

type SimulatorConfigValue = {
  widthMm?: number;
  heightMm?: number;
  pixelWidth?: number;
  pixelHeight?: number;
};

function inferPanelDimensions(product: ProductRecord) {
  const haystack = `${product.name || ""} ${product.short_description || ""}`;
  const match = haystack.match(/(\d{2,4})\s*[x×]\s*(\d{2,4})\s*(?:mm)?/i);
  if (!match) return null;

  const widthMm = Number(match[1]);
  const heightMm = Number(match[2]);
  if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm)) return null;

  return { widthMm, heightMm };
}

function inferPanelPixels(product: ProductRecord) {
  const haystack = `${product.name || ""} ${product.short_description || ""}`;

  const labeledMatch = haystack.match(
    /(\d{2,4})\s*[x×]\s*(\d{2,4})\s*(?:pixel|pixels|พิกเซล)/i
  );
  if (labeledMatch) {
    const pixelWidth = Number(labeledMatch[1]);
    const pixelHeight = Number(labeledMatch[2]);
    if (Number.isFinite(pixelWidth) && Number.isFinite(pixelHeight)) {
      return { pixelWidth, pixelHeight };
    }
  }

  const genericMatches = [...haystack.matchAll(/(\d{2,4})\s*[x×]\s*(\d{2,4})/gi)];
  const pixelCandidate = genericMatches
    .map((match) => ({
      pixelWidth: Number(match[1]),
      pixelHeight: Number(match[2]),
    }))
    .find(
      (value) =>
        Number.isFinite(value.pixelWidth) &&
        Number.isFinite(value.pixelHeight) &&
        value.pixelWidth <= 128 &&
        value.pixelHeight <= 128
    );

  return pixelCandidate || null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSimulatorConfig(product: ProductRecord): SimulatorConfigValue {
  const root = isObject(product.spec_table) ? product.spec_table : null;
  const nested = root && isObject(root.simulator_config)
    ? root.simulator_config
    : root && isObject(root.simulatorConfig)
      ? root.simulatorConfig
      : root;

  const widthMm = Number(nested?.widthMm);
  const heightMm = Number(nested?.heightMm);
  const pixelWidth = Number(nested?.pixelWidth);
  const pixelHeight = Number(nested?.pixelHeight);

  const inferredMm = inferPanelDimensions(product);
  const inferredPx = inferPanelPixels(product);

  return {
    widthMm: Number.isFinite(widthMm) && widthMm > 0 ? widthMm : inferredMm?.widthMm,
    heightMm: Number.isFinite(heightMm) && heightMm > 0 ? heightMm : inferredMm?.heightMm,
    pixelWidth: Number.isFinite(pixelWidth) && pixelWidth > 0 ? pixelWidth : inferredPx?.pixelWidth,
    pixelHeight: Number.isFinite(pixelHeight) && pixelHeight > 0 ? pixelHeight : inferredPx?.pixelHeight,
  };
}

function isLedModuleProduct(product: ProductRecord) {
  const category = String(product.category?.name || "").toLowerCase();
  const brand = String(product.brand || "").toLowerCase();
  const name = String(product.name || "").toLowerCase();
  const shortDescription = String(product.short_description || "").toLowerCase();
  const text = `${category} ${brand} ${name} ${shortDescription}`;

  if (/magnet|แม่เหล็ก/.test(text)) return false;
  return /led\s*module|module/.test(text);
}

function toFormValue(product: ProductRecord): SimulatorConfigForm {
  const config = getSimulatorConfig(product);
  return {
    widthMm: config.widthMm ? String(config.widthMm) : "",
    heightMm: config.heightMm ? String(config.heightMm) : "",
    pixelWidth: config.pixelWidth ? String(config.pixelWidth) : "",
    pixelHeight: config.pixelHeight ? String(config.pixelHeight) : "",
  };
}

export default function SimulatorConfigPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [forms, setForms] = useState<Record<number, SimulatorConfigForm>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/+$/, "");

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${apiUrl}/products`, {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        const rows = Array.isArray(payload?.data) ? (payload.data as ProductRecord[]) : [];
        const moduleRows = rows.filter(isLedModuleProduct);
        setProducts(moduleRows);
        setForms(
          moduleRows.reduce<Record<number, SimulatorConfigForm>>((acc, product) => {
            acc[product.id_products] = toFormValue(product);
            return acc;
          }, {})
        );
      } catch (fetchError) {
        console.error("Fetch simulator config products error:", fetchError);
        setError("ไม่สามารถโหลดรายการจอ LED Module ได้");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [apiUrl]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter((product) => {
      const text = `${product.name || ""} ${product.brand || ""} ${product.category?.name || ""}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [products, search]);

  const updateForm = (
    productId: number,
    field: keyof SimulatorConfigForm,
    value: string
  ) => {
    setForms((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const saveConfig = async (product: ProductRecord) => {
    const form = forms[product.id_products];
    if (!form) return;

    const widthMm = Number(form.widthMm);
    const heightMm = Number(form.heightMm);
    const pixelWidth = Number(form.pixelWidth);
    const pixelHeight = Number(form.pixelHeight);

    if (
      !Number.isFinite(widthMm) || widthMm <= 0 ||
      !Number.isFinite(heightMm) || heightMm <= 0 ||
      !Number.isFinite(pixelWidth) || pixelWidth <= 0 ||
      !Number.isFinite(pixelHeight) || pixelHeight <= 0
    ) {
      setError("กรุณากรอกค่าขนาด mm และ pixel ให้ครบและมากกว่า 0");
      setSuccess("");
      return;
    }

    setSavingId(product.id_products);
    setError("");
    setSuccess("");

    try {
      const currentSpecTable = isObject(product.spec_table) ? product.spec_table : {};
      const nextSpecTable = {
        ...currentSpecTable,
        simulator_config: {
          widthMm,
          heightMm,
          pixelWidth,
          pixelHeight,
        },
      };

      const response = await fetch(`${apiUrl}/products/${product.id_products}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          spec_table: nextSpecTable,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save simulator config");
      }

      setProducts((prev) =>
        prev.map((item) =>
          item.id_products === product.id_products
            ? { ...item, spec_table: nextSpecTable }
            : item
        )
      );
      setSuccess(`บันทึกค่าจำลองของ ${product.name} เรียบร้อยแล้ว`);
    } catch (saveError) {
      console.error("Save simulator config error:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "ไม่สามารถบันทึกค่า simulator ได้"
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <SidebarComponent>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Simulator Config</CardTitle>
            <p className="text-sm text-gray-500">
              ตั้งค่าขนาดแผ่นจอ LED Module ที่ใช้ในหน้า simulator ฝั่ง frontend โดยกำหนดทั้งหน่วยจริง (มม.) และจำนวน pixel ของแผ่น
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search LED module..."
                className="sm:max-w-md"
              />
              <div className="text-sm text-gray-500">
                พบทั้งหมด {filteredProducts.length} รุ่น
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
                <LoaderIcon className="h-6 w-6 animate-spin" />
                กำลังโหลดรายการจอ LED Module...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                ไม่พบสินค้า LED Module ที่ใช้ตั้งค่า simulator
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredProducts.map((product) => {
                  const form = forms[product.id_products] ?? toFormValue(product);
                  const coverImage = product.images?.[0]?.url || "/image/logo_white.jpeg";
                  return (
                    <div
                      key={product.id_products}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="mb-4 flex gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverImage}
                          alt={product.name}
                          className="h-28 w-28 rounded-xl border border-gray-200 object-cover bg-gray-50"
                          onError={(event) => {
                            event.currentTarget.src = "/image/logo_white.jpeg";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {product.brand || "-"} • {product.category?.name || "No category"}
                          </p>
                          {product.short_description && (
                            <p className="mt-2 text-sm text-gray-500">
                              {product.short_description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            ความกว้างแผ่น (mm)
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={form.widthMm}
                            onChange={(event) =>
                              updateForm(product.id_products, "widthMm", event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            ความสูงแผ่น (mm)
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={form.heightMm}
                            onChange={(event) =>
                              updateForm(product.id_products, "heightMm", event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Pixel แกน X
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={form.pixelWidth}
                            onChange={(event) =>
                              updateForm(product.id_products, "pixelWidth", event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">
                            Pixel แกน Y
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={form.pixelHeight}
                            onChange={(event) =>
                              updateForm(product.id_products, "pixelHeight", event.target.value)
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        ใช้ค่านี้เพื่อแสดงขนาดแผ่นในหน้า frontend `/design` โดยตรง
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button
                          type="button"
                          onClick={() => saveConfig(product)}
                          disabled={savingId === product.id_products}
                          className="gap-2"
                        >
                          {savingId === product.id_products ? (
                            <LoaderIcon className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          บันทึกค่า Simulator
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarComponent>
  );
}
