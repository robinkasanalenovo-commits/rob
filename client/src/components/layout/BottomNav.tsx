import { Link, useLocation } from "wouter";
import { Home, Grid, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

interface BottomNavProps {
  onCartClick: () => void;
  onHomeClick?: () => void;
}

export function BottomNav({ onCartClick, onHomeClick }: BottomNavProps) {
  const [location] = useLocation();

  const cart = useStore((state) => state.cart) || [];
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { icon: Home, label: "Home", href: "/", action: onHomeClick },
    { icon: Grid, label: "Categories", href: "/categories" },
    { icon: ShoppingCart, label: "Cart", action: onCartClick, count: cartCount },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg pb-safe shadow-2xl">
      <div className="flex h-16 items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = item.href === location;
          const Icon = item.icon;
          
          const content = (
            <div
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 w-full h-full cursor-pointer transition-all duration-200",
                isActive ? "text-emerald-600" : "text-gray-500 hover:text-gray-800"
              )}
            >
              <div className="relative">
                <div className={cn(
                  "p-2 rounded-full transition-all duration-200",
                  isActive ? "bg-emerald-100" : "bg-transparent hover:bg-gray-100"
                )}>
                  <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[10px] font-bold text-white ring-2 ring-white shadow-md animate-pulse">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
            </div>
          );

          if (item.action && !item.href) {
            return (
              <button key={item.label} onClick={item.action} className="w-full h-full">
                {content}
              </button>
            );
          }

          return (
            <Link 
              key={item.label} 
              href={item.href!} 
              className="w-full h-full"
              onClick={() => item.action?.()}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
