import { ProductSpecTable } from "./spec-table.dto";

function makeTable(rows: string[]): ProductSpecTable {
  return {
    firstColumnHeader: "รายการ",
    columnHeaders: ["ข้อมูล"],
    rows: rows.map((label) => ({ label, values: [""] })),
  };
}

export const SPEC_TABLE_TEMPLATES: Record<string, ProductSpecTable> = {
  // ─── LED Module ───────────────────────────────────────────────
  module: makeTable([
    "Brand",
    "Model",
    "Pixel Pitch",
    "ขนาดแผ่นจอ (กว้าง × สูง)",
    "ความละเอียด (pixel)",
    "Brightness",
    "Refresh Rate",
    "Viewing Angle (H / V)",
    "Color Gamut",
    "Power Consumption (max)",
    "Power Consumption (avg)",
    "อุณหภูมิใช้งาน",
    "IP Rating",
    "มาตรฐาน",
    "การใช้งาน",
  ]),

  // ─── Receiver card ────────────────────────────────────────────
  "receiver card": makeTable([
    "Brand",
    "Model",
    "รองรับ Pixel สูงสุด (PWM IC)",
    "รองรับ Pixel สูงสุด (Common IC)",
    "จำนวน HUB75E Port",
    "Parallel RGB Data",
    "Grayscale",
    "Refresh Rate",
    "Color Gamut",
    "Software ที่รองรับ",
    "มาตรฐาน",
    "การใช้งาน",
  ]),

  // ─── Switching Power Supply ───────────────────────────────────
  switching: makeTable([
    "ประเภท",
    "รุ่น",
    "Output Voltage",
    "Output Current",
    "Output Power",
    "Input Voltage",
    "Input Frequency",
    "Efficiency",
    "Protection",
    "Cooling",
    "วัสดุตัวเครื่อง",
    "อุณหภูมิใช้งาน",
    "มาตรฐาน",
    "การใช้งาน",
  ]),

  // ─── Magnet ───────────────────────────────────────────────────
  megnent: makeTable([
    "รุ่น",
    "ประเภท",
    "ขนาดเกลียว",
    "เส้นผ่านศูนย์กลาง",
    "ความสูง (ความยาวทั้งหมด)",
    "แรงดึง (โดยประมาณ)",
    "วัสดุ",
    "การใช้งาน",
    "เหมาะกับ Pixel Pitch",
    "อุณหภูมิใช้งาน",
  ]),

  // ─── Processor ────────────────────────────────────────────────
  processor: makeTable([
    "Brand",
    "Model",
    "ความละเอียดสูงสุด (Input)",
    "ความละเอียดสูงสุด (Output)",
    "จำนวน Output Port",
    "Interface (Input)",
    "Interface (Output)",
    "Refresh Rate",
    "Color Depth",
    "มาตรฐาน",
    "การใช้งาน",
  ]),

  // ─── Sender card ──────────────────────────────────────────────
  sender: makeTable([
    "Brand",
    "Model",
    "ความละเอียดสูงสุด",
    "จำนวน Ethernet Output",
    "Bandwidth ต่อ Port",
    "Interface (Input)",
    "Software ที่รองรับ",
    "มาตรฐาน",
    "การใช้งาน",
  ]),
};

export function getTemplateByCategory(categoryName: string): ProductSpecTable | null {
  const key = categoryName.toLowerCase().trim();
  return SPEC_TABLE_TEMPLATES[key] ?? null;
}
