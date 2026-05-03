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

type ReceiverConfigForm = {
  maxPanelsX: string;
  maxPanelsY: string;
};

type ReceiverConfigValue = {
  maxPanelsX?: number;
  maxPanelsY?: number;
};

type ConfigSection = "module" | "receiver";

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

function getReceiverSimulatorConfig(product: ProductRecord): ReceiverConfigValue {
  const root = isObject(product.spec_table) ? product.spec_table : null;
  const nested = root && isObject(root.receiver_simulator_config)
    ? root.receiver_simulator_config
    : root && isObject(root.receiverSimulatorConfig)
      ? root.receiverSimulatorConfig
      : null;

  const maxPanelsX = Number(nested?.maxPanelsX);
  const maxPanelsY = Number(nested?.maxPanelsY);

  return {
    maxPanelsX: Number.isFinite(maxPanelsX) && maxPanelsX > 0 ? maxPanelsX : undefined,
    maxPanelsY: Number.isFinite(maxPanelsY) && maxPanelsY > 0 ? maxPanelsY : undefined,
  };
}

function isLedModuleProduct(product: ProductRecord) {
  const category = String(product.category?.name || "").toLowerCase();
  const brand = String(product.brand || "").toLowerCase();
  const name = String(product.name || "").toLowerCase();
  const shortDescription = String(product.short_description || "").toLowerCase();
  const text = `${category} ${brand} ${name} ${shortDescription}`;

  // Prefer explicit categories first so accessories that mention
  // LED modules in their copy do not get mixed into simulator module config.
  if (/megnent|magnet|แม่เหล็ก/.test(category)) return false;
  if (/receiver|receiving|receivers/.test(category)) return false;
  if (/switching/.test(category)) return false;
  if (/processor/.test(category)) return false;
  if (/sender/.test(category)) return false;
  if (/^led$|led\s*module|module/.test(category)) return true;

  if (/magnet|แม่เหล็ก/.test(text)) return false;
  if (/receiver|receiving|receivers/.test(text)) return false;
  if (/switching/.test(text)) return false;
  if (/processor/.test(text)) return false;
  if (/sender/.test(text)) return false;
  return /led\s*module|module/.test(text);
}

