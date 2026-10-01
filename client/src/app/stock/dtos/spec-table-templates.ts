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

  // ─── Console (ตู้ควบคุม / คอนโซล) ─────────────────────────────
  console: makeTable([
    "Brand",
    "Model",
    "ประเภท",
    "จำนวนช่องควบคุม",
    "ความละเอียดที่รองรับ",
    "Interface (Input)",
    "Interface (Output)",
    "หน้าจอแสดงผล",
    "แรงดันไฟเข้า",
    "กำลังไฟ",
    "ขนาด",
    "น้ำหนัก",
    "มาตรฐาน",
    "การใช้งาน",
  ]),

  // ─── Electrical Line (สายไฟ / สายไฟเลี้ยง) ────────────────────
  "electrical line": makeTable([
    "ประเภทสาย",
    "รุ่น",
    "ขนาดสาย (AWG / ตร.มม.)",
    "จำนวนแกน",
    "วัสดุตัวนำ",
    "ฉนวน",
    "แรงดันใช้งานสูงสุด",
    "กระแสสูงสุด",
    "ความยาวต่อเส้น",
    "สีของสาย",
    "หัวต่อ",
    "อุณหภูมิใช้งาน",
    "มาตรฐาน",
    "การใช้งาน",
  ]),

  // ─── Cable (สายสัญญาณ) ────────────────────────────────────────
  cable: makeTable([
    "ประเภทสาย",
    "รุ่น",
    "หัวต่อปลาย A",
    "หัวต่อปลาย B",
    "ความยาว",
    "มาตรฐานที่รองรับ",
    "ความเร็วในการส่งข้อมูล",
    "วัสดุตัวนำ",
    "การป้องกันสัญญาณรบกวน (Shield)",
    "เส้นผ่านศูนย์กลางสาย",
    "อุณหภูมิใช้งาน",
    "มาตรฐาน",
    "การใช้งาน",
  ]),

  // ─── Computer (คอมพิวเตอร์สำหรับคุมจอ) ────────────────────────
  computer: makeTable([
    "Brand",
    "Model",
    "CPU",
    "RAM",
    "Storage",
    "การ์ดจอ",
    "ช่องต่อภาพออก",
    "ช่องต่อขยาย (PCI / PCIe)",
    "พอร์ตเชื่อมต่อ",
    "ระบบปฏิบัติการ",
    "แหล่งจ่ายไฟ",
    "ขนาด",
    "น้ำหนัก",
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

/**
 * ชื่อหมวดในฐานข้อมูลไม่ตรงกับ key ของ template เป๊ะทุกอัน
 * เช่น หมวด "LED" เก็บสินค้าจอ LED Module ซึ่งใช้ template "module"
 * และหมวด "Sender card" ควรได้ template "sender"
 */
const CATEGORY_ALIASES: Record<string, string> = {
  led: "module",
  "led module": "module",
  "sender card": "sender",
  receiver: "receiver card",
  // ชื่อหมวดในฐานข้อมูลสะกดต่างจาก key ของ template
  "electrical": "electrical line",
  "สายไฟ": "electrical line",
  "สายสัญญาณ": "cable",
  "คอมพิวเตอร์": "computer",
  "คอนโซล": "console",
};

export function getTemplateByCategory(categoryName: string): ProductSpecTable | null {
  const key = (categoryName ?? "").toLowerCase().trim();
  if (!key) return null;

  // 1) ตรงเป๊ะ
  if (SPEC_TABLE_TEMPLATES[key]) return SPEC_TABLE_TEMPLATES[key];

  // 2) ชื่อที่รู้ว่าเรียกต่างกัน
  const alias = CATEGORY_ALIASES[key];
  if (alias && SPEC_TABLE_TEMPLATES[alias]) return SPEC_TABLE_TEMPLATES[alias];

  // 3) ชื่อหมวดขึ้นต้นด้วย key ของ template (เช่น "processor card" → "processor")
  const prefix = Object.keys(SPEC_TABLE_TEMPLATES).find(
    (k) => key === k || key.startsWith(`${k} `)
  );
  return prefix ? SPEC_TABLE_TEMPLATES[prefix] : null;
}
