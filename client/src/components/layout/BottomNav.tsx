import { Link } from "wouter";
import { Home, Grid, ShoppingCart, User } from "lucide-react";

interface BottomNavProps {
  onCartClick: () => void;
  onHomeClick?: () => void;
}

export function BottomNav({ onCartClick }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow">
      <div className="flex h-16 items-center justify-around">

        <Link href="/">
          <div className="flex flex-col items-center text-gray-600 cursor-pointer">
            <Home size={20} />
            <span className="text-xs">Home</span>
          </div>
        </Link>

        <Link href="/categories">
          <div className="flex flex-col items-center text-gray-600 cursor-pointer">
            <Grid size={20} />
            <span className="text-xs">Categories</span>
          </div>
        </Link>

        <button onClick={onCartClick} className="flex flex-col items-center text-gray-600">
          <ShoppingCart size={20} />
          <span className="text-xs">Cart</span>
        </button>

        <Link href="/profile">
          <div className="flex flex-col items-center text-gray-600 cursor-pointer">
            <User size={20} />
            <span className="text-xs">Profile</span>
          </div>
        </Link>

      </div>
    </div>
  );
}
