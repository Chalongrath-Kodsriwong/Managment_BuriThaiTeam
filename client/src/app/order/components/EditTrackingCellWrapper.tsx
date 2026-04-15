"use client";

import React, { useState } from "react";
import { OrderInterface } from "@/types/order";
import { EditTrackingCell } from "./trackingCell";

type Props = {
  row: { original: OrderInterface };
  onValueChange?: (payload: {
    tracking_number: string;
    paymentStatus: OrderInterface["paymentStatus"];
  }) => void;
};

export function EditableTrackingWrapper({ row, onValueChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const value = row.original.tracking_number === "-" ? "" : row.original.tracking_number;
  const orderId = Number(row.original.sku.split("-")[1]);
  const currentStatus = row.original.paymentStatus;

  const handleSave = async (newValue: string) => {
    const normalizedValue = newValue.trim();

    if (!normalizedValue) {
      setError("Tracking number is required");
      return;
    }

    if (normalizedValue === value && currentStatus === "success") return;

    setLoading(true);
    setError("");

    const nextStatus: OrderInterface["paymentStatus"] = "success";
    const payload =
      currentStatus === "success"
        ? { tracking_number: normalizedValue }
        : { status: nextStatus, tracking_number: normalizedValue };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/order-management/${orderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Update failed");

      if (onValueChange) {
        onValueChange({
          tracking_number: normalizedValue,
          paymentStatus: nextStatus,
        });
      }
      console.log("Tracking updated:", normalizedValue);
    } catch (err) {
      console.error(err);
      setError("Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EditTrackingCell
        value={value}
        onSave={handleSave}
        disabled={loading}
      />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
