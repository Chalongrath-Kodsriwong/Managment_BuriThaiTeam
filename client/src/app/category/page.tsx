"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
  PaginationLink,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SidebarComponent } from "@/app/components/Sidebar";
import { CategoryData , CategoryResponse, PaginatedCategory  } from "@/types/category";
import { Checkbox } from "@/components/ui/checkbox";
import CreateDialog from "./components/CreateDialog";
import UpdateDialog from "./components/UpdateDialog";
import DeleteButton from "@/components/deleteButton";
import HomeDisplayPanel from "./components/HomeDisplayPanel";


export default function Page() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<PaginatedCategory | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  const [page, setPage] = useState(1);
  const limit = 20;

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);

  /* ---------------- fetch data ---------------- */
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/category?page=${page}&limit=${limit}&search=${search}`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) throw new Error("Fetch failed");

      const json:CategoryResponse = await res.json();
      setData(json.data);
      console.log(json);
    } catch {
      setError("Load data failed");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  const handleCreated = async () => {
    setLoading(true);
    await fetchData();
  };

  const handleEdit = async (category: CategoryData) => {
    setSelectedCategory(category);
    setOpenEdit(true);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------- columns ---------------- */
  const columns: ColumnDef<CategoryData>[] = [
    {
      id: "select",
      size: 80,
      header: ({ table }) => (
        <div className="flex justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value: boolean) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
          />
        </div>
      ),
    },
    {
      header: "Category ID",
      accessorKey: "id_category",
      size: 140,
      cell: ({ row }) => (
        <span
          className="text-center text-blue-600 cursor-pointer hover:underline"
          onClick={() => handleEdit(row.original)}
        >
          {row.original.id_category}
        </span>
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
      size: 200,
      cell: ({ row }) => (
        <span className="block text-center truncate">{row.original.name}</span>
      ),
    },
    {
      header: "Parent Category ID",
      accessorKey: "parent_id",
      size: 180,
      cell: ({ row }) => (
        <span className="block text-center truncate">
          {row.original.parent_id || "-"}
        </span>
      ),
    },
  ];

  /* ---------------- table ---------------- */
  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: true,
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });
  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;
  /* ---------------- pagination (from backend) ---------------- */
  const totalPages = data?.data ? Math.ceil(data.data.length / limit) : 0;
  const paginationRange = React.useMemo(() => {
    const totalPages = pageCount;
    const currentPage = pageIndex + 1;

    const delta = 2;
    const range: (number | "...")[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        if (l !== undefined) {
          if (i - l > 1) {
            range.push("...");
          }
        }
        range.push(i);
        l = i;
      }
    }
    return range;
  }, [pageCount, pageIndex]);

  const selectedIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id_category);

  return (
    <SidebarComponent>
      <Card>
        <div className="text-center mt-5">
          <p className="text-4xl font-semibold">Category</p>
        </div>

        <CardHeader className="flex justify-between gap-4 md:flex-row">
          <Input
            placeholder="Search Data..."
            className="w-80"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
          <div className="flex gap-5">
            <Button onClick={() => setOpenCreate(true)}>Create</Button>
            <DeleteButton
              endpoint="category"
              ids={selectedIds}
              confirmMessage="ต้องการลบหมวดหมู่ เหล่านี้ไหม?"
              disabled={selectedIds.length === 0}
              onSuccess={async () => {
                table.resetRowSelection();
                await fetchData();
              }}
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center py-10">
              <LoaderIcon className="h-10 w-10 animate-spin" />
              <p>Loading data...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 text-lg">
              {error}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table
                  className="table-fixed w-full"
                  style={{ tableLayout: "fixed" }}
                >
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="text-center"
                            style={{ width: header.getSize() }}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>

                  <TableBody>
                    {table.getRowModel().rows.length > 0
                      ? table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="text-center">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      : !loading && (
                          <TableRow>
                            <TableCell
                              colSpan={columns.length}
                              className="text-center py-10"
                            >
                              Not Found Category
                            </TableCell>
                          </TableRow>
                        )}
                  </TableBody>
                </Table>
              </div>

              <Pagination className="justify-end py-4">
                <PaginationContent>
                  {/* Prviouse button */}
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > totalPages) setPage(page - 1);
                      }}
                    />
                  </PaginationItem>

                  {paginationRange.map((p, i) =>
                    p === "..." ? (
                      <PaginationItem key={i}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(p);
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  {/* Next button */}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < totalPages) setPage(page + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </>
          )}
        </CardContent>
        <CreateDialog
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreate={handleCreated}
          mapCategory={data?.data ?? null}
        />
        <UpdateDialog
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          category={selectedCategory}
          onUpdated={fetchData}
          mapCategory={data?.data ?? null}
        />
      </Card>

      {/* ตั้งค่าหมวดหมู่ที่จะโชว์บนหน้าแรกของเว็บหลัก */}
      <HomeDisplayPanel />
    </SidebarComponent>
  );
}
