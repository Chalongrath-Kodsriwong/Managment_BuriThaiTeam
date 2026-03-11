import { ReactNode } from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  ShoppingCart, 
  Box, 
  Image, 
  User, 
  Shield,
  CircleDollarSign,
  TextSearch
} from "lucide-react"; 


interface SidebarComponentProps {
  children: ReactNode;
}

// เพิ่ม icon สำหรับแต่ละ menu item
const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: <Home className="w-5 h-5 mr-2" /> },
  { href: "/order", label: "Order Management", icon: <ShoppingCart className="w-5 h-5 mr-2" /> },
  { href: "/category", label: "Category", icon: <TextSearch className="w-5 h-5 mr-2" /> },
  { href: "/stock", label: "Stock Management", icon: <Box className="w-5 h-5 mr-2" /> },
  { href: "/banner", label: "Banner", icon: <Image className="w-5 h-5 mr-2" /> },
  { href: "/account", label: "Account Management", icon: <User className="w-5 h-5 mr-2" /> },
  { href: "/role", label: "Role Management", icon: <Shield className="w-5 h-5 mr-2" /> },
  { href: "/payment", label: "Payment Account", icon: <CircleDollarSign className="w-5 h-5 mr-2" /> },
  { href: "/achievement", label: "Achievement", icon: <TextSearch className="w-5 h-5 mr-2" /> },
];

export function SidebarComponent({ children }: SidebarComponentProps) {
  return (
    <SidebarProvider>
      <div className="flex w-full h-full">
        <Sidebar className="h-full">
          <SidebarHeader className="text-center">
            <Link href="/dashboard" className="block py-2 hover:underline">
              <p className="text-2xl font-semibold">Buri Thai Team</p>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <div className="flex flex-col gap-2 p-3">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="secondary"
                    className="w-full flex items-center cursor-auto hover:cursor-pointer justify-start"
                  >
                    {item.icon}
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </SidebarContent>

          <SidebarFooter>
            <p className="p-3">Footer</p>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 p-3 ml-6 flex flex-col">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