function isReceiverProduct(product: ProductRecord) {
  const category = String(product.category?.name || "").toLowerCase();
  const brand = String(product.brand || "").toLowerCase();
  const name = String(product.name || "").toLowerCase();
  const shortDescription = String(product.short_description || "").toLowerCase();
  const text = `${category} ${brand} ${name} ${shortDescription}`;

  if (/receiver|receiving|receivers/.test(category)) return true;
  if (/receiver|receiving|receivers/.test(text)) return true;
  return false;
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

function toReceiverFormValue(product: ProductRecord): ReceiverConfigForm {
  const config = getReceiverSimulatorConfig(product);
  return {
    maxPanelsX: config.maxPanelsX ? String(config.maxPanelsX) : "",
    maxPanelsY: config.maxPanelsY ? String(config.maxPanelsY) : "",
  };
}

export default function SimulatorConfigPage() {
  const [moduleProducts, setModuleProducts] = useState<ProductRecord[]>([]);
  const [receiverProducts, setReceiverProducts] = useState<ProductRecord[]>([]);
  const [moduleForms, setModuleForms] = useState<Record<number, SimulatorConfigForm>>({});
  const [receiverForms, setReceiverForms] = useState<Record<number, ReceiverConfigForm>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeSection, setActiveSection] = useState<ConfigSection>("module");

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
        const receiverRows = rows.filter(isReceiverProduct);
        setModuleProducts(moduleRows);
        setReceiverProducts(receiverRows);
        setModuleForms(
          moduleRows.reduce<Record<number, SimulatorConfigForm>>((acc, product) => {
            acc[product.id_products] = toFormValue(product);
            return acc;
          }, {})
        );
        setReceiverForms(
          receiverRows.reduce<Record<number, ReceiverConfigForm>>((acc, product) => {
            acc[product.id_products] = toReceiverFormValue(product);
            return acc;
          }, {})
        );
      } catch (fetchError) {
        console.error("Fetch simulator config products error:", fetchError);
        setError("ไม่สามารถโหลดรายการ config ของ simulator ได้");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [apiUrl]);

  const filteredModuleProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return moduleProducts;

    return moduleProducts.filter((product) => {
      const text = `${product.name || ""} ${product.brand || ""} ${product.category?.name || ""}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [moduleProducts, search]);

  const filteredReceiverProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return receiverProducts;

    return receiverProducts.filter((product) => {
      const text = `${product.name || ""} ${product.brand || ""} ${product.category?.name || ""}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [receiverProducts, search]);

  const updateModuleForm = (
    productId: number,
    field: keyof SimulatorConfigForm,
    value: string
  ) => {
    setModuleForms((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const updateReceiverForm = (
    productId: number,
    field: keyof ReceiverConfigForm,
    value: string
  ) => {
    setReceiverForms((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const saveModuleConfig = async (product: ProductRecord) => {
    const form = moduleForms[product.id_products];
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

      setModuleProducts((prev) =>
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

  const saveReceiverConfig = async (product: ProductRecord) => {
    const form = receiverForms[product.id_products];
    if (!form) return;

    const maxPanelsX = Number(form.maxPanelsX);
    const maxPanelsY = Number(form.maxPanelsY);

    if (
      !Number.isFinite(maxPanelsX) || maxPanelsX <= 0 ||
      !Number.isFinite(maxPanelsY) || maxPanelsY <= 0
    ) {
      setError("กรุณากรอกจำนวนจอแนวแกน X และแกน Y ให้ครบและมากกว่า 0");
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
        receiver_simulator_config: {
          maxPanelsX,
          maxPanelsY,
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
        throw new Error(payload?.message || "Failed to save receiver simulator config");
      }

      setReceiverProducts((prev) =>
        prev.map((item) =>
          item.id_products === product.id_products
            ? { ...item, spec_table: nextSpecTable }
            : item
        )
      );
      setSuccess(`บันทึกค่ารองรับของการ์ด Receiver ${product.name} เรียบร้อยแล้ว`);
    } catch (saveError) {
      console.error("Save receiver simulator config error:", saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "ไม่สามารถบันทึกค่า Receiver simulator ได้"
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
              แยกตั้งค่า simulator เป็น 2 ส่วน: ขนาดแผ่นจอ LED Module และความสามารถของ Card Receiver ในการรองรับจำนวนจอแต่ละแกน
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeSection === "module" ? "default" : "outline"}
                onClick={() => setActiveSection("module")}
              >
                Config จอ LED
              </Button>
              <Button
                type="button"
                variant={activeSection === "receiver" ? "default" : "outline"}
                onClick={() => setActiveSection("receiver")}
              >
                Config Card Receiver
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activeSection === "module"
                    ? "Search LED module..."
                    : "Search receiver card..."
                }
                className="sm:max-w-md"
              />
              <div className="text-sm text-gray-500">
                พบทั้งหมด{" "}
                {activeSection === "module"
                  ? filteredModuleProducts.length
                  : filteredReceiverProducts.length}{" "}
                รุ่น
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
                กำลังโหลดรายการ config...
              </div>
            ) : activeSection === "module" && filteredModuleProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                ไม่พบสินค้า LED Module ที่ใช้ตั้งค่า simulator
              </div>
            ) : activeSection === "receiver" && filteredReceiverProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
                ไม่พบสินค้า Card Receiver ที่ใช้ตั้งค่า simulator
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {activeSection === "module" &&
                  filteredModuleProducts.map((product) => {
                    const form =
                      moduleForms[product.id_products] ?? toFormValue(product);
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
                                updateModuleForm(product.id_products, "widthMm", event.target.value)
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
                                updateModuleForm(product.id_products, "heightMm", event.target.value)
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
                                updateModuleForm(product.id_products, "pixelWidth", event.target.value)
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
                                updateModuleForm(product.id_products, "pixelHeight", event.target.value)
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
                            onClick={() => saveModuleConfig(product)}
                            disabled={savingId === product.id_products}
                            className="gap-2"
                          >
                            {savingId === product.id_products ? (
                              <LoaderIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            บันทึกค่า LED Simulator
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                {activeSection === "receiver" &&
                  filteredReceiverProducts.map((product) => {
                    const form =
                      receiverForms[product.id_products] ?? toReceiverFormValue(product);
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
                              รองรับจอแนวนอนแกน X (กี่แผ่น)
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={form.maxPanelsX}
                              onChange={(event) =>
                                updateReceiverForm(product.id_products, "maxPanelsX", event.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                              รองรับจอแนวตั้งแกน Y (กี่แผ่น)
                            </label>
                            <Input
                              type="number"
                              min="1"
                              value={form.maxPanelsY}
                              onChange={(event) =>
                                updateReceiverForm(product.id_products, "maxPanelsY", event.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                          ใช้ค่านี้เพื่อกำหนดว่า Card Receiver รุ่นนี้ 1 ใบ สามารถรองรับจอในหน้า frontend `/design` ได้กี่แผ่นตามแกน X และ Y
                        </div>

                        <div className="mt-4 flex justify-end">
                          <Button
                            type="button"
                            onClick={() => saveReceiverConfig(product)}
                            disabled={savingId === product.id_products}
                            className="gap-2"
                          >
                            {savingId === product.id_products ? (
                              <LoaderIcon className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            บันทึกค่า Receiver Config
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
