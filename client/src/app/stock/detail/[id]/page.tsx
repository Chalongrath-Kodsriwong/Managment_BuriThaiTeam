"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
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
import { SpecificationTableEditor } from "../../components/SpecificationTableEditor";
import {
  buildDirectVariantsPayload,
  DIRECT_INVENTORY_NAME,
  isDirectVariant,
  ProductInputMode,
  sanitizeVariantsPayload,
} from "../../utils/product-mode";

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
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [inputMode, setInputMode] = useState<ProductInputMode>("variant");
  const [directVariantId, setDirectVariantId] = useState<number | undefined>();
  const [directInventoryId, setDirectInventoryId] = useState<number | undefined>();

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
      spec_table: createEmptySpecTable(),
      variants: [],
    },
  });

  const { control, reset, setValue, watch } = form;
  const selectedQuality = parseQuality(watch("quality"));

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  /* ===================== VARIANT ITEM ===================== */

  const VariantItem = ({ vIndex, control, register }: VariantItemProps) => {
    const {
      fields,
      append,
      remove: removeInventory,
    } = useFieldArray({
      control,
      name: `variants.${vIndex}.inventories`,
    });

    return (
      <div className="border p-4 rounded-md space-y-4">
        <FormField
          control={control}
          name={`variants.${vIndex}.variant_name`}
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Variant</FormLabel>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteVariant(vIndex)}
                >
                  <FiMinus />
                </Button>
              </div>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {fields.map((inv, iIndex) => (
          <div key={inv.id} className="flex gap-2">
            <Input
              {...register(
                `variants.${vIndex}.inventories.${iIndex}.inventory_name`
              )}
              placeholder="Inventory"
            />
            <Input
              type="number"
              {...register(`variants.${vIndex}.inventories.${iIndex}.price`, {
                valueAsNumber: true,
              })}
              placeholder="Price"
            />
            <Input
              type="number"
              {...register(`variants.${vIndex}.inventories.${iIndex}.stock`, {
                valueAsNumber: true,
              })}
              placeholder="Stock"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onDeleteInventory(vIndex, iIndex, removeInventory)}
            >
              <FiMinus />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ inventory_name: "", price: 0, stock: 0 })}
        >
          <FiPlus /> Add Inventory
        </Button>
      </div>
    );
  };

  /* ===================== FETCH ===================== */
  // Fetch Normal
  const fetchData = React.useCallback(async () => {
    setLoading(true);
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
        spec_table: product.spec_table ?? createEmptySpecTable(),
        variants: directVariant ? [] : productVariants,
      });

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
      setLoading(false);
    }
  }, [params.id, reset]);

  //Submit Form Update
  const onSubmit = async (values: ProductFormValues) => {
    setLoading(true);
    setError("");
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
          setLoading(false);
          return;
        }
      } else {
        if (!(directPrice > 0) || directStock < 0) {
          throw new Error("Please fill in both direct price and direct stock");
        }

        if (!window.confirm("ต้องการใส่ข้อมูลโดยไม่ใช้ Variant ใช่มั้ย")) {
          setLoading(false);
          return;
        }

        variantsPayload = buildDirectVariantsPayload({
          variantId: directVariantId,
          inventoryId: directInventoryId,
          price: directPrice,
          stock: directStock,
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
      await fetchData();
    } catch (submitError) {
      console.error("Update product error:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update product"
      );
    } finally {
      setLoading(false);
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
                  <FormField
                    control={control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
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
                            onValueChange={(value) =>
                              field.onChange(Number(value))
                            }
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
                                  value={field.value ?? 0}
                                  onChange={(event) =>
                                    field.onChange(Number(event.target.value))
                                  }
                                />
                              </FormControl>
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
                                  value={field.value ?? 0}
                                  onChange={(event) =>
                                    field.onChange(Number(event.target.value))
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
