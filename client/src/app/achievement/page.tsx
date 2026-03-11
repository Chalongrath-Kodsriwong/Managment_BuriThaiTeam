"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Pencil, X } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { LoaderIcon } from "lucide-react";

import { SidebarComponent } from "../components/Sidebar";
import UploadAchiev from "./components/Upload_Achiev";
import EditAchiev from "./components/Edit_Achiev";
import CreateCategory from "./components/Create_Category";
import ManageCategory from "./components/Manage_Category";

import {
  ArchiveCategoryItem,
  ArchiveCategoryPagination,
  ArchiveCategoryResponse,
  CategoryItem,
  CategoryPaginationResponse,
} from "@/types/achievement";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

// Remaining code...
export default function Page() {
  const [archiveCategory, setArchiveCategory] =
    useState<ArchiveCategoryPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1); // Pagination page
  const limit = 10;
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editingItem, setEditingItem] = useState<ArchiveCategoryItem | null>(
    null,
  ); // เก็บข้อมูลที่กำลังแก้ไข

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [editError, setEditError] = useState<string | null>(null);
  const [originalItem, setOriginalItem] = useState<ArchiveCategoryItem | null>(
    null,
  );

  // สำหรับการเปิด Popup ของ Manage Category
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const [manageLocalCategories, setManageLocalCategories] = useState<
    CategoryItem[]
  >([]);
  const [manageError, setManageError] = useState<string | null>(null);
  // const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(
    null,
  );
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryError, setEditCategoryError] = useState<string | null>(
    null,
  );

  // สำหรับการเปิด Popup ของ Upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [deleteAlert, setDeleteAlert] = useState<string | null>(null);

  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/archive/category/`, {
        method: "GET",
        credentials: "include",
      });

      const result: CategoryPaginationResponse = await res.json();

      if (!res.ok) throw new Error("Failed to fetch categories");

      setCategories(result.data.data);
    } catch (err) {
      console.error("Category fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ดึงข้อมูลจาก API
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/archive/?page=${page}&limit=${limit}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const data: ArchiveCategoryResponse = await res.json();

      if (!res.ok) throw new Error(data?.status || "Fetch error");

      setArchiveCategory(data.data);
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
      setArchiveCategory(null);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Dependency array contains only "page", so it only re-runs when "page" changes

  const rows = archiveCategory?.data ?? [];

  const allSelectedOnPage = useMemo(() => {
    if (rows.length === 0) return false;
    const pageIds = rows
      .map((r) => Number(r.id))
      .filter((n) => !Number.isNaN(n));
    return (
      pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id))
    );
  }, [rows, selectedIds]);

  // ฟังก์ชันสำหรับการเลือกทุกแถว
  const toggleSelectAllOnPage = () => {
    const pageIds = archiveCategory?.data
      .map((r) => Number(r.id))
      .filter((n) => !Number.isNaN(n));

    if (pageIds?.length === 0) return;

    setSelectedIds((prev) => {
      const isAll = pageIds!.every((id) => prev.includes(id));
      if (isAll) {
        return prev.filter((id) => !pageIds!.includes(id));
      }
      const merged = new Set([...prev, ...pageIds!]);
      return Array.from(merged);
    });
  };

  // ฟังก์ชันสำหรับการเลือกแถวเดียว
  const toggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // ฟังก์ชันการลบข้อมูลที่เลือก
  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      setDeleteAlert("Please Select Item on column cell");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/archive/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setSelectedIds([]);
        fetchData();
      } else {
        setDeleteAlert(data.message || "Failed to delete");
      }
    } catch {
      setDeleteAlert("Something went wrong.");
    }
  };

  // ฟังก์ชันในการส่งข้อมูลขึ้น API
  const handleUpload = async (
    title: string,
    description: string,
    category: string,
    images: File[],
  ) => {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("id_category", category);
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const res = await fetch(`${API_URL}/archive/`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        console.log("Upload successful:", data);
        fetchData(); // Refresh data
        setIsUploadModalOpen(false);
      } else {
        setError(data.message || "Failed to upload");
      }
    } catch (error) {
      setError("Something went wrong");
    }
  };

  // เมื่อคลิกปุ่ม Edit จะเปิด Popup
  const handleEditClick = (item: ArchiveCategoryItem) => {
    const clonedItem = { ...item }; // clone object

    setEditingItem(clonedItem);
    setOriginalItem(clonedItem);
  };

  const handleSaveEditCategory = async () => {
    if (!editingCategory) return;

    if (!editCategoryName.trim()) {
      setEditCategoryError("Category name is required.");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/archive/category/${editingCategory.id_category}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: editCategoryName }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setEditCategoryError(data?.message || "Failed to update category.");
        return;
      }

      // 🔥 อัปเดต manageLocalCategories
      setManageLocalCategories((prev) =>
        prev.map((cat) =>
          cat.id_category === editingCategory.id_category
            ? { ...cat, name: editCategoryName }
            : cat,
        ),
      );

      // 🔥 อัปเดต categories global
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id_category === editingCategory.id_category
            ? { ...cat, name: editCategoryName }
            : cat,
        ),
      );

      setIsEditCategoryOpen(false);
      setEditingCategory(null);
    } catch {
      setEditCategoryError("Something went wrong.");
    }
  };

  return (
    <SidebarComponent>
      <div className="w-full p-4 md:p-6">
        <Card className="w-full">
          <div className="text-center mt-5">
            <p className="text-4xl font-semibold">Achievements Management</p>
          </div>

          {/* ปุ่ม Upload อยู่ขวาบน */}
          <div className="flex justify-end items-center mb-4 mx-7 gap-4">
            <button
              className="bg-green-600 text-white px-4 py-2 rounded ml-4"
              onClick={() => setIsManageOpen(true)}
            >
              Manage Category
            </button>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Upload Achievement
            </button>

            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={handleDelete}
            >
              Delete Selected
            </button>
          </div>

          <CardContent>
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
              <div className="overflow-hidden rounded-md border w-full">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] pl-4">
                        <input
                          type="checkbox"
                          checked={allSelectedOnPage}
                          onChange={toggleSelectAllOnPage}
                        />
                      </TableHead>
                      <TableHead className="w-[120px]">ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {rows.length ? (
                      rows.map((row) => {
                        const id = Number(row.id);
                        const safeId = Number.isNaN(id) ? undefined : id;

                        return (
                          <TableRow key={safeId ?? JSON.stringify(row)}>
                            <TableCell className="pl-4">
                              {safeId !== undefined ? (
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(safeId)}
                                  onChange={() => toggleSelectOne(safeId)}
                                />
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>{safeId ?? "-"}</TableCell>
                            <TableCell>{row.name ?? "-"}</TableCell>
                            <TableCell>{row.description ?? "-"}</TableCell>
                            <TableCell>{row.category_name ?? "-"}</TableCell>
                            <TableCell>
                              <Button onClick={() => handleEditClick(row)}>
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          ว่างเปล่า ยังไม่มีข้อมูล
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* 🔹 Pagination */}
          <div className="py-4">
            <Pagination className="flex justify-end w-full">
              <PaginationContent className="flex space-x-2 pr-4">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    className={
                      page > 1
                        ? ""
                        : "pointer-events-none opacity-50 cursor-not-allowed"
                    }
                  />
                </PaginationItem>

                {[
                  ...Array(Math.ceil((archiveCategory?.total || 0) / limit)),
                ].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={page === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (
                        page < Math.ceil((archiveCategory?.total || 0) / limit)
                      )
                        setPage(page + 1);
                    }}
                    className={
                      page < Math.ceil((archiveCategory?.total || 0) / limit)
                        ? ""
                        : "pointer-events-none opacity-50 cursor-not-allowed"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </Card>

        {/* Upload Achievement Popup */}
        <UploadAchiev
          isModalOpen={isUploadModalOpen}
          toggleModal={() => setIsUploadModalOpen(false)}
          handleUpload={handleUpload}
          categories={categories} // 🔥 เพิ่มตรงนี้
        />
      </div>

      {editingItem && (
        <EditAchiev
          editingItem={editingItem}
          originalItem={originalItem}
          categories={categories}
          API_URL={API_URL}
          fetchData={fetchData}
          onClose={() => {
            setEditingItem(null);
            setOriginalItem(null);
          }}
        />
      )}

      {isEditCategoryOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-80">
            <h2 className="text-xl font-semibold mb-4">Edit Category</h2>

            {editCategoryError && (
              <div className="mb-3 p-2 bg-red-100 text-red-600 rounded text-sm">
                {editCategoryError}
              </div>
            )}

            <div className="mb-4">
              <Label>Name</Label>
              <Input
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditCategoryOpen(false);
                  setEditingCategory(null);
                }}
              >
                Cancel
              </Button>

              <Button
                className="bg-blue-600 text-white"
                onClick={handleSaveEditCategory}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteAlert && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-80 text-center">
            <p className="mb-4 text-lg font-medium text-red-600">
              {deleteAlert}
            </p>

            <Button
              onClick={() => setDeleteAlert(null)}
              className="bg-blue-600 text-white"
            >
              OK
            </Button>
          </div>
        </div>
      )}

      {isManageOpen && (
        <ManageCategory
          API_URL={API_URL}
          categories={categories}
          setCategories={setCategories}
          onClose={() => setIsManageOpen(false)}
        />
      )}
    </SidebarComponent>
  );
}
