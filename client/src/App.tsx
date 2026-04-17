import { Header } from "@/components/layout/Header";

export default function App() {
  return (
    <div>
      <Header searchQuery="" setSearchQuery={() => {}} />
      <div style={{ padding: "20px", fontSize: "24px" }}>
        Header Only Test ✅
      </div>
    </div>
  );
}
