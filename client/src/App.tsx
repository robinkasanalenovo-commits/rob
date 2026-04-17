import { BottomNav } from "@/components/layout/BottomNav";

export default function App() {
  return (
    <div>
      <div style={{ padding: "20px", fontSize: "24px" }}>
        BottomNav Test ✅
      </div>

      <BottomNav
        onCartClick={() => {}}
        onHomeClick={() => {}}
      />
    </div>
  );
}
