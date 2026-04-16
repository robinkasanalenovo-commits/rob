import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, IndianRupee, TrendingUp, TrendingDown, ShoppingCart, Store, Receipt, Image, Calendar, Filter, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";

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

interface PnLSummary {
  totalPurchase: number;
  onlineSalesTotal: number;
  totalOfflineSales: number;
  totalSales: number;
  totalExpenses: number;
  netProfitLoss: number;
  onlineOrderCount: number;
  purchaseCount: number;
  offlineSaleCount: number;
  expenseCount: number;
}

export default function AdminAccounts() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAddForm, setShowAddForm] = useState(false);
  const [txnType, setTxnType] = useState("Purchase");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnDescription, setTxnDescription] = useState("");
  const [txnItemName, setTxnItemName] = useState("");
  const [txnQuantity, setTxnQuantity] = useState("");
  const [txnPurchasePrice, setTxnPurchasePrice] = useState("");
  const [txnDate, setTxnDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [txnBillImage, setTxnBillImage] = useState("");
  const [uploadingBill, setUploadingBill] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [viewBillImage, setViewBillImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: pnlSummary } = useQuery<PnLSummary>({
    queryKey: ["/api/admin/pnl-summary"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pnl-summary"] });
      resetForm();
      toast({ title: "Transaction added" });
    },
    onError: () => toast({ title: "Failed to add transaction", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pnl-summary"] });
      toast({ title: "Transaction deleted" });
    },
  });

  function resetForm() {
    setShowAddForm(false);
    setTxnType("Purchase");
    setTxnAmount("");
    setTxnDescription("");
    setTxnItemName("");
    setTxnQuantity("");
    setTxnPurchasePrice("");
    setTxnDate(format(new Date(), "yyyy-MM-dd"));
    setTxnBillImage("");
  }

  function handleSubmit() {
    if (!txnAmount || parseFloat(txnAmount) <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      type: txnType,
      amount: Math.round(parseFloat(txnAmount) * 100),
      description: txnDescription || "",
      itemName: txnItemName || null,
      quantity: txnQuantity || null,
      purchasePrice: txnPurchasePrice ? Math.round(parseFloat(txnPurchasePrice) * 100) : null,
      billImage: txnBillImage || null,
      date: txnDate || new Date().toISOString(),
    });
  }

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
      setTxnBillImage(objectPath);
      toast({ title: "Bill image uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingBill(false);
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;

    if (dateFilter === "all") return true;
    if (!t.date) return false;

    const txnDate = parseISO(t.date);
    const now = new Date();

    if (dateFilter === "today") {
      return isWithinInterval(txnDate, { start: startOfDay(now), end: endOfDay(now) });
    }
    if (dateFilter === "week") {
      return isWithinInterval(txnDate, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });
    }
    if (dateFilter === "month") {
      return isWithinInterval(txnDate, { start: startOfMonth(now), end: endOfMonth(now) });
    }
    if (dateFilter === "custom" && customDateFrom && customDateTo) {
      return isWithinInterval(txnDate, { start: startOfDay(parseISO(customDateFrom)), end: endOfDay(parseISO(customDateTo)) });
    }
    return true;
  });

  const filteredPurchases = filteredTransactions.filter(t => t.type === "Purchase");
  const filteredOfflineSales = filteredTransactions.filter(t => t.type === "Offline Sale");
  const filteredExpenses = filteredTransactions.filter(t => t.type === "Expense");
  const filteredPurchaseTotal = filteredPurchases.reduce((s, t) => s + t.amount, 0);
  const filteredOfflineSalesTotal = filteredOfflineSales.reduce((s, t) => s + t.amount, 0);
  const filteredExpenseTotal = filteredExpenses.reduce((s, t) => s + t.amount, 0);

  const typeColor = (type: string) => {
    if (type === "Purchase") return "bg-orange-100 text-orange-800";
    if (type === "Online Sale") return "bg-green-100 text-green-800";
    if (type === "Offline Sale") return "bg-blue-100 text-blue-800";
    if (type === "Expense") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const typeIcon = (type: string) => {
    if (type === "Purchase") return <ShoppingCart className="h-4 w-4" />;
    if (type === "Online Sale") return <Store className="h-4 w-4" />;
    if (type === "Offline Sale") return <Receipt className="h-4 w-4" />;
    return <IndianRupee className="h-4 w-4" />;
  };

  const fmt = (v: number) => `₹${(v / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-purple-700 text-white p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-white hover:bg-purple-600" onClick={() => setLocation("/admin")} data-testid="btn-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">P&L Dashboard</h1>
          <p className="text-xs text-purple-200">Profit & Loss / Accounts</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
            <TabsTrigger value="add" data-testid="tab-add">+ Add</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-3">
                  <p className="text-[10px] text-green-600 font-medium">Total Sales</p>
                  <p className="text-lg font-bold text-green-700" data-testid="text-total-sales">{pnlSummary ? fmt(pnlSummary.totalSales) : "..."}</p>
                  <p className="text-[10px] text-green-500">Online + Offline</p>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-3">
                  <p className="text-[10px] text-orange-600 font-medium">Total Purchase</p>
                  <p className="text-lg font-bold text-orange-700" data-testid="text-total-purchase">{pnlSummary ? fmt(pnlSummary.totalPurchase) : "..."}</p>
                  <p className="text-[10px] text-orange-500">{pnlSummary?.purchaseCount || 0} entries</p>
                </CardContent>
              </Card>
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-3">
                  <p className="text-[10px] text-blue-600 font-medium">Online Sales</p>
                  <p className="text-lg font-bold text-blue-700" data-testid="text-online-sales">{pnlSummary ? fmt(pnlSummary.onlineSalesTotal) : "..."}</p>
                  <p className="text-[10px] text-blue-500">{pnlSummary?.onlineOrderCount || 0} orders</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-3">
                  <p className="text-[10px] text-red-600 font-medium">Total Expenses</p>
                  <p className="text-lg font-bold text-red-700" data-testid="text-total-expenses">{pnlSummary ? fmt(pnlSummary.totalExpenses) : "..."}</p>
                  <p className="text-[10px] text-red-500">{pnlSummary?.expenseCount || 0} entries</p>
                </CardContent>
              </Card>
            </div>

            <Card className={`border-2 ${pnlSummary && pnlSummary.netProfitLoss >= 0 ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Profit / Loss</p>
                  <p className={`text-2xl font-bold ${pnlSummary && pnlSummary.netProfitLoss >= 0 ? "text-green-700" : "text-red-700"}`} data-testid="text-net-pnl">
                    {pnlSummary ? fmt(pnlSummary.netProfitLoss) : "..."}
                  </p>
                </div>
                {pnlSummary && pnlSummary.netProfitLoss >= 0 ? (
                  <TrendingUp className="h-10 w-10 text-green-400" />
                ) : (
                  <TrendingDown className="h-10 w-10 text-red-400" />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <p className="text-sm font-medium mb-2">Breakdown</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-600">Online Sales</span>
                    <span className="font-medium">{pnlSummary ? fmt(pnlSummary.onlineSalesTotal) : "..."}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Offline Sales</span>
                    <span className="font-medium">{pnlSummary ? fmt(pnlSummary.totalOfflineSales) : "..."}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span className="text-green-700">Total Revenue</span>
                    <span>{pnlSummary ? fmt(pnlSummary.totalSales) : "..."}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>(-) Purchases</span>
                    <span>{pnlSummary ? fmt(pnlSummary.totalPurchase) : "..."}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>(-) Expenses</span>
                    <span>{pnlSummary ? fmt(pnlSummary.totalExpenses) : "..."}</span>
                  </div>
                  <div className={`border-t-2 pt-2 flex justify-between font-bold text-lg ${pnlSummary && pnlSummary.netProfitLoss >= 0 ? "text-green-700" : "text-red-700"}`}>
                    <span>{pnlSummary && pnlSummary.netProfitLoss >= 0 ? "Profit" : "Loss"}</span>
                    <span>{pnlSummary ? fmt(pnlSummary.netProfitLoss) : "..."}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-3 mt-4">
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3">
                  <p className="text-xs font-bold">Filters</p>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex gap-2">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="flex-1 h-9 text-xs rounded-xl" data-testid="select-date-filter">
                        <Calendar className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="flex-1 h-9 text-xs rounded-xl" data-testid="select-type-filter">
                        <Filter className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Purchase">Purchase</SelectItem>
                        <SelectItem value="Offline Sale">Offline Sale</SelectItem>
                        <SelectItem value="Online Sale">Online Sale</SelectItem>
                        <SelectItem value="Expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {dateFilter === "custom" && (
                    <div className="flex gap-2">
                      <Input type="date" value={customDateFrom} onChange={(e) => setCustomDateFrom(e.target.value)} className="text-xs h-9 rounded-xl" data-testid="input-date-from" />
                      <Input type="date" value={customDateTo} onChange={(e) => setCustomDateTo(e.target.value)} className="text-xs h-9 rounded-xl" data-testid="input-date-to" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-2">
              <Card className="border-0 shadow rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-red-500 to-orange-500 p-2.5 text-white text-center">
                    <TrendingDown className="h-4 w-4 mx-auto mb-0.5 opacity-80" />
                    <p className="text-[9px] font-medium opacity-90">Purchase</p>
                    <p className="text-sm font-bold">{fmt(filteredPurchaseTotal)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2.5 text-white text-center">
                    <Receipt className="h-4 w-4 mx-auto mb-0.5 opacity-80" />
                    <p className="text-[9px] font-medium opacity-90">Offline Sale</p>
                    <p className="text-sm font-bold">{fmt(filteredOfflineSalesTotal)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-pink-500 to-red-500 p-2.5 text-white text-center">
                    <IndianRupee className="h-4 w-4 mx-auto mb-0.5 opacity-80" />
                    <p className="text-[9px] font-medium opacity-90">Expense</p>
                    <p className="text-sm font-bold">{fmt(filteredExpenseTotal)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">Entries ({filteredTransactions.length})</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <Card className="border-0 shadow rounded-2xl">
                <CardContent className="p-8 text-center">
                  <Receipt className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-gray-400 text-sm">Koi entry nahi mili</p>
                  <p className="text-gray-300 text-xs mt-1">Filter change karke dekho</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((txn) => {
                  const isExpense = txn.type === "Purchase" || txn.type === "Expense";
                  const stripColor = txn.type === "Purchase" ? "bg-orange-500" : txn.type === "Online Sale" ? "bg-green-500" : txn.type === "Offline Sale" ? "bg-blue-500" : "bg-red-500";
                  const iconBg = txn.type === "Purchase" ? "bg-orange-50" : txn.type === "Online Sale" ? "bg-green-50" : txn.type === "Offline Sale" ? "bg-blue-50" : "bg-red-50";
                  return (
                    <Card key={txn.id} className="border-0 shadow rounded-2xl overflow-hidden" data-testid={`card-txn-${txn.id}`}>
                      <CardContent className="p-0">
                        <div className="flex items-stretch">
                          <div className={`w-1.5 ${stripColor}`} />
                          <div className="flex-1 p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-2.5">
                                <div className={`p-2 rounded-xl ${iconBg} mt-0.5`}>
                                  {typeIcon(txn.type)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`text-[10px] font-bold border-0 rounded-lg px-2 ${typeColor(txn.type)}`}>
                                      {txn.type}
                                    </Badge>
                                    {txn.staffName && (
                                      <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-600 border-purple-200 rounded-lg px-1.5 h-4">
                                        {txn.staffName}
                                      </Badge>
                                    )}
                                    {txn.billImage && (
                                      <button onClick={() => setViewBillImage(txn.billImage)} className="text-blue-500 flex items-center gap-0.5" data-testid={`btn-view-bill-${txn.id}`}>
                                        <Image className="h-3 w-3" />
                                        <span className="text-[9px]">Bill</span>
                                      </button>
                                    )}
                                  </div>

                                  {(txn.description || txn.itemName) && (
                                    <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                                      {txn.description || txn.itemName}
                                    </p>
                                  )}
                                  {txn.itemName && txn.quantity && (
                                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                      <ShoppingCart className="h-2.5 w-2.5" />
                                      {txn.itemName} x {txn.quantity}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                    <Calendar className="h-2.5 w-2.5" />
                                    {txn.date ? format(parseISO(txn.date), "dd MMM yyyy") : "—"}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                                <p className={`font-bold text-base ${isExpense ? "text-red-600" : "text-green-600"}`}>
                                  {isExpense ? "-" : "+"}{fmt(txn.amount)}
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
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4 mt-4">
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <div>
                      <p className="font-bold text-sm">Add New Entry</p>
                      <p className="text-[10px] opacity-80">Purchase, Sale ya Expense add karo</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-2 block">Entry Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "Purchase", label: "Purchase", sublabel: "Mandi / Supplier", colors: "border-orange-400 bg-orange-50", active: "text-orange-600" },
                        { value: "Offline Sale", label: "Offline Sale", sublabel: "Dukaan se seedha", colors: "border-blue-400 bg-blue-50", active: "text-blue-600" },
                        { value: "Online Sale", label: "Online Sale", sublabel: "App / UPI se", colors: "border-green-400 bg-green-50", active: "text-green-600" },
                        { value: "Expense", label: "Expense", sublabel: "Bijli, Rent etc.", colors: "border-red-400 bg-red-50", active: "text-red-600" },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setTxnType(opt.value)}
                          className={`p-2.5 rounded-xl border-2 text-center transition-all ${txnType === opt.value ? `${opt.colors} shadow-md` : "border-gray-200 bg-white"}`}
                          data-testid={`btn-type-${opt.value.toLowerCase().replace(' ', '-')}`}
                        >
                          <p className={`text-xs font-bold ${txnType === opt.value ? opt.active : "text-gray-500"}`}>{opt.label}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{opt.sublabel}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-xl p-3 ${txnType === "Purchase" ? "bg-orange-50 border border-orange-100" : txnType === "Expense" ? "bg-red-50 border border-red-100" : txnType === "Online Sale" ? "bg-green-50 border border-green-100" : "bg-blue-50 border border-blue-100"}`}>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" /> Amount (₹) *
                    </label>
                    <Input type="number" placeholder="e.g. 5000" value={txnAmount} onChange={(e) => setTxnAmount(e.target.value)} className="h-12 text-lg font-bold" data-testid="input-txn-amount" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date
                      </label>
                      <Input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} className="h-10 rounded-xl" data-testid="input-txn-date" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                      <Input placeholder="Details likho" value={txnDescription} onChange={(e) => setTxnDescription(e.target.value)} className="h-10 rounded-xl" data-testid="input-txn-description" />
                    </div>
                  </div>

                  {txnType === "Purchase" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Item Name</label>
                        <Input placeholder="e.g. Tamatar" value={txnItemName} onChange={(e) => setTxnItemName(e.target.value)} className="h-10 rounded-xl" data-testid="input-txn-item" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Quantity</label>
                        <Input placeholder="e.g. 50 kg" value={txnQuantity} onChange={(e) => setTxnQuantity(e.target.value)} className="h-10 rounded-xl" data-testid="input-txn-qty" />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Bill Photo</label>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleBillUpload} className="hidden" />
                    {txnBillImage ? (
                      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-2">
                        <img src={txnBillImage} alt="Bill" className="h-14 w-14 object-cover rounded-lg border" />
                        <div className="flex-1">
                          <p className="text-xs text-green-700 font-medium">Bill uploaded</p>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 border-red-200 text-red-500 rounded-xl" onClick={() => setTxnBillImage("")} data-testid="btn-remove-bill">
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

                  <Button onClick={handleSubmit} disabled={createMutation.isPending} className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg" data-testid="btn-submit-txn">
                    <Plus className="h-5 w-5 mr-2" />
                    {createMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {viewBillImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewBillImage(null)} data-testid="modal-bill-image">
          <div className="relative max-w-lg w-full">
            <button onClick={() => setViewBillImage(null)} className="absolute -top-10 right-0 text-white bg-white/20 rounded-full p-1.5" data-testid="btn-close-bill-modal">
              <X className="h-5 w-5" />
            </button>
            <img src={viewBillImage} alt="Bill" className="w-full rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
