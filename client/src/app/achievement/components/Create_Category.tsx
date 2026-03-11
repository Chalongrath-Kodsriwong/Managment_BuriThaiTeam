"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateCategoryProps } from "@/types/achievement";

const CreateCategory: React.FC<CreateCategoryProps> = ({
  API_URL,
  onSuccess,
  onClose,
}) => {
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError(null);

    if (!newCategoryName.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/archive/category/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newCategoryName }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.message || "Failed to create category.");
        return;
      }

      onSuccess(data.data); // 🔥 ส่ง category กลับไป Edit popup
      onClose();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg w-80">
        <h2 className="text-xl font-semibold mb-4">Create Category</h2>

        {error && (
          <div className="mb-3 p-2 bg-red-100 text-red-600 rounded text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <Label>Name</Label>
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCategory;