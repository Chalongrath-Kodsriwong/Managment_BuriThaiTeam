"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiArrowLeft, FiPlus, FiMinus, FiXCircle } from "react-icons/fi";
import Image from "next/image";
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
import { Switch } from "@/components/ui/switch";
import { UploadedFile } from "../dtos/upload-file.dto";
import { ProductFormValues } from "../dtos/product.dto";
import { VariantItemProps } from "../dtos/variant.dto";
import { createEmptySpecTable } from "../dtos/spec-table.dto";
import { BrandCombobox } from "../components/BrandCombobox";
import { SpecificationTableEditor } from "../components/SpecificationTableEditor";
import {
  buildDirectVariantsPayload,
  ProductInputMode,
  sanitizeVariantsPayload,
} from "../utils/product-mode";

interface Category {
  id_category: number;
  name: string;
  parent_id: number | null;
}

/* ===================== VARIANT ITEM ===================== */
const VariantItem = ({
  vIndex,
  control,
  register,
  onDeleteVariant,
  onDeleteInventory,
}: VariantItemProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variants.${vIndex}.inventories`,
  });

  return (
    <div className="border p-4 rounded-md space-y-4">
      {/* ===== Variant Name ===== */}
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
              <Input {...field} placeholder="Variant name" />
            </FormControl>
          </FormItem>
        )}
      />

      {/* ===== Inventories ===== */}
      {fields.map((inv, iIndex) => (
        <div key={inv.id} className="flex gap-2 items-center">
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
            onClick={() => onDeleteInventory(vIndex, iIndex, remove)}
          >
            <FiMinus />
          </Button>
        </div>
      ))}

      {/* ===== Add Inventory ===== */}
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

/* ===================== MAIN ===================== */

export default function CreateProduct() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedFile[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMode, setInputMode] = useState<ProductInputMode>("variant");

  const [categoryData, setCategoryData] = useState<Category[]>([]);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("categoryData");
    if (!raw) return;

    try {
      setCategoryData(JSON.parse(raw) as Category[]);
    } catch (error) {
      console.error("Invalid categoryData query param", error);
      setCategoryData([]);
    }
  }, []);

  useEffect(() => {
    if (categoryData.length > 0) return;

    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/category?page=1&limit=100`,
          {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        );

        const payload = await response.json().catch(() => null);
        const categories = payload?.data?.data;

        if (!response.ok || !Array.isArray(categories)) {
          throw new Error(payload?.message || "Failed to load categories");
        }

        setCategoryData(categories);
      } catch (fetchError) {
        console.error("Failed to load categories", fetchError);
        setError("Unable to load categories");
      }
    };

    fetchCategories();
  }, [categoryData.length]);

  const form = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      brand: "",
      short_description: "",
      description: "",
      id_category: "",
      direct_price: 0,
      direct_stock: 0,
      spec_table: createEmptySpecTable(),
      variants: [],
    },
  });

  const { control } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const onDeleteVariant = (vIndex: number) => {
    remove(vIndex);
  };

  const onDeleteInventory = (
    _vIndex: number,
    iIndex: number,
    removeInventory: (index: number) => void
  ) => {
    removeInventory(iIndex);
  };

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

    setImages((prev) => {
      const hasImageCover = prev.some(
        (image) =>
          !image.isPdf &&
          !image.isVideo &&
          !image.file?.type.startsWith("video/") &&
          image.type !== "pdf" &&
          image.is_cover
      );

      let shouldAssignFirstCover = !hasImageCover;

      const newImages: UploadedFile[] = Array.from(files).map((file) => {
        const isPdf = file.type === "application/pdf";
        const isVideo = file.type.startsWith("video/");
        const shouldBeCover = !isPdf && !isVideo && shouldAssignFirstCover;

        if (shouldBeCover) {
          shouldAssignFirstCover = false;
        }

        return {
          file,
          preview: URL.createObjectURL(file),
          type: isPdf ? "pdf" : shouldBeCover ? "cover" : "slide",
          is_cover: shouldBeCover,
          isVideo,
          isPdf,
        };
      });

      return [...prev, ...newImages];
    });
  };

  /* ===================== SUBMIT ===================== */

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setError("");

    if (!data.id_category) {
      setError("Please select a category");
      return;
    }

    const sanitizedVariants = sanitizeVariantsPayload(data.variants);
    const directPrice = Number(data.direct_price ?? 0);
    const directStock = Number(data.direct_stock ?? 0);

    let variantsPayload = sanitizedVariants;

    if (inputMode === "variant") {
      if (sanitizedVariants.length === 0) {
        setError("Please add at least one variant or switch to direct stock mode");
        return;
      }

      if (!window.confirm("ต้องการใส่ข้อมูลที่ Variant ใช่มั้ย")) {
        return;
      }
    } else {
      if (!(directPrice > 0) || directStock < 0) {
        setError("Please fill in both direct price and direct stock before saving");
        return;
      }

      if (!window.confirm("ต้องการใส่ข้อมูลโดยไม่ใช้ Variant ใช่มั้ย")) {
        return;
      }

      variantsPayload = buildDirectVariantsPayload({
        price: directPrice,
        stock: directStock,
      });
    }

    setIsSubmitting(true);

    const formData = new FormData();

    formData.append("name", data.name);
    formData.append("brand", data.brand);
    formData.append("short_description", data.short_description);
    formData.append("description", data.description);
    formData.append("id_category", data.id_category);
    formData.append("spec_table", JSON.stringify(data.spec_table ?? null));
    formData.append("variants", JSON.stringify(variantsPayload));

    images.forEach((img) => {
      if (img.file) {
        formData.append("images", img.file);
      }
    });

    formData.append(
      "imagesMeta",
      JSON.stringify(
        images.map((img) => ({
          is_cover: img.is_cover,
          type: img.type,
        }))
      )
    );

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to create product");
      }

      router.push("/stock");
      router.refresh();
    } catch (submitError) {
      console.error("Create product error:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create product"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ===================== UI ===================== */

  return (
    <Form {...form}>
      <Button type="button" variant="outline" onClick={() => router.back()}>
        <FiArrowLeft /> Back
      </Button>

      <Card className="mt-5 mx-10">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Create Product</CardTitle>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* ================= ASSETS ================= */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold">Media And PDF Files</h3>
                <p className="text-sm text-muted-foreground">
                  Upload product images, videos, or PDF documents.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" asChild>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <FiPlus /> Upload Image Or Video
                    <input
                      type="file"
                      multiple
                      hidden
                      accept="image/*,video/*"
                      onChange={(e) => handleUploadImages(e.target.files)}
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
                      onChange={(e) => handleUploadImages(e.target.files)}
                    />
                  </label>
                </Button>
              </div>

              <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                PDF files are stored together with product assets and marked as
                document files.
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,200px)] gap-4">
                {images.map((img, index) => {
                  const isVideo =
                    img.file instanceof File
                      ? img.file.type.startsWith("video/")
                      : isVideoFile(img.preview);
                  const isPdf =
                    img.file instanceof File
                      ? isPdfFile(img.file)
                      : isPdfFile(img.preview);
                  return (
                    <div
                      key={img.id ?? img.preview}
                      className="relative border rounded-md p-2 space-y-2 w-[200px]"
                    >
                      <div className="text-xs font-medium text-muted-foreground">
                        {isPdf ? "PDF Document" : isVideo ? "Video File" : "Image File"}
                      </div>
                      {/* ❌ DELETE (เฉพาะของที่ยังไม่ save) */}
                      {!img.id && (
                        <button
                          type="button"
                          className="absolute top-1 right-1 z-10 cursor-pointer rounded-full p-1 shadow"
                          onClick={() =>
                            setImages((prev) =>
                              prev.filter((_, i) => i !== index)
                            )
                          }
                        >
                          <FiXCircle className="text-red-500 w-4 h-4 " />
                        </button>
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
                            className="object-contain"
                          />
                        )}
                      </div>
                      {/* SWITCH COVER (image only) */}
                      {!isVideo && !isPdf && (
                        <div className="flex justify-between items-center">
                          <Switch
                            checked={img.is_cover}
                            onCheckedChange={(check) => {
                              setImages((prev) =>
                                prev.map((p, i) => {
                                  if (p.file?.type.startsWith("video/"))
                                    return p;
                                  if (i === index) {
                                    return {
                                      ...p,
                                      is_cover: check,
                                      type: check ? "cover" : "slide",
                                    };
                                  }
                                  return {
                                    ...p,
                                    is_cover: false,
                                    type: "slide",
                                  };
                                })
                              );
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
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(value) => field.onChange(Number(value))}
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

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-semibold">Stock Input Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Choose one mode only so the save flow stays clear for the team.
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
                    Use this when the product has options like size, spec, or model.
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
                    Use this when you only want one price and one stock value.
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

                {fields.map((field, vIndex) => (
                  <VariantItem
                    key={field.id}
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
                      inventories: [{ inventory_name: "", price: 0, stock: 0 }],
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
                    Skip variant fields and save one direct price with one stock amount.
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Form>
  );
}
