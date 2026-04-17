import { Home, Grid, ShoppingCart, User } from "lucide-react";

interface BottomNavProps {
  onCartClick: () => void;
  onHomeClick?: () => void;
}

export function BottomNav({ onCartClick, onHomeClick }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow">
      <div className="flex h-16 items-center justify-around">
        <a href="/" className="flex flex-col items-center text-gray-600">
          <Home size={20} />
          <span className="text-xs">Home</span>
        </a>

        <a href="/categories" className="flex flex-col items-center text-gray-600">
          <Grid size={20} />
          <span className="text-xs">Categories</span>
        </a>

        <button onClick={onCartClick} className="flex flex-col items-center text-gray-600">
          <ShoppingCart size={20} />
          <span className="text-xs">Cart</span>
        </button>

        <a href="/profile" className="flex flex-col items-center text-gray-600">
          <User size={20} />
          <span className="text-xs">Profile</span>
        </a>
      </div>
    </div>
  );
}
