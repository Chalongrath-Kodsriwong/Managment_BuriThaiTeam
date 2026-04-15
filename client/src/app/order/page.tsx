"use client";

import React, { useState, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { SidebarComponent } from "../components/Sidebar";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, LoaderIcon } from "lucide-react";
import { ClientOnlyDate } from "@/app/components/ClientOnlyDate";
import { Input } from "@/components/ui/input";
import {
  OrderResponse,
  OrdersData,
  OrderInterface,
  OrderDetails,
} from "@/types/order";
import { EditableStatusCellWrapper } from "./components/EditableStatusCellWrapper";
import { EditableTrackingWrapper } from "./components/EditTrackingCellWrapper";
import { SlipCell } from "./components/slipCell";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function OrderManagement() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [tableOrders, setTableOrders] = useState<OrderInterface[]>([]);
  const [orderData, setOrderData] = useState<OrdersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_URL}/order-management/all?page=${page}&limit=${limit}&search=${search}`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data: OrderResponse = await res.json();

      const flatOrders: OrderInterface[] = data.data.data.orders.map(
        (order: OrderDetails) => ({
          sku: `ORD-${order.id_order}`,
          customerName: `${order.user.first_name} ${order.user.last_name}`,
          orderDate: order.created_at,
          quantity: order.order_items_count,
          totalAmount: order.dynamic_total_price,
          paymentStatus: order.status,
          tracking_number: order.tracking_number ?? "-",

          slipImage: order.payment?.slip_img ?? null,
        })
      );

      setOrderData(data.data.data);
      setTableOrders(flatOrders);
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnDef<OrderInterface>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value: boolean) =>
            table.toggleAllPageRowsSelected(value)
          }
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: "sku",
      header: ({ column }) => (
        <div
          className="flex justify-center cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          SKU <ArrowUpDown className="ml-1 h-4 w-4" />
        </div>
      ),
    },
    {
      accessorKey: "customerName",
      header: ({ column }) => (
        <div
          className="flex justify-center cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ลูกค้า <ArrowUpDown className="ml-1 h-4 w-4" />
        </div>
      ),
    },
    {
      accessorKey: "orderDate",
      header: "Order Date",
      cell: ({ row }) => (
        <ClientOnlyDate date={new Date(row.getValue("orderDate"))} />
      ),
    },
    {
      accessorKey: "quantity",
      header: "จำนวน",
    },
    {
      accessorKey: "totalAmount",
      header: "ยอดรวม",
    },
    {
      accessorKey: "paymentStatus",
      header: "สถานะ",
      cell: ({ row }) => (
        <EditableStatusCellWrapper
          row={row}
          onValueChange={(newStatus) => {
            setTableOrders((prev) =>
              prev.map((o) =>
                o.sku === row.original.sku
                  ? { ...o, paymentStatus: newStatus }
                  : o
              )
            );
          }}
        />
      ),
    },
    {
      id: "paymentSlip",
      header: "สลิป",
      cell: ({ row }) => <SlipCell slipImage={row.original.slipImage} />,
    },
    {
      accessorKey: "tracking_number",
      header: "Tracking",
      cell: ({ row }) => (
        <EditableTrackingWrapper
          row={row}
          onValueChange={(payload) => {
            setTableOrders((prev) =>
              prev.map((o) =>
                o.sku === row.original.sku
                  ? {
                      ...o,
                      tracking_number: payload.tracking_number,
                      paymentStatus: payload.paymentStatus,
                    }
                  : o
              )
            );
          }}
        />
      ),
    },
  ];

  const table = useReactTable({
    data: tableOrders,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 20 } },
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
        if (l !== undefined && i - l > 1) range.push("...");
        range.push(i);
        l = i;
      }
    }
    return range;
  }, [pageCount, pageIndex]);

  // Dashboard cards (เหมือนเดิม)
  const orderCards = orderData
    ? [
        {
          title: "คำสั่งซื้อทั้งหมด",
          value: orderData.totalOrders,
          icon: "📦",
        },
        {
          title: "รอดำเนินการ",
          value: orderData.pendingOrdersCount,
          icon: "⏳",
        },
        { title: "สำเร็จแล้ว", value: orderData.completeCount, icon: "✅" },
      ]
    : [];

  return (
    <SidebarComponent>
      <div className="px-5">
        <Card>
          <div className="text-center">
            <p className="text-4xl font-semibold">Order Management</p>
          </div>

          <div className="py-10 flex flex-row gap-6 justify-center flex-nowrap overflow-x-auto">
            {orderCards.map((card, i) => (
              <Card
                key={i}
                className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 max-w-xs h-full max-h-full"
              >
                <CardHeader>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-row items-center gap-4 pb-2">
                      <p className="text-5xl">{card.icon}</p>
                      <CardTitle className="text-xl">{card.title}</CardTitle>
                    </div>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <Input
                placeholder="Search account..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
                className="w-80"
              />
            </div>

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
                              Not Found Category
                            </TableCell>
                          </TableRow>
                        )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && tableOrders.length > 0 && (
              <div className="flex items-center space-x-2 py-4 justify-center">
                <Pagination className="flex justify-end">
                  <PaginationContent className="w-full justify-end">
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (!table.getCanPreviousPage()) return;
                          table.previousPage();
                        }}
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
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarComponent>
  );
}
