"use client";

import { useState, useEffect } from "react";
import { SidebarComponent } from "@/app/components/Sidebar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderDashBoard } from "./components/OrderDashBoard";
import { PopularDashBoard } from "./components/PopularDashBoard";
import { DashboardResponse, DashboardData ,PopularData , PopularResponse } from "@/types/dashboard";
import { LoaderIcon, RotateCcw } from "lucide-react";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [popularData, setPopularData] = useState<PopularData | null>(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState<boolean>(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [month, setMonth] = useState<number | undefined>();
  const [year, setYear] = useState<number | undefined>();
  const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/+$/, "");

  const fetchData = async () => {
    setError("");
    setLoading(true);
  
    try {
      const params = new URLSearchParams();
      if (month) params.append("month", month.toString());
      if (year) params.append("year", year.toString());
  
      const [reSummary, rePopular] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard?${params.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/popular?${params.toString()}`, { // 👈 ลบ s
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }),
      ]);
      
  
      if (!reSummary.ok || !rePopular.ok) {
        throw new Error("Fetch failed");
      }
  
      const dataSummary: DashboardResponse = await reSummary.json();
      const dataPopular: PopularResponse = await rePopular.json();
  
      setDashboardData(dataSummary.data);
      setPopularData(dataPopular.data);
  
    } catch (err) {
      console.error("fetch:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSalesDashboard = async () => {
    setResetError("");

    if (!resetPassword.trim()) {
      setResetError("กรุณากรอกรหัสผ่านของผู้ใช้งานปัจจุบัน");
      return;
    }

    setResetSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/dashboard/reset-sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password: resetPassword }),
      });

      let payload: { message?: string } | null = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setResetError(payload?.message || "Reset ไม่สำเร็จ");
        return;
      }

      setResetDialogOpen(false);
      setResetPassword("");
      await fetchData();
    } catch (err) {
      console.error("reset sales dashboard:", err);
      setResetError("Something went wrong. Please try again.");
    } finally {
      setResetSubmitting(false);
    }
  };

  const dashboardCards = dashboardData
    ? [
        {
          title: "คำสั่งซื้อทั้งหมด",
          value: dashboardData.totalOrders ?? 0,
          icon: "📦",
        },
        {
          title: "รอดำเนินการ",
          value: dashboardData.pendingOrdersCount ?? 0,
          icon: "⏳",
        },
        {
          title: "ผู้ใช้งานทั้งหมด",
          value: dashboardData.totalUsers ?? 0,
          icon: "👤",
        },
        {
          title: "รายได้รวม",
          value: `${dashboardData.totalRevenue ?? 0}`,
          icon: "💰",
        },
        {
          title: "สถานะเว็บไซต์",
          value: dashboardData.websiteStatus ?? "ไม่ทราบ",
          icon: "🌐",
        },
      ]
    : [
        { title: "จำนวนคำสั่งซื้อทั้งหมด", value: "-", icon: "📦" },
        { title: "จำนวนคำสั่งซื้อที่รอดำเนินการ", value: "-", icon: "⏳" },
        { title: "จำนวนผู้ใช้งานทั้งหมด", value: "-", icon: "👤" },
        { title: "รายได้รวม", value: "-", icon: "💰" },
        { title: "สถานะเว็บไซต์", value: "-", icon: "🌐" },
      ];

  useEffect(() => {
    const now = new Date();
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
    fetchData();
  }, []);

  return (
    <SidebarComponent>
      <Card>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <LoaderIcon className="h-10 w-10 animate-spin text-gray-500" />
            <p className="text-gray-500 text-lg">Loading data...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 text-lg">{error}</div>
        ) : (
          <div className="px-5">
            <div className="flex flex-col gap-4 py-2 md:flex-row md:items-center md:justify-between">
              <div className="text-center md:text-left">
                <p className="text-4xl font-semibold ">Dashboard</p>
              </div>
              <div className="flex justify-center md:justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => {
                    setResetError("");
                    setResetPassword("");
                    setResetDialogOpen(true);
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset Sales Dashboard
                </Button>
              </div>
            </div>
            <div className="py-10 flex flex-row gap-6 justify-center flex-nowrap overflow-x-auto">
              {dashboardCards.map((card, i) => (
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
            <div>
              <OrderDashBoard bestSellers={dashboardData?.bestseller ?? []} />
            </div>
            <div>
              <PopularDashBoard  popularSeller={popularData}/>
            </div>
          </div>
        )}
      </Card>
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการ Reset ข้อมูล Dashboard</DialogTitle>
            <DialogDescription>
              ปุ่มนี้จะลบข้อมูลยอดขายสินค้า, Top 5 Product Sales และ Popular Products จากคำสั่งซื้อจริงทั้งหมด
              เพื่อเคลียร์ข้อมูล demo ออกจากระบบ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              หากยืนยัน ระบบจะลบข้อมูลคำสั่งซื้อที่ใช้คำนวณสถิติขายออกจริงทันที กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-password">รหัสผ่านของผู้ใช้งานปัจจุบัน</Label>
              <Input
                id="reset-password"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="กรอกรหัสผ่านเพื่อยืนยัน"
              />
            </div>
            {resetError ? (
              <p className="text-sm text-red-500">{resetError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setResetDialogOpen(false);
                setResetPassword("");
                setResetError("");
              }}
              disabled={resetSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleResetSalesDashboard}
              disabled={resetSubmitting}
            >
              {resetSubmitting ? "Resetting..." : "Yes, Reset All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarComponent>
  );
}
