"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FiArrowLeft, FiPlus, FiMinus } from "react-icons/fi";
import { LoaderIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

import { UploadedFile } from "../../dtos/upload-file.dto";
import { ProductFormValues } from "../../dtos/product.dto";
import { VariantItemProps } from "../../dtos/variant.dto";
import { ProductImage } from "../../dtos/inventory.dto";
import { createEmptySpecTable } from "../../dtos/spec-table.dto";
import { getTemplateByCategory } from "../../dtos/spec-table-templates";
import { BrandCombobox } from "../../components/BrandCombobox";
import { SpecificationTableEditor } from "../../components/SpecificationTableEditor";
import {
  buildDirectVariantsPayload,
  DIRECT_INVENTORY_NAME,
  isDirectVariant,
  ProductInputMode,
  sanitizeVariantsPayload,
  purchaseModeHint,
} from "../../utils/product-mode";
import {
  BLANK_NUMBER_WARNING,
  blankFieldClass,
  useBlankNumberFields,
} from "../../utils/blank-number-fields";
import ProductDownloadsPanel from "../../components/ProductDownloadsPanel";

interface Category {
  id_category: number;
  name: string;
  parent_id: number | null;
}

/* ===================== MAIN ===================== */

export default function ProductDetails() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [inputMode, setInputMode] = useState<ProductInputMode>("variant");
  const [directVariantId, setDirectVariantId] = useState<number | undefined>();
  const [directInventoryId, setDirectInventoryId] = useState<number | undefined>();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const raw = searchParams.get("categoryData");
  const categoryData: Category[] = raw ? (JSON.parse(raw) as Category[]) : [];

  const parseQuality = (value?: string): string[] => {
    if (!value) return [];
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      brand: "",
      quality: "",
      short_description: "",
      description: "",
      id_category: "",
      direct_price: 0,
      direct_stock: 0,
      direct_purchase_mode: "normal",
      direct_regular_discount: null,
      direct_regular_discount_end_date: null,
      direct_preorder_discount: null,
      direct_preorder_release_date: null,
      spec_table: createEmptySpecTable(),
      variants: [],
    },
  });

  const { control, reset, setValue, watch } = form;
  const {
    isBlankField,
    clearBlankField,
    resetBlankFields,
    collectBlankFields,
  } = useBlankNumberFields();
  const selectedQuality = parseQuality(watch("quality"));

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  /* ===================== VARIANT ITEM ===================== */

  const PURCHASE_MODE_OPTIONS = [
    { value: "normal", label: "สั่งซื้อเลยเท่านั้น" },
    { value: "preorder_only", label: "Preorder เท่านั้น" },
    { value: "both", label: "Preorder และสั่งซื้อ" },
  ] as const;

  const InventoryRow = ({ vIndex, iIndex, control: ctrl, register: reg, onDelete }: {
    vIndex: number; iIndex: number;
    control: VariantItemProps["control"]; register: VariantItemProps["register"];
    onDelete: () => void;
  }) => {
    const purchaseMode = useWatch({ control: ctrl, name: `variants.${vIndex}.inventories.${iIndex}.purchase_mode` as any, defaultValue: "normal" });
    const showPreorder = purchaseMode === "preorder_only" || purchaseMode === "both";

    // ช่องราคา/จำนวน ถ้าถูกทำเครื่องหมายว่าเว้นว่างตอนกด Save จะขึ้นกรอบแดงจนกว่าจะพิมพ์ใหม่
    const priceName = `variants.${vIndex}.inventories.${iIndex}.price`;
    const stockName = `variants.${vIndex}.inventories.${iIndex}.stock`;
    const priceField = reg(priceName as any, { valueAsNumber: true });
    const stockField = reg(stockName as any, { valueAsNumber: true });

    return (
      <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
        <div className="flex gap-2 items-center">
          <Input {...reg(`variants.${vIndex}.inventories.${iIndex}.inventory_name`)} placeholder="Inventory name" className="flex-1" />
          <Input
            type="number"
            {...priceField}
            onChange={(event) => { priceField.onChange(event); clearBlankField(priceName); }}
            placeholder="Price (฿)"
            aria-invalid={isBlankField(priceName)}
            className={`w-28 ${blankFieldClass(isBlankField(priceName))}`}
          />
          <Input
            type="number"
            {...stockField}
            onChange={(event) => { stockField.onChange(event); clearBlankField(stockName); }}
            placeholder="Stock"
            aria-invalid={isBlankField(stockName)}
            className={`w-24 ${blankFieldClass(isBlankField(stockName))}`}
          />
          <Button type="button" variant="destructive" size="sm" onClick={onDelete}><FiMinus /></Button>
        </div>
        {(isBlankField(priceName) || isBlankField(stockName)) && (
          <p className="text-[11px] font-semibold text-red-600">
            ⚠️ ช่องที่ขึ้นกรอบแดงถูกเว้นว่างไว้ ระบบใส่ 0 ให้แล้ว — ตรวจสอบแล้วกด Save อีกครั้ง
          </p>
        )}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-gray-500 mr-1">โหมด:</span>
          <Controller control={ctrl} name={`variants.${vIndex}.inventories.${iIndex}.purchase_mode` as any} defaultValue="normal"
            render={({ field }) => PURCHASE_MODE_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
                className={`px-2 py-1 text-xs rounded border transition-colors ${field.value === opt.value ? "!bg-blue-800 !text-white !border-0" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}>
                {opt.label}
              </button>
            )) as any}
          />
        </div>
        <p className="text-[11px] text-gray-500 leading-snug">ℹ️ {purchaseModeHint(purchaseMode as string)}</p>
        {/* ส่วนลดปกติ — ซ่อนเมื่อเป็น "Preorder เท่านั้น" เพราะขายปกติไม่ได้ */}
        {purchaseMode !== "preorder_only" && (
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-xs text-gray-500 whitespace-nowrap">ส่วนลดปกติ %</span>
            <Input type="number" {...reg(`variants.${vIndex}.inventories.${iIndex}.regular_discount` as any, { valueAsNumber: true })} placeholder="เช่น 10" className="w-24" />
            <span className="text-xs text-gray-500 whitespace-nowrap">ลดถึงวันที่</span>
            <Input type="datetime-local" {...reg(`variants.${vIndex}.inventories.${iIndex}.regular_discount_end_date` as any)} className="w-52" />
            <span className="text-[11px] text-gray-400">เว้นว่าง = ไม่มีกำหนด</span>
          </div>
        )}
        {showPreorder && (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500 whitespace-nowrap">ส่วนลด Preorder %</span>
            <Input type="number" {...reg(`variants.${vIndex}.inventories.${iIndex}.preorder_discount` as any, { valueAsNumber: true })} placeholder="เช่น 15" className="w-24" />
            <span className="text-xs text-gray-500 whitespace-nowrap">วันสิ้นสุด Preorder</span>
            <Input type="datetime-local" {...reg(`variants.${vIndex}.inventories.${iIndex}.preorder_release_date` as any)} className="w-52" />
          </div>
        )}
      </div>
    );
  };

  const VariantItem = ({ vIndex, control, register }: VariantItemProps) => {
    const { fields, append, remove: removeInventory } = useFieldArray({ control, name: `variants.${vIndex}.inventories` });
    return (
      <div className="border p-4 rounded-md space-y-4">
        <FormField control={control} name={`variants.${vIndex}.variant_name`}
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Variant</FormLabel>
                <Button type="button" variant="destructive" size="sm" onClick={() => onDeleteVariant(vIndex)}><FiMinus /></Button>
              </div>
              <FormControl><Input {...field} /></FormControl>
            </FormItem>
          )}
        />
        {fields.map((inv, iIndex) => (
          <InventoryRow key={inv.id} vIndex={vIndex} iIndex={iIndex} control={control} register={register}
            onDelete={() => onDeleteInventory(vIndex, iIndex, removeInventory)} />
        ))}
        <Button type="button" variant="outline" size="sm"
          onClick={() => append({ inventory_name: "", price: 0, stock: 0, purchase_mode: "normal" as any, preorder_discount: null, preorder_release_date: null, regular_discount: null })}>
          <FiPlus /> Add Inventory
        </Button>
      </div>
    );
  };

  /* ===================== FETCH ===================== */
  // Fetch Normal
  const fetchData = React.useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error("Failed to fetch");

      const result = await res.json();
      const product = result.data;
      const productVariants = Array.isArray(product.variants) ? product.variants : [];
      const directVariant =
        productVariants.length === 1 && isDirectVariant(productVariants[0])
          ? productVariants[0]
          : null;
      const directInventory = directVariant?.inventories?.[0];

      setInputMode(directVariant ? "direct" : "variant");
      setDirectVariantId(directVariant?.variant_id);
      setDirectInventoryId(directInventory?.inventory_id);

      reset({
        name: product.name,
        brand: product.brand,
        quality: product.quality ?? "",
        short_description: product.short_description,
        description: product.description,
        id_category: product.id_category,
        direct_price: directInventory?.price ?? 0,
        direct_stock: directInventory?.stock ?? 0,
        direct_purchase_mode: directInventory?.purchase_mode ?? "normal",
        direct_regular_discount: directInventory?.regular_discount ?? null,
        direct_regular_discount_end_date: directInventory?.regular_discount_end_date
          ? new Date(directInventory.regular_discount_end_date).toISOString().slice(0, 16)
          : null,
        direct_preorder_discount: directInventory?.preorder_discount ?? null,
        direct_preorder_release_date: directInventory?.preorder_release_date
          ? new Date(directInventory.preorder_release_date).toISOString().slice(0, 16)
          : null,
        spec_table: product.spec_table ?? createEmptySpecTable(),
        variants: directVariant
          ? []
          : productVariants.map((v: any) => ({
              ...v,
              inventories: (v.inventories ?? []).map((inv: any) => ({
                ...inv,
                preorder_release_date: inv.preorder_release_date
                  ? new Date(inv.preorder_release_date).toISOString().slice(0, 16)
                  : null,
              })),
            })),
      });
      if (product.id_category) setSelectedCategoryId(Number(product.id_category));

      setImages(
        product.images.map((img: ProductImage) => ({
          file: null,
          id: img.img_id,
          preview: img.url,
          type: img.type,
          is_cover: img.is_cover,
        }))
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, [params.id, reset]);

  //Submit Form Update
  /**
   * โหลด Format ตารางสเปคของหมวดที่เลือก
   *
   * หน้า Create ทำแบบนี้อยู่แล้ว แต่หน้าแก้ไขไม่เคยมี — สินค้าที่สร้างไปแล้ว
   * โดยไม่ได้กรอกตาราง เลยไม่มีทางได้ฟอร์มขึ้นมาเลย
   *
   * ต่างจากหน้า Create ตรงที่นี่อาจมีข้อมูลเดิมอยู่ จึงต้องกันไม่ให้ทับของเก่าเงียบๆ
   *   ตารางว่าง  → ใส่ Format ให้ทันที
   *   มีข้อมูล   → ถามก่อน
   */
  const isSpecTableEmpty = (t: any) => {
    const rows = t?.rows;
    if (!Array.isArray(rows) || rows.length === 0) return true;
    return rows.every(
      (r: any) =>
        !`${r?.label ?? ""}`.trim() &&
        (r?.values ?? []).every((v: any) => !`${v ?? ""}`.trim())
    );
  };

  const applyCategoryTemplate = (catId: number) => {
    const cat = categoryData.find((c) => c.id_category === catId);
    if (!cat) return;

    // Format ที่แอดมินบันทึกเองมาก่อน template ที่ติดมากับโค้ด
    let template: any = null;
    try {
      const saved = localStorage.getItem(`spec_template_${catId}`);
      if (saved) template = JSON.parse(saved);
    } catch {
      /* อ่านไม่ได้ก็ตกไปใช้ template ปกติ */
    }
    if (!template) template = getTemplateByCategory(cat.name ?? "");
    if (!template) return; // หมวดนี้ยังไม่มี Format — ปล่อยตารางไว้เหมือนเดิม

    const current = form.getValues("spec_table");
    if (!isSpecTableEmpty(current)) {
      const ok = window.confirm(
        `ตารางสเปคของสินค้านี้มีข้อมูลอยู่แล้ว\n\nต้องการแทนที่ด้วย Format ของหมวด "${cat.name}" หรือไม่?\n(ข้อมูลเดิมในตารางจะหายไป)`
      );
      if (!ok) return;
    }

    setValue("spec_table", template, { shouldDirty: true });
  };

  /** ช่องราคา/จำนวนทั้งหมดที่ต้องตรวจก่อนบันทึก ตามโหมดที่ใช้อยู่ */
  const collectNumericEntries = (values: ProductFormValues) => {
    if (inputMode !== "variant") {
      return [
        { name: "direct_price", value: values.direct_price },
        { name: "direct_stock", value: values.direct_stock },
      ];
    }
    return (values.variants ?? []).flatMap((variant: any, vIndex: number) =>
      (variant?.inventories ?? []).flatMap((inventory: any, iIndex: number) => [
        { name: `variants.${vIndex}.inventories.${iIndex}.price`, value: inventory?.price },
        { name: `variants.${vIndex}.inventories.${iIndex}.stock`, value: inventory?.stock },
      ])
    );
  };

  const onSubmit = async (values: ProductFormValues) => {
    // เว้นว่างไว้ = เติม 0 ให้ ขึ้นกรอบแดง แล้วหยุดไว้ก่อน ไม่บันทึกทับของเดิมด้วย NaN
    const blanks = collectBlankFields(
      collectNumericEntries(values),
      (name, value) => setValue(name as any, value as any, { shouldDirty: true })
    );
    if (blanks.length > 0) {
      setWarning(BLANK_NUMBER_WARNING);
      return;
    }

    setWarning(null);
    resetBlankFields();
    setSaving(true);
    try {
      const sanitizedVariants = sanitizeVariantsPayload(values.variants);
      const directPrice = Number(values.direct_price ?? 0);
      const directStock = Number(values.direct_stock ?? 0);

      let variantsPayload = sanitizedVariants;

      if (inputMode === "variant") {
        if (sanitizedVariants.length === 0) {
          throw new Error(
            "Please add at least one variant or switch to direct stock mode"
          );
        }

        if (!window.confirm("ต้องการใส่ข้อมูลที่ Variant ใช่มั้ย")) {
          setSaving(false);
          return;
        }
      } else {
        if (!(directPrice > 0) || directStock < 0) {
          throw new Error("Please fill in both direct price and direct stock");
        }

        if (!window.confirm("ต้องการใส่ข้อมูลโดยไม่ใช้ Variant ใช่มั้ย")) {
          setSaving(false);
          return;
        }

        variantsPayload = buildDirectVariantsPayload({
          variantId: directVariantId,
          inventoryId: directInventoryId,
          price: directPrice,
          stock: directStock,
          purchaseMode: values.direct_purchase_mode ?? "normal",
          preorderDiscount: values.direct_preorder_discount ?? null,
          preorderReleaseDate: values.direct_preorder_release_date ?? null,
          regularDiscount: values.direct_regular_discount ?? null,
          regularDiscountEndDate: values.direct_regular_discount_end_date ?? null,
        });
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...values,
            variants: variantsPayload,
            replace_variants: true,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }
      await fetchData({ silent: true });
    } catch (submitError) {
      console.error("Update product error:", submitError);
      setWarning(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete only Variant
  const onDeleteVariant = async (vIndex: number) => {
    const variant = form.getValues(`variants.${vIndex}`);

    if (!variant.variant_id) {
      remove(vIndex);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/variants`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ids: [variant.variant_id] }),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      remove(vIndex);
    } catch (err) {
      setError("Failed to delete variant");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Inventory
  const onDeleteInventory = async (
    vIndex: number,
    iIndex: number,
    removeInventory: (index: number) => void
  ) => {
    const inventory = form.getValues(
      `variants.${vIndex}.inventories.${iIndex}`
    );

    if (!inventory.inventory_id) {
      removeInventory(iIndex);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/inventories`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ ids: [inventory.inventory_id] }),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      removeInventory(iIndex);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!params.id) return;
    fetchData();
  }, [params.id, fetchData]);
  /* ===================== IMAGE UPLOAD ===================== */

  const isVideoFile = (url: string) => {
    return /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(url);
  };

  const isPdfFile = (fileOrUrl: File | string) => {
    if (typeof fileOrUrl !== "string") {
      return fileOrUrl.type === "application/pdf";
    }

    return /\.pdf($|\?)/i.test(fileOrUrl);
  };

  //Upload Handle
  const handleUploadImages = (files: FileList | null) => {
    if (!files) return;

    const newImages: UploadedFile[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type === "application/pdf" ? "pdf" : "slide",
      is_cover: false,
      isVideo: file.type.startsWith("video/"),
      isPdf: file.type === "application/pdf",
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  //Submit Imgaes for Insert
  const handleSumitImages = async () => {
    const newImages = images.filter((img) => img.file instanceof File);
    if (newImages.length === 0) return;

    const formData = new FormData();
    newImages.forEach((img) => {
      formData.append("images", img.file as File);
    });

    formData.append(
      "add_images",
      JSON.stringify(
        newImages.map((img) => ({
          type: img.isPdf ? "pdf" : img.is_cover ? "cover" : "slide",
          is_cover: img.is_cover,
        }))
      )
    );

    setImageLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}`,
        {
          method: "PUT",
          body: formData,
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Upload images failed");
      }

      await fetchData();
    } finally {
      setImageLoading(false);
    }
  };
  const pendingImages = images.filter((img) => img.file instanceof File);

  // Delte Image
  const deleteImages = async () => {
    if (selectedImageIds.length === 0) return;

    const idsToDelete = [...selectedImageIds];

    setDeletingIds(idsToDelete);
    setImages((prev) =>
      prev.filter((img) => !img.id || !idsToDelete.includes(img.id))
    );
    setSelectedImageIds([]);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}/images`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ image_ids: idsToDelete }),
        }
      );

      if (!res.ok) throw new Error(await res.text());
    } catch {
      fetchData();
      setError("Failed to delete images");
    } finally {
      setDeletingIds([]);
    }
  };

  // Update Status
  const updateSwitch = async (imgId: number, is_cover: boolean) => {
    const formData = new FormData();

    formData.append(
      "update_images",
      JSON.stringify([
        {
          img_id: imgId,
          is_cover: is_cover,
        },
      ])
    );
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}`, {
      method: "PUT",
      body: formData,
      credentials: "include",
    });
  };

  /* ===================== UI ===================== */
  return (
    <>
      {/* popup เตือนช่องที่เว้นว่าง — ปิดเองไม่ได้ ต้องกดรับทราบ จะได้ไม่พลาด */}
      {warning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setWarning(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none">⚠️</span>
              <div className="flex-1">
                <h2 className="mb-1 text-lg font-bold text-red-600">
                  ยังบันทึกไม่ได้
                </h2>
                <p className="text-sm leading-relaxed text-gray-700">{warning}</p>
              </div>
            </div>
            <Button
              type="button"
              className="mt-5 w-full"
              onClick={() => setWarning(null)}
            >
              รับทราบ
            </Button>
          </div>
        </div>
      )}

      <Button variant="outline" onClick={() => router.back()}>
        <FiArrowLeft /> Back
      </Button>

      <Card className="mt-5 mx-10">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Product Details
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <LoaderIcon className="h-10 w-10 animate-spin text-gray-500" />
              <p className="text-gray-500 text-lg">Loading data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 text-lg">
              {error}
            </div>
          ) : (
            <div>
              <Form {...form} key={params.id}>
                <form
                  className="space-y-6"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  {/* ================= ASSETS ================= */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold">Media And PDF Files</h3>
                      <p className="text-sm text-muted-foreground">
                        Manage product images, videos, and PDF documents here.
                      </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-wrap gap-4">
                      <Button type="button" variant="outline" asChild>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <FiPlus /> Upload Image Or Video
                          <input
                            type="file"
                            multiple
                            hidden
                            accept="image/*,video/*"
                            onChange={(e) => {
                              handleUploadImages(e.target.files);
                              e.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </Button>

                      <Button type="button" variant="outline" asChild>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <FiPlus /> Upload PDF
                          <input
                            type="file"
                            multiple
                            hidden
                            accept="application/pdf"
                            onChange={(e) => {
                              handleUploadImages(e.target.files);
                              e.currentTarget.value = "";
                            }}
                          />
                        </label>
                      </Button>

                      {pendingImages.length > 0 && (
                        <Button
                          type="button"
                          onClick={handleSumitImages}
                          disabled={imageLoading}
                        >
                          {imageLoading ? "Saving..." : "Save Files"}
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={deleteImages}
                        disabled={deletingIds.length > 0}
                        hidden={selectedImageIds.length === 0}
                      >
                        {deletingIds.length > 0
                          ? "Deleting..."
                          : "Delete Selected Files"}
                      </Button>
                    </div>

                    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                      PDF files are kept with product assets and will not be
                      treated as cover images.
                    </div>

                    {/* GRID */}
                    <div className="grid grid-cols-[repeat(auto-fill,200px)] gap-4">
                      {images.map((img, index) => {
                        const isVideo =
                          img.file instanceof File
                            ? img.file.type.startsWith("video/")
                            : isVideoFile(img.preview);
                        const isPdf =
                          img.file instanceof File
                            ? isPdfFile(img.file)
                            : img.type === "pdf" || isPdfFile(img.preview);

                        return (
                          <div
                            key={img.id ?? img.preview}
                            className="border rounded-md p-2 space-y-2 w-[200px]"
                          >
                            <div className="text-xs font-medium text-muted-foreground">
                              {isPdf
                                ? "PDF Document"
                                : isVideo
                                  ? "Video File"
                                  : "Image File"}
                            </div>
                            {img.id !== undefined && img.id !== null && (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  className="h-5 w-5 border border-input"
                                  checked={selectedImageIds.includes(img.id)}
                                  onCheckedChange={(checked) => {
                                    const isChecked = checked === true;
                                    setSelectedImageIds((prev) =>
                                      isChecked
                                        ? [...prev, img.id!]
                                        : prev.filter((id) => id !== img.id)
                                    );
                                  }}
                                />
                              </div>
                            )}

                            {/* PREVIEW */}
                            <div className="relative w-full aspect-square bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                              {isPdf ? (
                                <a
                                  href={img.preview}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
                                >
                                  <span className="text-5xl">PDF</span>
                                  <span className="text-sm text-blue-600 underline">
                                    Open PDF
                                  </span>
                                </a>
                              ) : isVideo ? (
                                <video
                                  src={img.preview}
                                  controls
                                  preload="metadata"
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : (
                                <Image
                                  src={img.preview}
                                  alt=""
                                  fill
                                  priority
                                  className="object-contain"
                                />
                              )}
                            </div>

                            {/* COVER SWITCH (image เท่านั้น) */}
                            {!isVideo && !isPdf && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Cover</span>
                                <Switch
                                  checked={img.is_cover}
                                  onCheckedChange={(checked) => {
                                    // 1. update UI
                                    setImages((prev) =>
                                      prev.map((p, i) => {
                                        if (
                                          isVideoFile(p.preview) ||
                                          p.type === "pdf" ||
                                          isPdfFile(p.preview)
                                        ) {
                                          return p;
                                        }

                                        if (i === index) {
                                          return {
                                            ...p,
                                            is_cover: checked,
                                            type: checked ? "cover" : "slide",
                                          };
                                        }

                                        return {
                                          ...p,
                                          is_cover: false,
                                          type: "slide",
                                        };
                                      })
                                    );
                                    // 2. update backend (ค่าใหม่)
                                    updateSwitch(Number(img.id), checked);
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ================= TEXT ================= */}
                  <FormField
                    control={control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Purchase Mode (direct mode only) */}
                  {inputMode === "direct" && (
                    <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                      <p className="text-sm font-medium">โหมดการขาย</p>
                      <Controller control={control} name={"direct_purchase_mode" as any} defaultValue="normal"
                        render={({ field }) => (
                          <div className="flex gap-2 flex-wrap">
                            {[
                              { value: "normal", label: "สั่งซื้อเลยเท่านั้น" },
                              { value: "preorder_only", label: "Preorder เท่านั้น" },
                              { value: "both", label: "Preorder และสั่งซื้อ" },
                            ].map((opt) => (
                              <button key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
                                className={`px-3 py-1.5 text-sm rounded border transition-colors ${field.value === opt.value ? "bg-blue-800 text-white border-transparent" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"}`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      />
                      {/* บอกให้ชัดว่าโหมดนี้ ลูกค้าจะเห็นอะไรตอนของหมด */}
                      <p className="text-xs text-blue-900/70 bg-white/70 border border-blue-100 rounded px-2 py-1.5">
                        ℹ️ {purchaseModeHint(watch("direct_purchase_mode") as string)}
                      </p>
                      {/* ส่วนลดปกติ — เฉพาะโหมดที่ขายปกติได้ (ไม่ใช่ Preorder เท่านั้น) */}
                      {watch("direct_purchase_mode") !== "preorder_only" && (
                        <div className="flex gap-3 items-center flex-wrap">
                          <span className="text-sm text-gray-500 whitespace-nowrap">ส่วนลดปกติ %</span>
                          <Input type="number" {...form.register("direct_regular_discount", { valueAsNumber: true })} placeholder="เช่น 10" className="w-24" />
                          <span className="text-sm text-gray-500 whitespace-nowrap">ลดถึงวันที่</span>
                          <Input type="datetime-local" {...form.register("direct_regular_discount_end_date")} className="w-52" />
                          <span className="text-xs text-gray-400">เว้นว่าง = ไม่มีกำหนด</span>
                        </div>
                      )}

                      {(watch("direct_purchase_mode") === "preorder_only" || watch("direct_purchase_mode") === "both") && (
                        <div className="flex gap-3 items-center flex-wrap">
                          <span className="text-sm text-gray-500">ส่วนลด Preorder %</span>
                          <Input type="number" {...form.register("direct_preorder_discount" as any, { valueAsNumber: true })} placeholder="เช่น 15" className="w-24" />
                          <span className="text-sm text-gray-500">วันสิ้นสุด Preorder</span>
                          <Input type="datetime-local" {...form.register("direct_preorder_release_date" as any)} className="w-52" />
                        </div>
                      )}
                    </div>
                  )}

                  <FormField
                    control={control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <BrandCombobox
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="short_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="id_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select
                            value={
                              field.value ? String(field.value) : undefined
                            }
                            onValueChange={(value) => {
                              field.onChange(Number(value));
                              const catId = Number(value);
                              setSelectedCategoryId(catId);
                              applyCategoryTemplate(catId);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>

                            <SelectContent>
                              {categoryData.map((cat) => (
                                <SelectItem
                                  key={cat.id_category}
                                  value={String(cat.id_category)}
                                >
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="spec_table"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <SpecificationTableEditor
                            value={field.value}
                            onChange={field.onChange}
                            onSaveTemplate={
                              selectedCategoryId
                                ? () => {
                                    const current = field.value;
                                    if (!current) return;
                                    const templateOnly = {
                                      firstColumnHeader: current.firstColumnHeader,
                                      columnHeaders: current.columnHeaders,
                                      rows: current.rows.map((r) => ({ label: r.label, values: r.values.map(() => "") })),
                                    };
                                    localStorage.setItem(`spec_template_${selectedCategoryId}`, JSON.stringify(templateOnly));
                                    alert("บันทึก Format สำหรับ Category นี้แล้ว");
                                  }
                                : undefined
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={control}
                    name="quality"
                    render={() => (
                      <FormItem>
                        <FormLabel>Quality (มือสินค้า)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between border rounded-md px-3 py-2">
                              <span className="text-sm">มือ 1</span>
                              <Switch
                                checked={selectedQuality.includes("มือ 1")}
                                onCheckedChange={(checked) => {
                                  const next = checked
                                    ? Array.from(new Set([...selectedQuality, "มือ 1"]))
                                    : selectedQuality.filter((q) => q !== "มือ 1");
                                  setValue("quality", next.join(", "));
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between border rounded-md px-3 py-2">
                              <span className="text-sm">มือ 2</span>
                              <Switch
                                checked={selectedQuality.includes("มือ 2")}
                                onCheckedChange={(checked) => {
                                  const next = checked
                                    ? Array.from(new Set([...selectedQuality, "มือ 2"]))
                                    : selectedQuality.filter((q) => q !== "มือ 2");
                                  setValue("quality", next.join(", "));
                                }}
                              />
                            </div>

                            <p className="text-xs text-muted-foreground">
                              เลือกได้: ไม่เลือกเลย / มือ 1 / มือ 2 / หรือเลือกทั้งสองอย่าง
                            </p>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />


                  
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-semibold">Stock Input Mode</h3>
                      <p className="text-sm text-muted-foreground">
                        Keep this product in one mode so the saved inventory stays clear.
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setInputMode("variant")}
                        className={`rounded-lg border p-4 text-left transition ${
                          inputMode === "variant"
                            ? "border-slate-900 bg-slate-50 shadow-sm"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="text-sm font-semibold">Use Variant</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Keep product options in variant and inventory rows.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInputMode("direct")}
                        className={`rounded-lg border p-4 text-left transition ${
                          inputMode === "direct"
                            ? "border-emerald-700 bg-emerald-50 shadow-sm"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <div className="text-sm font-semibold">No Variant</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Save one direct price and stock value without variant rows.
                        </p>
                      </button>
                    </div>
                  </div>

                  {inputMode === "variant" ? (
                    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold">Variant Setup</h3>
                        <p className="text-sm text-muted-foreground">
                          Save will confirm that this product should use variant data.
                        </p>
                      </div>

                      {fields.map((_, vIndex) => (
                        <VariantItem
                          key={vIndex}
                          vIndex={vIndex}
                          control={control}
                          register={form.register}
                          onDeleteVariant={onDeleteVariant}
                          onDeleteInventory={onDeleteInventory}
                        />
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          append({
                            variant_name: "",
                            inventories: [
                              { inventory_name: "", price: 0, stock: 0 },
                            ],
                          })
                        }
                      >
                        <FiPlus /> Add Variant
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold">Direct Price And Stock</h3>
                        <p className="text-sm text-muted-foreground">
                          This mode stores one sellable inventory named {DIRECT_INVENTORY_NAME}.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={control}
                          name="direct_price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Price</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  value={field.value ?? ""}
                                  aria-invalid={isBlankField("direct_price")}
                                  className={blankFieldClass(isBlankField("direct_price"))}
                                  onChange={(event) => {
                                    const raw = event.target.value;
                                    field.onChange(raw === "" ? "" : Number(raw));
                                    clearBlankField("direct_price");
                                  }}
                                />
                              </FormControl>
                              {isBlankField("direct_price") && (
                                <p className="text-[11px] font-semibold text-red-600">
                                  ⚠️ เว้นว่างไว้ ระบบใส่ 0 ให้แล้ว — กด Save อีกครั้งเพื่อยืนยัน
                                </p>
                              )}
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={control}
                          name="direct_stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Stock</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  value={field.value ?? ""}
                                  aria-invalid={isBlankField("direct_stock")}
                                  className={blankFieldClass(isBlankField("direct_stock"))}
                                  onChange={(event) => {
                                    const raw = event.target.value;
                                    field.onChange(raw === "" ? "" : Number(raw));
                                    clearBlankField("direct_stock");
                                  }}
                                />
                              </FormControl>
                              {isBlankField("direct_stock") && (
                                <p className="text-[11px] font-semibold text-red-600">
                                  ⚠️ เว้นว่างไว้ ระบบใส่ 0 ให้แล้ว — กด Save อีกครั้งเพื่อยืนยัน
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => router.back()}
                    >
                      <FiArrowLeft /> Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </form>
              </Form>

              {/* ไฟล์ดาวน์โหลด — RCG / Software Config / Document */}
              <ProductDownloadsPanel productId={String(params.id)} />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
