import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { CartDrawer } from "@/components/cart/CartDrawer";

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-white pb-24">
      
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="container mx-auto px-3 py-4">
        <h2 className="text-xl font-bold">Test Without Header ✅</h2>
      </main>

      <BottomNav
        onCartClick={() => setIsCartOpen(true)}
        onHomeClick={() => {}}
      />
    </div>
  );
}
