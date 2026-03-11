"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArchiveCategoryItem,
  CategoryItem,
  EditAchievProps,
} from "@/types/achievement";
import CreateCategory from "./Create_Category";
import { Plus } from "lucide-react";

const EditAchiev: React.FC<EditAchievProps> = ({
  editingItem,
  originalItem,
  categories,
  API_URL,
  fetchData,
  onClose,
}) => {
  const [editError, setEditError] = useState<string | null>(null);
  const [localItem, setLocalItem] =
    useState<ArchiveCategoryItem | null>(editingItem);

  const [localCategories, setLocalCategories] =
    useState<CategoryItem[]>(categories);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviewUrls, setNewPreviewUrls] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!localItem || !originalItem) return null;

  // 🔥 เพิ่มรูปใหม่
  const handleAddImages = (files: File[]) => {
    setNewImages((prev) => [...prev, ...files]);

    const urls = files.map((file) => URL.createObjectURL(file));
    setNewPreviewUrls((prev) => [...prev, ...urls]);
  };

  // 🔥 Save แบบรองรับรูป
  const handleSaveEdit = async () => {
    setEditError(null);

    try {
      const selectedCategory = localCategories.find(
        (cat) =>
          String(cat.id_category) === localItem.category_name ||
          cat.name === localItem.category_name
      );

      if (!selectedCategory) {
        setEditError("Invalid category selected.");
        return;
      }

      const formData = new FormData();
      formData.append("title", localItem.name ?? "");
      formData.append("description", localItem.description ?? "");
      formData.append(
        "id_category",
        String(selectedCategory.id_category)
      );

      // 🔥 ส่งรูปใหม่เข้า backend
      newImages.forEach((image) => {
        formData.append("images", image);
      });

      const res = await fetch(
        `${API_URL}/archive/${localItem.id}`,
        {
          method: "PUT",
          body: formData,
          credentials: "include",
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setEditError(
          data?.message ||
            "Failed to update achievement. Please try again."
        );
        return;
      }

      await fetchData();
      onClose();
    } catch {
      setEditError(
        "Something went wrong. Please check your connection."
      );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg w-[520px]">
          <h2 className="text-2xl font-semibold mb-4">
            Edit Achievement
          </h2>

          {/* 🔥 Hidden file input */}
          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(
                e.target.files || []
              );
              handleAddImages(files);
              e.target.value = "";
            }}
          />

          {editError && (
            <div className="mb-4 p-2 bg-red-100 text-red-600 rounded text-sm">
              {editError}
            </div>
          )}

          {/* Name */}
          <div className="mb-4">
            <Label>Name</Label>
            <Input
              value={localItem.name ?? ""}
              onChange={(e) =>
                setLocalItem({
                  ...localItem,
                  name: e.target.value,
                })
              }
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <Label>Description</Label>
            <Input
              value={localItem.description ?? ""}
              onChange={(e) =>
                setLocalItem({
                  ...localItem,
                  description: e.target.value,
                })
              }
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <Label>Category</Label>
            <select
              className="w-full border rounded px-3 py-2"
              value={
                localCategories.find(
                  (cat) =>
                    cat.name === localItem.category_name ||
                    String(cat.id_category) ===
                      localItem.category_name
                )?.id_category || ""
              }
              onChange={(e) =>
                setLocalItem({
                  ...localItem,
                  category_name: e.target.value,
                })
              }
            >
              <option value="">-- Select Category --</option>
              {localCategories.map((cat) => (
                <option
                  key={cat.id_category}
                  value={cat.id_category}
                >
                  {cat.id_category} - {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Images */}
          <div className="mb-4">
            <Label>Images</Label>

            <div className="grid grid-cols-4 gap-3 mt-2">
              {/* รูปเดิม */}
              {localItem.url?.map((imageUrl, index) => (
                <div
                  key={`old-${index}`}
                  className="w-full h-32 border rounded overflow-hidden bg-gray-50"
                >
                  <img
                    src={imageUrl}
                    alt="old"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {/* รูปใหม่ */}
              {newPreviewUrls.map((url, index) => (
                <div
                  key={`new-${index}`}
                  className="w-full h-32 border rounded overflow-hidden bg-gray-50"
                >
                  <img
                    src={url}
                    alt="new"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}

              {/* 🔥 กรอบ + */}
              <div
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="w-full h-32 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
              >
                <Plus size={28} className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(true)}
            >
              + Create Category
            </Button>

            <div className="flex gap-4">
              <Button
                onClick={onClose}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Category Popup */}
      {isCreateOpen && (
        <CreateCategory
          API_URL={API_URL}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={(createdCategory) => {
            setLocalCategories((prev) => [
              ...prev,
              createdCategory,
            ]);

            setLocalItem((prev) =>
              prev
                ? {
                    ...prev,
                    category_name: String(
                      createdCategory.id_category
                    ),
                  }
                : prev
            );
          }}
        />
      )}
    </>
  );
};

export default EditAchiev;