"use client";

import type { OrderItemDetail } from "@/types/order";

/**
 * แถวที่กางออกมาใต้ออเดอร์ แสดงว่าในออเดอร์นั้นมีสินค้าอะไรบ้าง
 *
 * เดิมตารางบอกแค่ "จำนวน 2" โดยไม่บอกว่าเป็นสินค้าอะไร
 * ต้องไปเปิดดูที่อื่นทุกครั้งที่ลูกค้าโทรมาถาม
 */
export default function OrderItemsRow({ items }: { items: OrderItemDetail[] }) {
  if (!items?.length) {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        ไม่พบรายการสินค้าในออเดอร์นี้
      </div>
    );
  }

  const total = items.reduce((sum, it) => sum + it.line_total, 0);

  return (
    <div className="flex flex-col gap-2 bg-muted/40 p-3">
      {items.map((it) => (
        <div
          key={it.id_orderitem}
          className="flex items-center gap-3 rounded-md border bg-background p-2.5"
        >
          {it.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={encodeURI(it.image_url)}
              alt=""
              className="h-12 w-12 shrink-0 rounded object-cover"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-muted text-[10px] text-muted-foreground">
              ไม่มีรูป
            </div>
          )}

          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold">{it.name}</p>
            <p className="text-xs text-muted-foreground">
              {[it.variant_name, it.inventory_name].filter(Boolean).join(" · ") || "-"}
              {it.is_preorder && (
                <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                  สั่งจอง
                </span>
              )}
            </p>
          </div>

          <div className="shrink-0 text-right text-sm">
            <p className="text-muted-foreground">
              {it.unit_price.toLocaleString()} × {it.quantity}
            </p>
            <p className="font-semibold">{it.line_total.toLocaleString()} บาท</p>
          </div>
        </div>
      ))}

      <div className="flex justify-end gap-3 pr-2 pt-1 text-sm">
        <span className="text-muted-foreground">รวมค่าสินค้า</span>
        <span className="font-bold">{total.toLocaleString()} บาท</span>
      </div>
    </div>
  );
}
