import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { LogOut, ShoppingCart, IndianRupee, Plus, Upload, X, Image, Trash2, ClipboardList, Calendar, FileText, Package, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string | null;
  itemName: string | null;
  quantity: string | null;
  purchasePrice: number | null;
  billImage: string | null;
  staffId: string | null;
  staffName: string | null;
  date: string | null;
  createdAt: string | null;
}

export default function StaffDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useStore();
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState<"purchase" | "sale" | "history">("purchase");

  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [purchaseItemName, setPurchaseItemName] = useState("");
  const [purchaseQuantity, setPurchaseQuantity] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [purchaseBillImage, setPurchaseBillImage] = useState("");
  const [uploadingBill, setUploadingBill] = useState(false);

  const [saleAmount, setSaleAmount] = useState("");
  const [saleCustomerName, setSaleCustomerName] = useState("");
  const [saleDescription, setSaleDescription] = useState("");
  const [saleDate, setSaleDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saleMode, setSaleMode] = useState<"offline" | "online">("offline");

  const [viewBillImage, setViewBillImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: myTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/staff/transactions", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/staff/transactions?staffId=${user?.id}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, staffId: user?.id, staffName: user?.name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/transactions"] });
      toast({ title: "Entry saved!" });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/transactions"] });
      toast({ title: "Entry deleted" });
    },
  });

  async function handleBillUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBill(true);
    try {
      const res = await fetch("/api/uploads/request-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await res.json();
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      setPurchaseBillImage(objectPath);
      toast({ title: "Bill photo uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingBill(false);
    }
  }

  function handlePurchaseSubmit() {
    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      toast({ title: "Amount daalna zaroori hai", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      type: "Purchase",
      amount: Math.round(parseFloat(purchaseAmount) * 100),
      description: purchaseDescription || "",
      itemName: purchaseItemName || null,
      quantity: purchaseQuantity || null,
      billImage: purchaseBillImage || null,
      date: purchaseDate || new Date().toISOString(),
    });
    setPurchaseAmount("");
    setPurchaseDescription("");
    setPurchaseItemName("");
    setPurchaseQuantity("");
    setPurchaseBillImage("");
    setPurchaseDate(format(new Date(), "yyyy-MM-dd"));
  }

  function handleSaleSubmit() {
    if (!saleAmount || parseFloat(saleAmount) <= 0) {
      toast({ title: "Amount daalna zaroori hai", variant: "destructive" });
      return;
    }
    const type = saleMode === "online" ? "Online Sale" : "Offline Sale";
    const desc = [saleCustomerName, saleDescription].filter(Boolean).join(" - ");
    createMutation.mutate({
      type,
      amount: Math.round(parseFloat(saleAmount) * 100),
      description: desc || "",
      date: saleDate || new Date().toISOString(),
    });
    setSaleAmount("");
    setSaleCustomerName("");
    setSaleDescription("");
    setSaleDate(format(new Date(), "yyyy-MM-dd"));
  }

  const fmt = (v: number) => `₹${(v / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  const myPurchases = myTransactions.filter(t => t.type === "Purchase");
  const mySales = myTransactions.filter(t => t.type === "Offline Sale" || t.type === "Online Sale");
  const totalPurchaseAmt = myPurchases.reduce((s, t) => s + t.amount, 0);
  const totalSaleAmt = mySales.reduce((s, t) => s + t.amount, 0);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "Purchase": return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: <ShoppingCart className="h-4 w-4 text-red-500" />, label: "Purchase", sign: "-" };
      case "Online Sale": return { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: <TrendingUp className="h-4 w-4 text-green-500" />, label: "Online Sale", sign: "+" };
      case "Offline Sale": return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: <TrendingUp className="h-4 w-4 text-blue-500" />, label: "Offline Sale", sign: "+" };
      default: return { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: <FileText className="h-4 w-4 text-gray-500" />, label: type, sign: "" };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-24">
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-4 pb-16 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Staff Panel</h1>
              <p className="text-xs text-purple-200">{user?.name || "Staff"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-xl" onClick={() => { logout(); setLocation("/staff-auth"); }} data-testid="btn-staff-logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 -mt-12 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden" data-testid="card-total-purchase">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-red-500 to-orange-500 p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 opacity-80" />
                  <span className="text-xs font-medium opacity-90">Total Purchase</span>
                </div>
                <p className="text-xl font-bold">{fmt(totalPurchaseAmt)}</p>
                <p className="text-[10px] opacity-70 mt-1">{myPurchases.length} entries</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-2xl overflow-hidden" data-testid="card-total-sales">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 opacity-80" />
                  <span className="text-xs font-medium opacity-90">Total Sale</span>
                </div>
                <p className="text-xl font-bold">{fmt(totalSaleAmt)}</p>
                <p className="text-[10px] opacity-70 mt-1">{mySales.length} entries</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className={`h-14 flex flex-col gap-1 rounded-2xl border-2 transition-all ${activeSection === "purchase" ? "border-red-400 bg-red-50 shadow-md" : "border-gray-200 bg-white"}`}
            onClick={() => setActiveSection("purchase")}
            data-testid="tab-purchase"
          >
            <ShoppingCart className={`h-5 w-5 ${activeSection === "purchase" ? "text-red-500" : "text-gray-400"}`} />
            <span className={`text-[10px] font-bold ${activeSection === "purchase" ? "text-red-600" : "text-gray-500"}`}>Purchase</span>
          </Button>
          <Button
            variant="outline"
            className={`h-14 flex flex-col gap-1 rounded-2xl border-2 transition-all ${activeSection === "sale" ? "border-green-400 bg-green-50 shadow-md" : "border-gray-200 bg-white"}`}
            onClick={() => setActiveSection("sale")}
            data-testid="tab-sale"
          >
            <IndianRupee className={`h-5 w-5 ${activeSection === "sale" ? "text-green-500" : "text-gray-400"}`} />
            <span className={`text-[10px] font-bold ${activeSection === "sale" ? "text-green-600" : "text-gray-500"}`}>Sale Entry</span>
          </Button>
          <Button
            variant="outline"
            className={`h-14 flex flex-col gap-1 rounded-2xl border-2 transition-all ${activeSection === "history" ? "border-purple-400 bg-purple-50 shadow-md" : "border-gray-200 bg-white"}`}
            onClick={() => setActiveSection("history")}
            data-testid="tab-history"
          >
            <FileText className={`h-5 w-5 ${activeSection === "history" ? "text-purple-500" : "text-gray-400"}`} />
            <span className={`text-[10px] font-bold ${activeSection === "history" ? "text-purple-600" : "text-gray-500"}`}>History</span>
          </Button>
        </div>

        {activeSection === "purchase" && (
          <Card className="border-0 shadow-lg rounded-2xl" data-testid="card-purchase-form">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <div>
                    <p className="font-bold text-sm">Mandi / Supplier Purchase</p>
                    <p className="text-[10px] opacity-80">Kharid ka hisaab yahan daalo</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <label className="text-xs font-bold text-red-700 mb-1.5 block flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" /> Total Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 5000"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="h-12 text-lg font-bold border-red-200 focus:ring-red-300"
                    data-testid="input-purchase-amount"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date
                    </label>
                    <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="h-10" data-testid="input-purchase-date" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                      <Package className="h-3 w-3" /> Quantity
                    </label>
                    <Input placeholder="e.g. 50 kg" value={purchaseQuantity} onChange={(e) => setPurchaseQuantity(e.target.value)} className="h-10" data-testid="input-purchase-qty" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Item Name</label>
                  <Input placeholder="e.g. Tamatar, Pyaaz" value={purchaseItemName} onChange={(e) => setPurchaseItemName(e.target.value)} className="h-10" data-testid="input-purchase-item" />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Description / Details</label>
                  <Input placeholder="e.g. Sabzi mandi se kharida" value={purchaseDescription} onChange={(e) => setPurchaseDescription(e.target.value)} className="h-10" data-testid="input-purchase-desc" />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Bill Photo</label>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleBillUpload} className="hidden" />
                  {purchaseBillImage ? (
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-2">
                      <img src={purchaseBillImage} alt="Bill" className="h-14 w-14 object-cover rounded-lg border" />
                      <div className="flex-1">
                        <p className="text-xs text-green-700 font-medium">Bill uploaded</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 border-red-200 text-red-500" onClick={() => setPurchaseBillImage("")} data-testid="btn-remove-bill">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploadingBill} className="w-full h-12 border-dashed border-2 rounded-xl" data-testid="btn-upload-bill">
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingBill ? "Uploading..." : "Bill ki photo daalo"}
                    </Button>
                  )}
                </div>

                <Button onClick={handlePurchaseSubmit} disabled={createMutation.isPending} className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg" data-testid="btn-submit-purchase">
                  <Plus className="h-5 w-5 mr-2" />
                  {createMutation.isPending ? "Saving..." : "Save Purchase Entry"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "sale" && (
          <Card className="border-0 shadow-lg rounded-2xl" data-testid="card-sale-form">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-3 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  <div>
                    <p className="font-bold text-sm">Sale Entry</p>
                    <p className="text-[10px] opacity-80">Online ya offline - bikri yahan daalo</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-2 block">Sale Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSaleMode("offline")}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${saleMode === "offline" ? "border-blue-400 bg-blue-50 shadow-md" : "border-gray-200 bg-white"}`}
                      data-testid="btn-type-offline"
                    >
                      <p className={`text-sm font-bold ${saleMode === "offline" ? "text-blue-600" : "text-gray-500"}`}>Offline</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Dukaan se seedha</p>
                    </button>
                    <button
                      onClick={() => setSaleMode("online")}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${saleMode === "online" ? "border-green-400 bg-green-50 shadow-md" : "border-gray-200 bg-white"}`}
                      data-testid="btn-type-online"
                    >
                      <p className={`text-sm font-bold ${saleMode === "online" ? "text-green-600" : "text-gray-500"}`}>Online</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">App / UPI se</p>
                    </button>
                  </div>
                </div>

                <div className={`rounded-xl p-3 ${saleMode === "online" ? "bg-green-50 border border-green-100" : "bg-blue-50 border border-blue-100"}`}>
                  <label className={`text-xs font-bold mb-1.5 block flex items-center gap-1 ${saleMode === "online" ? "text-green-700" : "text-blue-700"}`}>
                    <IndianRupee className="h-3 w-3" /> Sale Amount (₹) *
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 250"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    className={`h-12 text-lg font-bold ${saleMode === "online" ? "border-green-200 focus:ring-green-300" : "border-blue-200 focus:ring-blue-300"}`}
                    data-testid="input-sale-amount"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Date
                    </label>
                    <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} className="h-10" data-testid="input-sale-date" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Customer Name</label>
                    <Input placeholder="e.g. Rahul" value={saleCustomerName} onChange={(e) => setSaleCustomerName(e.target.value)} className="h-10" data-testid="input-sale-customer" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">Description / Details</label>
                  <Input placeholder={saleMode === "online" ? "e.g. Order #123, UPI payment" : "e.g. Sabzi becha, Cash payment"} value={saleDescription} onChange={(e) => setSaleDescription(e.target.value)} className="h-10" data-testid="input-sale-desc" />
                </div>

                <Button
                  onClick={handleSaleSubmit}
                  disabled={createMutation.isPending}
                  className={`w-full h-12 text-white font-bold rounded-xl shadow-lg ${saleMode === "online" ? "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600" : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"}`}
                  data-testid="btn-submit-sale"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {createMutation.isPending ? "Saving..." : "Save Sale Entry"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "history" && (
          <div className="space-y-3" data-testid="section-history">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">All Entries ({myTransactions.length})</p>
            </div>

            {myTransactions.length === 0 ? (
              <Card className="border-0 shadow rounded-2xl">
                <CardContent className="p-8 text-center">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400 text-sm">Koi entry nahi hai</p>
                  <p className="text-gray-300 text-xs mt-1">Purchase ya Sale entry add karo</p>
                </CardContent>
              </Card>
            ) : (
              myTransactions.map((txn) => {
                const config = getTypeConfig(txn.type);
                return (
                  <Card key={txn.id} className={`border-0 shadow rounded-2xl overflow-hidden`} data-testid={`card-staff-txn-${txn.id}`}>
                    <CardContent className="p-0">
                      <div className={`flex items-stretch`}>
                        <div className={`w-1.5 ${txn.type === "Purchase" ? "bg-red-500" : txn.type === "Online Sale" ? "bg-green-500" : "bg-blue-500"}`} />
                        <div className="flex-1 p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-2.5">
                              <div className={`p-2 rounded-xl ${config.bg} mt-0.5`}>
                                {config.icon}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge className={`text-[10px] font-bold ${config.bg} ${config.color} border-0 rounded-lg px-2`}>
                                    {config.label}
                                  </Badge>
                                  {txn.billImage && (
                                    <button onClick={() => setViewBillImage(txn.billImage)} className="text-blue-500 flex items-center gap-0.5" data-testid={`btn-view-bill-${txn.id}`}>
                                      <Image className="h-3 w-3" />
                                      <span className="text-[9px]">Bill</span>
                                    </button>
                                  )}
                                </div>
                                {(txn.description || txn.itemName) && (
                                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                    {txn.description || txn.itemName}
                                  </p>
                                )}
                                {txn.itemName && txn.quantity && (
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    {txn.itemName} x {txn.quantity}
                                  </p>
                                )}
                                <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {txn.date ? format(parseISO(txn.date), "dd MMM yyyy") : "—"}
                                </p>
                              </div>
                            </div>

                            <div className="text-right flex flex-col items-end gap-1 ml-2">
                              <p className={`font-bold text-base ${txn.type === "Purchase" ? "text-red-600" : "text-green-600"}`}>
                                {config.sign}{fmt(txn.amount)}
                              </p>
                              <button
                                onClick={() => { if (confirm("Delete this entry?")) deleteMutation.mutate(txn.id); }}
                                className="text-gray-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                data-testid={`btn-delete-txn-${txn.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>

      {viewBillImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewBillImage(null)} data-testid="modal-bill-image">
          <div className="relative max-w-lg w-full">
            <button onClick={() => setViewBillImage(null)} className="absolute -top-10 right-0 text-white bg-white/20 rounded-full p-1.5" data-testid="btn-close-bill">
              <X className="h-5 w-5" />
            </button>
            <img src={viewBillImage} alt="Bill" className="w-full rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
