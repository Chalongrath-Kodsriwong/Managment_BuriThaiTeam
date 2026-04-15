"use client";

import React from "react";
import { EditableStatusCell } from "./statusCell";
import { OrderInterface } from "@/types/order";

type Props = {
  row: { original: OrderInterface };
  onValueChange?: (newStatus: OrderInterface["paymentStatus"]) => void;
};

export function EditableStatusCellWrapper({ row, onValueChange }: Props) {
  const orderId = Number(row.original.sku.split("-")[1]);
  const value = row.original.paymentStatus;

  const handleSave = async (newValue: OrderInterface["paymentStatus"]) => {
    if (newValue === value) return;

    if (newValue === "success") {
      alert("Please save a tracking number to mark this order as success.");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/order-management/${orderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: newValue }),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      if (onValueChange) onValueChange(newValue);
      console.log("Updated:", newValue);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  return (
    <EditableStatusCell
      value={value}
      options={["pending", "confirmed", "checking", "success", "canceled"]}
      colorMap={{
        pending: "bg-yellow-500",
        confirmed: "bg-blue-500",
        checking: "bg-purple-500",
        success: "bg-green-600",
        canceled: "bg-red-600",
      }}
      onSave={handleSave}
    />
  );
}
