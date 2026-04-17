import { Home, Grid, ShoppingCart, User } from "lucide-react";

interface BottomNavProps {
  onCartClick: () => void;
  onHomeClick?: () => void;
}

export function BottomNav({ onCartClick, onHomeClick }: BottomNavProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "white",
        padding: "10px",
        borderTop: "1px solid #ccc",
        display: "flex",
        justifyContent: "space-around",
      }}
    >
      <button onClick={onHomeClick}>
        <Home size={20} />
      </button>

      <button>
        <Grid size={20} />
      </button>

      <button onClick={onCartClick}>
        <ShoppingCart size={20} />
      </button>

      <button>
        <User size={20} />
      </button>
    </div>
  );
}
