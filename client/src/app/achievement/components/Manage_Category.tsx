"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Pencil, X } from "lucide-react";
import { CategoryItem, ManageCategoryProps } from "@/types/achievement";
import CreateCategory from "./Create_Category";

const ManageCategory: React.FC<ManageCategoryProps> = ({
  API_URL,
  categories,
  setCategories,
  onClose,
}) => {
  const [manageLocalCategories, setManageLocalCategories] =
    useState<CategoryItem[]>(categories);

  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const [manageError, setManageError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // 🔥 Mark delete (staging)
  const handleMarkDelete = (id: number) => {
    setPendingDeleteIds((prev) => [...prev, id]);
    setManageLocalCategories((prev) =>
      prev.filter((cat) => cat.id_category !== id)
    );
  };

  // 🔥 Save delete
  const handleSaveDelete = async () => {
    if (pendingDeleteIds.length === 0) {
      onClose();
      return;
    }

    try {
      const res = await fetch(`${API_URL}/archive/category/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: pendingDeleteIds }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setManageError(data?.message || "Failed to delete.");
        return;
      }

      setCategories((prev) =>
        prev.filter((cat) => !pendingDeleteIds.includes(cat.id_category))
      );

      onClose();
    } catch {
      setManageError("Something went wrong.");
    }
  };

  // 🔥 Open edit
  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditError(null);
    setIsEditOpen(true);
  };

  // 🔥 Save edit
  const handleSaveEdit = async () => {
    if (!editingCategory) return;

    if (!editName.trim()) {
      setEditError("Category name is required.");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/archive/category/${editingCategory.id_category}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: editName }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setEditError(data?.message || "Update failed.");
        return;
      }

      setManageLocalCategories((prev) =>
        prev.map((cat) =>
          cat.id_category === editingCategory.id_category
            ? { ...cat, name: editName }
            : cat
        )
      );

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id_category === editingCategory.id_category
            ? { ...cat, name: editName }
            : cat
        )
      );

      setIsEditOpen(false);
    } catch {
      setEditError("Something went wrong.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg w-[500px]">

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Manage Categories</h2>

            
          </div>

          {manageError && (
            <div className="mb-3 p-2 bg-red-100 text-red-600 rounded text-sm">
              {manageError}
            </div>
          )}

          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-2">
            {manageLocalCategories.map((cat) => (
              <div
                key={cat.id_category}
                className="flex justify-between items-center border p-3 rounded"
              >
                <div>
                  <p className="font-medium">ID: {cat.id_category}</p>
                  <p className="text-gray-600">{cat.name}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1 rounded text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => handleMarkDelete(cat.id_category)}
                    className="p-1 rounded text-gray-600 hover:text-red-600 hover:bg-gray-100"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              className="bg-green-600 text-white"
              onClick={() => setIsCreateOpen(true)}
            >
              + Create Category
            </Button>
            <Button
              className="bg-blue-600 text-white"
              onClick={handleSaveDelete}
            >
              Save
            </Button>
            <Button
            //   variant="secondary"
              onClick={onClose}
              className="bg-black text-white"
            >
              Cancel
            </Button>

          </div>
        </div>
      </div>

      {isCreateOpen && (
        <CreateCategory
          API_URL={API_URL}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={(created) => {
            setManageLocalCategories((prev) => [...prev, created]);
            setCategories((prev) => [...prev, created]);
          }}
        />
      )}

      {isEditOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-xl font-semibold mb-4">Edit Category</h2>

            {editError && (
              <div className="mb-3 p-2 bg-red-100 text-red-600 rounded text-sm">
                {editError}
              </div>
            )}

            <div className="mb-4">
              <Label>Name</Label>
              <input
                className="w-full border rounded px-3 py-2"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>

              <Button
                className="bg-blue-600 text-white"
                onClick={handleSaveEdit}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageCategory;