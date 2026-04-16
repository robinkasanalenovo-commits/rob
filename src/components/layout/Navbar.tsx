import { Link } from "wouter";
import { ShoppingCart, User, LogOut, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onCartClick: () => void;
}

export function Navbar({ onCartClick }: NavbarProps) {
  const { user, cart, logout } = useStore();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/">
          <a className="flex items-center gap-2">
            <span className="text-2xl font-bold font-heading text-primary tracking-tight">AtoZDukaan</span>
          </a>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/offers">
            <Button
              variant="ghost"
              size="sm"
              data-testid="btn-today-offers"
              className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-full px-3 py-1.5 h-8 text-xs font-semibold shadow-sm hover:shadow-md transition-all duration-200 border-0"
            >
              <Tag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Today's Offers</span>
              <span className="sm:hidden">Offers</span>
            </Button>
          </Link>
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white shadow-sm animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="font-medium text-muted-foreground" disabled>
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/auth">
              <Button variant="default">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
