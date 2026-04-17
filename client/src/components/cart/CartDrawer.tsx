import { useState } from "react";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  return (
    <div style={{ padding: "20px", background: "white", color: "black" }}>
      CartDrawer Base Test ✅
    </div>
  );
}
