"use client";
import React, { useEffect, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { Card, CardContent } from "@/components/ui/card";
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SidebarComponent } from "../components/Sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { LoaderIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  InventoryItems,
  StockPagination,
  StockResponse,
  StockRow,
} from "@/types/stock";
import Image from "next/image";
import DeleteButton from "@/components/deleteButton";
import { CategoryData, CategoryResponse } from "@/types/category";
import { DIRECT_INVENTORY_NAME } from "./utils/product-mode";

export default function StockPage() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [stockPagination, setStockPagination] =
    useState<StockPagination | null>(null);

  const [stockRows, setStockRows] = useState<StockRow[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [resStock, resCategory] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/products/stocks?page=${page}&limit=${limit}&search=${search}`,
          { method: "GET", credentials: "include" }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/category?page=${page}&limit=${limit}&search=${search}`,
          {
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }
        ),
      ]);

      const resultStock: StockResponse = await resStock.json();
      const resultCategory: CategoryResponse = await resCategory.json();

      if (!resStock.ok || !resultCategory) {
        throw new Error(resultStock.status || "Fetch error");
      }

      const flatRows: StockRow[] = resultStock.data.data.flatMap((product) => {
        if (!product.variants || product.variants.length === 0) return [];

        return product.variants.flatMap((variant) => {
          if (!variant.inventories || variant.inventories.length === 0)
            return [];

          return variant.inventories.map((inv: InventoryItems) => ({
            product_id: product.id_products,
            product_name: product.name,
            image_url: product.images?.[0]?.url,
            category_name: product.category?.name ?? "-",

            variant_id: variant.variant_id,
            variant_name: variant.variant_name || "No Variant",

            inventory_id: inv.inventory_id,
            inventory_name: inv.inventory_name || DIRECT_INVENTORY_NAME,
            price: inv.price,
            stock: inv.stock,
          }));
        });
      });

      setStockPagination(resultStock.data);
      setStockRows(flatRows);
      setCategoryData(resultCategory.data.data);
    } catch (err) {
      console.error(err);
      setError("Loading failed");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnDef<StockRow>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value: boolean) =>
              table.toggleAllPageRowsSelected(value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex justify-center items-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 20,
    },
    // ✅ product_id
    {
      accessorKey: "inventory_id",
      header: "ID",
      size: 80,
      cell: ({ row }) => {
        const inventoryId = row.original.inventory_id;
        const productId = row.original.product_id;

        return (
          <div className="text-center">
            <Link
              href={{
                pathname: `/stock/detail/${productId}`,
                query: { categoryData: JSON.stringify(categoryData) },
              }}
              
              className="text-blue-600 hover:underline"
            >
              {inventoryId}
            </Link>
          </div>
        );
      },
    },
    // ✅ product_name
    {
      accessorKey: "product_name",
      header: "Product",
      size: 520,
      minSize: 420,
      maxSize: 560,
      cell: ({ row }) => {
        const name = row.getValue<string>("product_name");
        const imageUrl = row.original.image_url;

        return (
          <div className="flex min-w-0 items-center gap-3 text-left">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={name}
                width={100}
                height={60}
                priority
                className="rounded-md object-cover border"
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                N/A
              </div>
            )}

            <span className="min-w-0 max-w-full whitespace-normal break-words text-sm font-medium leading-snug">
              {name}
            </span>
          </div>
        );
      },
    },

    // ✅ variant_name
    {
      accessorKey: "variant_name",
      header: "Variant",
      size: 140,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("variant_name")}</div>
      ),
    },

    // ✅ inventory_name
    {
      accessorKey: "inventory_name",
      header: "Inventory",
      size: 140,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("inventory_name")}</div>
      ),
    },

    // ✅ stock (แทน totalQuantity)
    {
      accessorKey: "stock",
      header: "Stock",
      size: 90,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("stock")}</div>
      ),
    },

    // ✅ status (คำนวณจาก stock)
    {
      id: "status",
      header: "Status",
      size: 120,
      accessorFn: (row) => {
        if (row.stock === 0) return "OutOfStock";
        if (row.stock < 20) return "LowStock";
        return "InStock";
      },
      cell: ({ getValue }) => {
        const status = getValue<string>();
        const colorMap: Record<string, string> = {
          LowStock: "bg-yellow-500 text-white",
          InStock: "bg-green-700 text-white",
          OutOfStock: "bg-red-700 text-white",
        };

        return (
          <div className="flex justify-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${colorMap[status]}`}
            >
              {status.replace(/([A-Z])/g, " $1").trim()}
            </span>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: stockRows,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),

    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const pageCount = table.getPageCount();
  const pageIndex = table.getState().pagination.pageIndex;

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

  const selectedProductIds = Array.from(
    new Set(
      table
        .getSelectedRowModel()
        .rows.map((row) => row.original.product_id)
    )
  );

  return (
    <SidebarComponent>
      <div className="px-5">
        <Card>
          <div className="text-center mt-5">
            <p className="text-4xl font-semibold">Stock Management</p>
          </div>

          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <Input
                  placeholder="Search product..."
                  value={search}
                  onChange={(e) => {
                    setPage(1);
                    setSearch(e.target.value);
                  }}
                  className="w-100"
                />
              </div>
              <div className="flex flex-wrap items-center gap-5 md:flex-row">
                <Link
                  href={{
                    pathname: "/stock/create",
                    query: { categoryData: JSON.stringify(categoryData) },
                  }}
                >
                  <Button>Create</Button>
                </Link>
                <DeleteButton
                  endpoint="products"
                  ids={selectedProductIds}
                  confirmMessage="ต้องการลบสินค้าทั้ง Product จากรายการที่เลือกใช่ไหม?"
                  disabled={selectedProductIds.length === 0}
                  onSuccess={async () => {
                    table.resetRowSelection();
                    await fetchData();
                  }}
                />
              </div>
            </div>
            <div className="overflow-hidden rounded-md border w-full">
              <Table className="w-full">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          style={{ width: header.getSize() }}
                          className="text-center"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
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
                            Not Found Inventory
                          </TableCell>
                        </TableRow>
                      )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
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
            <div className="flex items-center space-x-2 py-4">
              <Pagination className="justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!table.getCanPreviousPage()) return;
                        table.previousPage();
                      }}
                      className={
                        table.getCanPreviousPage()
                          ? ""
                          : "pointer-events-none opacity-50 cursor-not-allowed"
                      }
                    />
                  </PaginationItem>

                  {paginationRange.map((page, idx) =>
                    page === "..." ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={
                            page === table.getState().pagination.pageIndex + 1
                          }
                          onClick={(e) => {
                            e.preventDefault();
                            table.setPageIndex(page - 1);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!table.getCanNextPage()) return;
                        table.nextPage();
                      }}
                      className={
                        table.getCanNextPage()
                          ? ""
                          : "pointer-events-none opacity-50 cursor-not-allowed"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>
      </div>
    </SidebarComponent>
  );
}
