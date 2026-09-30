"use client";

import { useState } from "react";
import { FiMinus, FiPlus, FiSave, FiTrash2, FiMenu } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createEmptySpecTable,
  ProductSpecTable,
} from "../dtos/spec-table.dto";

type SpecificationTableEditorProps = {
  value?: ProductSpecTable | null;
  onChange: (value: ProductSpecTable) => void;
  onSaveTemplate?: (() => void) | null;
};

const normalizeTable = (value?: ProductSpecTable | null): ProductSpecTable => {
  if (!value) return createEmptySpecTable();

  const columnHeaders =
    Array.isArray(value.columnHeaders) && value.columnHeaders.length > 0
      ? value.columnHeaders
      : [""];

  const rows =
    Array.isArray(value.rows) && value.rows.length > 0
      ? value.rows.map((row) => ({
          label: row?.label ?? "",
          values: columnHeaders.map((_, index) => row?.values?.[index] ?? ""),
        }))
      : [{ label: "", values: columnHeaders.map(() => "") }];

  return {
    firstColumnHeader:
      value.firstColumnHeader === undefined || value.firstColumnHeader === null
        ? "Model"
        : value.firstColumnHeader,
    columnHeaders,
    rows,
  };
};

export function SpecificationTableEditor({
  value,
  onChange,
  onSaveTemplate,
}: SpecificationTableEditorProps) {
  const table = normalizeTable(value);

  // แถวที่กำลังลาก และแถวที่เมาส์อยู่เหนือ (ใช้วาดเส้นบอกตำแหน่งที่จะวาง)
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const updateTable = (nextTable: ProductSpecTable) => {
    onChange(normalizeTable(nextTable));
  };

  const updateFirstColumnHeader = (nextHeader: string) => {
    updateTable({ ...table, firstColumnHeader: nextHeader });
  };

  const updateColumnHeader = (columnIndex: number, nextValue: string) => {
    updateTable({
      ...table,
      columnHeaders: table.columnHeaders.map((header, index) =>
        index === columnIndex ? nextValue : header
      ),
    });
  };

  const addColumn = () => {
    updateTable({
      ...table,
      columnHeaders: [...table.columnHeaders, ""],
      rows: table.rows.map((row) => ({
        ...row,
        values: [...row.values, ""],
      })),
    });
  };

  const removeColumn = (columnIndex: number) => {
    if (table.columnHeaders.length === 1) return;

    updateTable({
      ...table,
      columnHeaders: table.columnHeaders.filter((_, index) => index !== columnIndex),
      rows: table.rows.map((row) => ({
        ...row,
        values: row.values.filter((_, index) => index !== columnIndex),
      })),
    });
  };

  const updateRowLabel = (rowIndex: number, nextLabel: string) => {
    updateTable({
      ...table,
      rows: table.rows.map((row, index) =>
        index === rowIndex ? { ...row, label: nextLabel } : row
      ),
    });
  };

  const updateRowValue = (
    rowIndex: number,
    columnIndex: number,
    nextValue: string
  ) => {
    updateTable({
      ...table,
      rows: table.rows.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              values: row.values.map((valueItem, valueIndex) =>
                valueIndex === columnIndex ? nextValue : valueItem
              ),
            }
          : row
      ),
    });
  };

  const addRow = () => {
    updateTable({
      ...table,
      rows: [...table.rows, { label: "", values: table.columnHeaders.map(() => "") }],
    });
  };

  /**
   * สลับลำดับแถว — ลากที่ไอคอน ☰ หน้าแต่ละหัวข้อ
   *
   * ใช้ HTML5 drag ในตัวเบราว์เซอร์ ไม่ต้องลง library เพิ่ม
   * ตั้ง draggable ไว้ที่ตัวจับอย่างเดียว ไม่ใช่ทั้งแถว ไม่งั้นจะลากตอนเลือกข้อความในช่องกรอกไม่ได้
   */
  const moveRow = (from: number, to: number) => {
    if (from === to || to < 0 || to >= table.rows.length) return;
    const rows = [...table.rows];
    const [moved] = rows.splice(from, 1);
    rows.splice(to, 0, moved);
    updateTable({ ...table, rows });
  };

  const removeRow = (rowIndex: number) => {
    if (table.rows.length === 1) return;
    updateTable({
      ...table,
      rows: table.rows.filter((_, index) => index !== rowIndex),
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
      <div className="space-y-1">
        <h3 className="font-semibold">Product Specification Table</h3>
        <p className="text-sm text-muted-foreground">
          Create a comparison/specification table that will appear on the product
          detail page.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" size="lg" className="text-base font-semibold px-6 h-11" onClick={addColumn}>
            <FiPlus /> Add Column
          </Button>
          <Button type="button" variant="outline" size="lg" className="text-base font-semibold px-6 h-11" onClick={addRow}>
            <FiPlus /> Add Row
          </Button>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            size="lg"
            className="text-base font-bold px-7 h-11 !bg-blue-800 hover:!bg-blue-900 !text-white !border-0 disabled:!opacity-50 disabled:!bg-blue-800"
            onClick={onSaveTemplate ?? undefined}
            disabled={!onSaveTemplate}
            title={!onSaveTemplate ? "เลือก Category ก่อนถึงจะบันทึก Format ได้" : "บันทึก Format หัวข้อสำหรับ Category นี้"}
          >
            <FiSave /> บันทึก Format
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            className="text-base font-bold px-7 h-11"
            onClick={() => {
              if (window.confirm("ลบหัวข้อและข้อมูลในตารางทั้งหมดใช่ไหม?")) {
                onChange(createEmptySpecTable());
              }
            }}
          >
            <FiTrash2 /> Clear All
          </Button>
        </div>
      </div>

      <Table className="table-fixed border">
        <TableHeader>
          <TableRow className="bg-slate-100">
            <TableHead className="w-[240px] whitespace-normal align-top">
              <Input
                value={table.firstColumnHeader}
                onChange={(event) => updateFirstColumnHeader(event.target.value)}
                placeholder="Left header"
              />
            </TableHead>
            {table.columnHeaders.map((header, columnIndex) => (
              <TableHead
                key={`header-${columnIndex}`}
                className="min-w-[160px] whitespace-normal align-top"
              >
                <div className="flex items-start gap-2">
                  <Input
                    value={header}
                    onChange={(event) =>
                      updateColumnHeader(columnIndex, event.target.value)
                    }
                    placeholder={`Column ${columnIndex + 1}`}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => removeColumn(columnIndex)}
                    disabled={table.columnHeaders.length === 1}
                  >
                    <FiMinus />
                  </Button>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {table.rows.map((row, rowIndex) => (
            <TableRow
              key={`row-${rowIndex}`}
              onDragOver={(e) => {
                if (dragIndex === null) return;
                e.preventDefault();          // ไม่ preventDefault เบราว์เซอร์จะไม่ยอมให้วาง
                setOverIndex(rowIndex);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) moveRow(dragIndex, rowIndex);
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={
                dragIndex === rowIndex
                  ? "opacity-40"
                  : overIndex === rowIndex && dragIndex !== null
                    ? "bg-blue-50 outline outline-2 outline-blue-400"
                    : ""
              }
            >
              <TableCell className="align-top whitespace-normal">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      setDragIndex(rowIndex);
                      e.dataTransfer.effectAllowed = "move";
                      // Firefox ต้องมีข้อมูลใน dataTransfer ไม่งั้นไม่เริ่มลาก
                      e.dataTransfer.setData("text/plain", String(rowIndex));
                    }}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setOverIndex(null);
                    }}
                    title="กดค้างแล้วลากเพื่อสลับลำดับหัวข้อ"
                    aria-label={`ลากเพื่อย้ายลำดับแถวที่ ${rowIndex + 1}`}
                    className="mt-1 flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded border border-slate-300 bg-white text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing"
                  >
                    <FiMenu className="h-4 w-4" />
                  </button>
                  <Input
                    value={row.label}
                    onChange={(event) =>
                      updateRowLabel(rowIndex, event.target.value)
                    }
                    placeholder={`Row ${rowIndex + 1}`}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => removeRow(rowIndex)}
                    disabled={table.rows.length === 1}
                  >
                    <FiMinus />
                  </Button>
                </div>
              </TableCell>

              {table.columnHeaders.map((_, columnIndex) => (
                <TableCell
                  key={`row-${rowIndex}-column-${columnIndex}`}
                  className="align-top whitespace-normal"
                >
                  <Input
                    value={row.values[columnIndex] ?? ""}
                    onChange={(event) =>
                      updateRowValue(rowIndex, columnIndex, event.target.value)
                    }
                    placeholder="Value"
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
