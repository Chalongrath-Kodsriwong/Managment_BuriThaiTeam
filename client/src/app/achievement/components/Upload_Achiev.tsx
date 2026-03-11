"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryItem, UploadAchievProps } from "@/types/achievement";
import { Plus } from "lucide-react";

import CreateCategory from "./Create_Category";

const UploadAchiev: React.FC<UploadAchievProps> = ({
  isModalOpen,
  toggleModal,
  handleUpload,
  categories,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [localCategories, setLocalCategories] =
    useState<CategoryItem[]>(categories);

  // 🔥 Cleanup memory เมื่อ component unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const resetForm = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    setNewTitle("");
    setNewDescription("");
    setNewCategory("");
    setNewImages([]);
    setPreviewUrls([]);
  };

  const onUpload = () => {
    if (!newTitle.trim()) {
      alert("Please enter title");
      return;
    }

    if (!newCategory) {
      alert("Please select category");
      return;
    }

    if (newImages.length === 0) {
      alert("Please select at least one image");
      return;
    }

    handleUpload(newTitle, newDescription, newCategory, newImages);
    resetForm();
  };

  const handleRemoveImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));

    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleAddImages = (files: File[]) => {
    setNewImages((prev) => [...prev, ...files]);

    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...urls]);
  };

  return isModalOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-[500px]">
        <h2 className="text-2xl font-semibold mb-4">Upload Achievement</h2>

        {/* 🔥 Hidden file input */}
        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            handleAddImages(files);
            e.target.value = ""; // reset input
          }}
        />

        <div className="mb-4">
          <Label>Title</Label>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <Label>Description</Label>
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <Label>Category</Label>
          <select
            className="w-full border rounded px-3 py-2"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            <option value="">-- Select Category --</option>
            {localCategories.map((cat) => (
              <option key={cat.id_category} value={cat.id_category}>
                {cat.id_category} - {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* 🔥 Image Grid */}
        <div className="mt-4">
          <Label>Images</Label>

          <div className="grid grid-cols-4 gap-3 mt-2">
            {previewUrls.map((url, index) => (
              <div
                key={index}
                className="relative w-full h-32 border rounded overflow-hidden bg-gray-50"
              >
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-black bg-opacity-60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition"
                >
                  ×
                </button>

                <img
                  src={url}
                  alt={`Preview-${index}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}

            {/* ➕ Add Image Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
            >
              <Plus size={28} className="text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-4 mt-6">
          <div className="">
            <Button
              type="button"
              // variant="outline"
              size="lg"
              onClick={() => setIsCreateOpen(true)}
              className=" bg-green-600 text-white "
            >
              + Create Category
            </Button>
          </div>
          <div className="flex gap-5">
          <Button className="bg-blue-600 text-white" onClick={onUpload} size={"lg"}> 
            Upload
          </Button>
            <Button
              // variant="secondary"
              onClick={() => {
                resetForm();
              toggleModal();
            }}
            size={"lg"}
            >
            Cancel
          </Button>

            </div>
        </div>
      </div>
      {isCreateOpen && (
        <CreateCategory
          API_URL={
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"
          }
          onClose={() => setIsCreateOpen(false)}
          onSuccess={(createdCategory) => {
            // เพิ่มเข้า dropdown
            setLocalCategories((prev) => [...prev, createdCategory]);

            // auto select
            setNewCategory(String(createdCategory.id_category));

            setIsCreateOpen(false);
          }}
        />
      )}
    </div>
  ) : null;
};

export default UploadAchiev;
