"use client";

import { FiMinus, FiPlus } from "react-icons/fi";
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
}: SpecificationTableEditorProps) {
  const table = normalizeTable(value);

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

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addColumn}>
          <FiPlus /> Add Column
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <FiPlus /> Add Row
        </Button>
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
            <TableRow key={`row-${rowIndex}`}>
              <TableCell className="align-top whitespace-normal">
                <div className="flex items-start gap-2">
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
