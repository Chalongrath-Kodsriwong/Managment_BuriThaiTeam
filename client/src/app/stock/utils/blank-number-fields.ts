"use client";

import { useCallback, useState } from "react";

/**
 * กันเคส "ลบตัวเลขในช่องราคา/จำนวนออกจนว่าง แล้วกด Save"
 *
 * ช่องพวกนี้ register ด้วย valueAsNumber ถ้าเว้นว่างค่าที่ได้จะเป็น NaN
 * แล้วถูกส่งขึ้น API เป็น null ทำให้ข้อมูลเพี้ยนโดยไม่มีใครรู้
 *
 * พฤติกรรมที่ต้องการ (user กำหนด 10 ก.ย. 2026):
 *   กด Save ทั้งที่ช่องว่าง → เติม 0 กลับให้ + ขึ้นกรอบแดง + ไม่บันทึก + เตือน
 *   คนดูแลตรวจแล้วกด Save ซ้ำ ถึงจะบันทึกด้วยค่า 0
 */
export const isBlankNumber = (value: unknown) =>
  value === "" ||
  value === null ||
  value === undefined ||
  (typeof value === "number" && Number.isNaN(value)) ||
  Number.isNaN(Number(value));

export const BLANK_NUMBER_WARNING =
  "มีช่องราคา/จำนวนที่เว้นว่างไว้ ระบบใส่ค่า 0 ให้แล้ว — กรุณาตรวจสอบช่องที่ขึ้นกรอบสีแดง แล้วกด Save อีกครั้ง";

/** class ของ input ตอนโดนทำเครื่องหมายว่าเว้นว่าง */
export const blankFieldClass = (invalid: boolean) =>
  invalid
    ? "border-2 border-red-500 bg-red-50 text-red-700 placeholder:text-red-300 focus-visible:ring-red-400"
    : "";

export function useBlankNumberFields() {
  const [blankFields, setBlankFields] = useState<string[]>([]);

  const isBlankField = useCallback(
    (name: string) => blankFields.includes(name),
    [blankFields]
  );

  /** พอคนดูแลพิมพ์ใหม่ กรอบแดงของช่องนั้นหายไปเลย ไม่ต้องรอกด Save */
  const clearBlankField = useCallback((name: string) => {
    setBlankFields((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : prev
    );
  }, []);

  const resetBlankFields = useCallback(() => setBlankFields([]), []);

  /**
   * ตรวจ list ของช่องที่ส่งมา — ช่องไหนว่างให้ยัด 0 กลับเข้า form
   * คืนชื่อช่องที่ว่าง (ว่าง = ยังบันทึกไม่ได้รอบนี้)
   */
  const collectBlankFields = useCallback(
    (
      entries: { name: string; value: unknown }[],
      setValue: (name: string, value: number) => void
    ) => {
      const blanks = entries
        .filter((entry) => isBlankNumber(entry.value))
        .map((entry) => entry.name);

      blanks.forEach((name) => setValue(name, 0));
      setBlankFields(blanks);
      return blanks;
    },
    []
  );

  return {
    blankFields,
    isBlankField,
    clearBlankField,
    resetBlankFields,
    collectBlankFields,
  };
}
