import { CartDrawer } from "@/components/cart/CartDrawer";
import { useState } from "react";

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(true);

  return (
    <div>
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <div style={{ padding: "20px", fontSize: "24px" }}>
        CartDrawer Test ✅
      </div>
    </div>
  );
}
