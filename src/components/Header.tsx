"use client";
import React from "react";
import Link from "next/link";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/Auth";
import {
  User,
  LogOut,
  ArrowRight,
  BarChart3,
  Users,
  ChartNoAxesCombined,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { ModeToggle } from "./theme/ThemeToggler";

export default function Header() {
  const { userId, logout } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme()


  const navItems = [
    {
      name: "Expenses",
      icon: <BarChart3 size={16} />,
      link: "/expense",
      auth: true,
    },
    {
      name: "Friends",
      icon: <Users size={16} />,
      link: "/friends",
      auth: true,
    },
    {
      name: "Analytics",
      icon: <ChartNoAxesCombined size={16} />,
      link: "/analytics",
      auth: true,
    },
  ];

  const handleLogout = async () => {
    try {
      const response = await axios.get("/api/users/logout");
      if (response.status === 200) {
        toast({
          title: "Logout successful",
          variant: "success",
          duration: 3000,
        });
        router.replace("/");
      }
      logout();
    } catch {
      toast({
        title: "Something went wrong",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return (
    <nav className="bg-transparent backdrop-blur-md border-b border-accent/10 w-full fixed top-0 z-50 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link
          href={userId ? "/expense" : "/"}
          className="font-bold text-2xl bg-gradient-to-tl from-primary to-amber-500 bg-clip-text text-transparent"
        >
          Track2Save
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems
            .filter(
              (item) =>
                (item.auth && userId !== null) ||
                (!item.auth && userId === null)
            )
            .map((item, index) => (
              <Link
                key={index}
                href={item.link}
                className={`flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group ${pathname === item.link
                  ? "text-primary"
                  : "text-muted-foreground"
                  }`}
              >
                {item.icon && (
                  <span className="bg-primary/10 group-hover:bg-primary/20 p-1.5 rounded-md transition-colors text-primary">
                    {item.icon}
                  </span>
                )}
                <span>{item.name}</span>
              </Link>
            ))}
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-4">
          {userId ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-blue-500/80 flex items-center justify-center cursor-pointer border-2 border-background shadow-lg hover:shadow-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 focus:ring-offset-background">
                  <User size={18} className="text-white" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 w-full cursor-pointer"
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-3 h-3" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3 h-3" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          ) : (
            <>
              <div className="hidden md:flex items-center gap-4">
                <ModeToggle />
                <Link
                  href="/login"
                  className="px-4 py-2 text-primary transition-colors hover:text-primary/80 text-sm"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors text-sm"
                >
                  Get Started{" "}
                  <ArrowRight size={16} className="inline-block ml-1 mb-1" />
                </Link>
              </div>

              {/* Mobile Menu - ONLY for non-authenticated users */}
              <Sheet>
                <SheetTrigger className="md:hidden">
                  <Menu size={20} className="text-muted-foreground" />
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[70vw] md:hidden"
                >
                  <SheetHeader>
                    <SheetTitle className="text-left font-bold text-lg text-primary">
                      Track2Save
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-accent/10">
                    <Link
                      href="/login"
                      className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors text-sm flex items-center justify-center"
                    >
                      Get Started
                      <ArrowRight size={16} className="ml-1" />
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}