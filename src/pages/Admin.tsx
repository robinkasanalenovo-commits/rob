import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, X, Trash2, Edit2, CheckCircle, XCircle, Clock, Plus, Package, Settings, Save, IndianRupee, RefreshCw, LayoutGrid, Tv, Droplets, Smartphone, Heart, Home, Shirt, Baby, Car, Dumbbell, Book, Music, Camera, Gamepad2, Utensils, Leaf, Cherry, Milk, ShoppingBag, Gift, Coffee, Pizza, Sparkles, ChevronUp, ChevronDown, Download, BarChart3, Filter, FileText, Search, Copy, ClipboardList, Check, MessageCircle, Lock, Eye, EyeOff, MapPin, Phone, Store, Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore, Product } from "@/lib/store";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LUCIDE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Tv, Droplets, Smartphone, Heart, Home, Shirt, Baby, Car, Dumbbell, Book, Music, Camera, Gamepad2, Utensils, Leaf, Cherry, Milk, ShoppingBag, Gift, Coffee, Pizza, Sparkles, Package, LayoutGrid
};

interface Customer {
  id: string;
  username: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  mainAreaId: number | null;
  mainAreaName: string | null;
  subAreaId: number | null;
  subAreaName: string | null;
  approvalStatus: string | null;
  referralCode: string | null;
  referredBy: string | null;
  referralCount?: number;
  createdAt: string | null;
  orderCount?: number;
  totalSpent?: number;
  lastOrderDate?: string | null;
}

interface AreaOption {
  id: number;
  name: string;
  slug: string;
  subAreas: { id: number; name: string; slug: string }[];
}

interface Order {
  id: number;
  userId: string | null;
  customerName: string;
  customerPhone: string | null;
  mainAreaName: string | null;
  subAreaName: string | null;
  total: number;
  referralDiscount: number;
  itemsCount: number;
  status: string | null;
  paymentStatus: string | null;
  deliverySlot: string | null;
  deliveryAddress: string | null;
  orderNotes: string | null;
  createdAt: string | null;
  deliveredAt: string | null;
}

interface Stats {
  totalRevenue: number;
  pendingOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

interface DailySale {
  date: string;
  total: number;
  orderCount: number;
}

interface MonthlySale {
  month: string;
  total: number;
  orderCount: number;
}

interface AreaSales {
  areaId: number | null;
  areaName: string;
  orderCount: number;
  totalSales: number;
  customerCount: number;
}

interface ProductSales {
  productId: number;
  productName: string;
  category: string;
  totalQuantity: number;
  totalSales: number;
  orderCount: number;
}

interface SalesOverview {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
  topCustomers: { id: string; name: string | null; phone: string | null; orderCount: number; totalSpent: number }[];
  recentOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
}

interface StaffMember {
  id: string;
  username: string;
  name: string | null;
  phone: string | null;
  staffStatus: string | null;
  createdAt: string | null;
  entryCount: number;
}

function StaffManagementTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewStaffEntries, setViewStaffEntries] = useState<string | null>(null);
  const [viewBillImg, setViewBillImg] = useState<string | null>(null);

  const { data: staffList = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["/api/admin/staff"],
    queryFn: async () => {
      const res = await fetch("/api/admin/staff");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: staffEntries = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/transactions", viewStaffEntries],
    queryFn: async () => {
      const res = await fetch(`/api/staff/transactions?staffId=${viewStaffEntries}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!viewStaffEntries,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/staff/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
      toast({ title: "Staff approved" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/staff/${id}/reject`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
      toast({ title: "Staff deactivated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/staff"] });
      toast({ title: "Staff deleted" });
    },
  });

  const fmtAmt = (v: number) => `₹${(v / 100).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff Management
        </h2>
        <Badge variant="outline">{staffList.length} staff</Badge>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
        Staff login: <span className="font-medium">/staff-auth</span> — Staff can only add Purchase & Offline Sale entries. They cannot see profits or customer data.
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400 py-6">Loading...</p>
      ) : staffList.length === 0 ? (
        <p className="text-center text-gray-400 py-6">No staff accounts yet. Staff can sign up at /staff-auth</p>
      ) : (
        staffList.map((staff) => (
          <Card key={staff.id} className="overflow-hidden" data-testid={`card-staff-${staff.id}`}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{staff.name || staff.username}</p>
                  <p className="text-xs text-gray-500">{staff.phone || staff.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={staff.staffStatus === "approved" ? "bg-green-100 text-green-800" : staff.staffStatus === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>
                      {staff.staffStatus}
                    </Badge>
                    <span className="text-[10px] text-gray-400">{staff.entryCount} entries</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {staff.staffStatus !== "approved" && (
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 h-7 text-xs" onClick={() => approveMutation.mutate(staff.id)} data-testid={`btn-approve-staff-${staff.id}`}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  )}
                  {staff.staffStatus === "approved" && (
                    <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 h-7 text-xs" onClick={() => rejectMutation.mutate(staff.id)} data-testid={`btn-deactivate-staff-${staff.id}`}>
                      <XCircle className="h-3 w-3 mr-1" /> Deactivate
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setViewStaffEntries(viewStaffEntries === staff.id ? null : staff.id)} data-testid={`btn-view-entries-${staff.id}`}>
                    <Eye className="h-3 w-3 mr-1" /> Entries
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-500 border-red-200 h-7 text-xs" onClick={() => { if (confirm("Delete this staff?")) deleteMutation.mutate(staff.id); }} data-testid={`btn-delete-staff-${staff.id}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {viewStaffEntries === staff.id && (
                <div className="mt-3 border-t pt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-600">Entries by {staff.name}:</p>
                  {staffEntries.length === 0 ? (
                    <p className="text-xs text-gray-400">No entries yet</p>
                  ) : (
                    staffEntries.map((entry: any) => (
                      <div key={entry.id} className="flex items-center justify-between bg-gray-50 rounded p-2 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${entry.type === "Purchase" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}`}>
                            {entry.type}
                          </Badge>
                          <span className="text-gray-600">{entry.description || entry.itemName || "—"}</span>
                          {entry.billImage && (
                            <button onClick={() => setViewBillImg(entry.billImage)} className="text-blue-500">
                              <Image className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <span className={`font-medium ${entry.type === "Purchase" ? "text-red-600" : "text-green-600"}`}>
                          {entry.type === "Purchase" ? "-" : "+"}{fmtAmt(entry.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {viewBillImg && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setViewBillImg(null)}>
          <div className="relative max-w-lg w-full">
            <button onClick={() => setViewBillImg(null)} className="absolute -top-10 right-0 text-white">
              <X className="h-6 w-6" />
            </button>
            <img src={viewBillImg} alt="Bill" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}

function SalesAnalyticsTab() {
  const { data: overviewData, isLoading: overviewLoading } = useQuery<SalesOverview>({
    queryKey: ["/api/admin/analytics/overview"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/overview");
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    }
  });

  const { data: areaData, isLoading: areaLoading } = useQuery<AreaSales[]>({
    queryKey: ["/api/admin/analytics/areas"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/areas");
      if (!res.ok) throw new Error("Failed to fetch areas");
      return res.json();
    }
  });

  const { data: productData, isLoading: productLoading } = useQuery<ProductSales[]>({
    queryKey: ["/api/admin/analytics/products"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    }
  });

  const { data: customersData } = useQuery<Customer[]>({
    queryKey: ["/api/customers/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/customers/analytics");
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    }
  });

  const isLoading = overviewLoading || areaLoading || productLoading;
  const overview = overviewData;
  const areaSales = areaData || [];
  const productSales = productData || [];
  const allCustomers = customersData || [];

  // Customer segments
  const regularCustomers = allCustomers.filter(c => (c.orderCount || 0) >= 3);
  const lowActivityCustomers = allCustomers.filter(c => { const oc = c.orderCount || 0; return oc > 0 && oc < 3; });
  const neverOrderedCustomers = allCustomers.filter(c => (c.orderCount || 0) === 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="sales-analytics-loading">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="sales-analytics-container">
      <h2 className="text-xl font-bold flex items-center gap-2" data-testid="text-sales-title">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        Sales Analytics
      </h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3" data-testid="sales-overview-cards">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white" data-testid="card-total-revenue">
          <CardContent className="p-4">
            <p className="text-blue-100 text-xs">Total Revenue</p>
            <p className="text-2xl font-bold" data-testid="text-total-revenue">₹{overview?.totalRevenue?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white" data-testid="card-total-orders">
          <CardContent className="p-4">
            <p className="text-green-100 text-xs">Total Orders</p>
            <p className="text-2xl font-bold" data-testid="text-total-orders">{overview?.totalOrders || 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white" data-testid="card-avg-order">
          <CardContent className="p-4">
            <p className="text-purple-100 text-xs">Avg Order Value</p>
            <p className="text-2xl font-bold" data-testid="text-avg-order">₹{Math.round(overview?.averageOrderValue || 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white" data-testid="card-recent-orders">
          <CardContent className="p-4">
            <p className="text-orange-100 text-xs">Recent (7 days)</p>
            <p className="text-2xl font-bold" data-testid="text-recent-orders">{overview?.recentOrders || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Segments */}
      <Card data-testid="card-customer-segments">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Segments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg" data-testid="segment-regular">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium">Regular Customers (3+ orders)</span>
            </div>
            <span className="text-lg font-bold text-green-600" data-testid="text-regular-count">{regularCustomers.length}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg" data-testid="segment-low-activity">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium">Low Activity (1-2 orders)</span>
            </div>
            <span className="text-lg font-bold text-yellow-600" data-testid="text-low-activity-count">{lowActivityCustomers.length}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg" data-testid="segment-never-ordered">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium">Never Ordered</span>
            </div>
            <span className="text-lg font-bold text-red-600" data-testid="text-never-ordered-count">{neverOrderedCustomers.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card data-testid="card-top-customers">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Top Customers by Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {overview?.topCustomers?.slice(0, 5).map((customer, index) => (
              <div key={customer.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg" data-testid={`top-customer-${index}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-slate-300 text-slate-700' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-slate-200 text-slate-600'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-customer-name-${index}`}>{customer.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground" data-testid={`text-customer-phone-${index}`}>{customer.phone || 'No phone'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600" data-testid={`text-customer-spent-${index}`}>₹{customer.totalSpent.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground" data-testid={`text-customer-orders-${index}`}>{customer.orderCount} orders</p>
                </div>
              </div>
            ))}
            {(!overview?.topCustomers || overview.topCustomers.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-top-customers">No customer data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Area-wise Sales */}
      <Card data-testid="card-area-sales">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Area-wise Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {areaSales.slice(0, 10).map((area, index) => (
              <div key={area.areaId || `area-${index}`} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg" data-testid={`area-sales-${index}`}>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-area-name-${index}`}>{area.areaName}</p>
                    <p className="text-xs text-muted-foreground">{area.customerCount} customers</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600" data-testid={`text-area-sales-${index}`}>₹{area.totalSales.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{area.orderCount} orders</p>
                </div>
              </div>
            ))}
            {areaSales.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-area-data">No area data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card data-testid="card-top-products">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" />
            Top Selling Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {productSales.slice(0, 10).map((product, index) => (
              <div key={product.productId || `product-${index}`} className="flex items-center justify-between p-2 bg-green-50 rounded-lg" data-testid={`product-sales-${index}`}>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium" data-testid={`text-product-name-${index}`}>{product.productName}</p>
                    <p className="text-xs text-muted-foreground">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">₹{product.totalSales.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{product.totalQuantity} sold</p>
                </div>
              </div>
            ))}
            {productSales.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-product-data">No product data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  iconKey: string | null;
  imageUrl: string | null;
  colorStart: string | null;
  colorEnd: string | null;
  borderColor: string | null;
  textColor: string | null;
  sortOrder: number | null;
  isActive: string | null;
  showOnHome: string | null;
}

interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number;
  image: string;
  categorySlug: string;
  unit: string | null;
  sortOrder: number | null;
  isActive: string | null;
}

interface Area {
  id: number;
  name: string;
  slug: string;
  sortOrder: number | null;
  isActive: string | null;
}

interface SubArea {
  id: number;
  areaId: number;
  name: string;
  slug: string;
  sortOrder: number | null;
  isActive: string | null;
}

interface Banner {
  id: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  ctaText: string | null;
  ctaLink: string | null;
  bgColor: string | null;
  textColor: string | null;
  isActive: string | null;
  sortOrder: number | null;
  createdAt: string | null;
}

interface AreaWithSubAreas extends Area {
  subAreas: SubArea[];
}

function ServiceRequestsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReq, setNewReq] = useState({ serviceName: "", servicePrice: "", customerName: "", customerPhone: "", customerAddress: "", preferredDate: "", preferredTime: "", notes: "" });

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/service-requests"],
    queryFn: async () => {
      const res = await fetch("/api/service-requests");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    }
  });

  const { data: servicesList = [] } = useQuery<any[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      if (!res.ok) return [];
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({ title: "Request Created", description: "Service request added successfully" });
      setShowAddForm(false);
      setNewReq({ serviceName: "", servicePrice: "", customerName: "", customerPhone: "", customerAddress: "", preferredDate: "", preferredTime: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Failed", description: "Could not create request. Try again.", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/service-requests/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({ title: "Status Updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/service-requests/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-requests"] });
      toast({ title: "Request Deleted" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-800";
      case "Confirmed": return "bg-blue-100 text-blue-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    if (serviceId === "custom") {
      setNewReq({ ...newReq, serviceName: "", servicePrice: "" });
      return;
    }
    const svc = servicesList.find((s: any) => s.id.toString() === serviceId);
    if (svc) {
      setNewReq({ ...newReq, serviceName: svc.name, servicePrice: svc.price.toString() });
    }
  };

  const handleSubmitRequest = () => {
    if (!newReq.serviceName.trim() || !newReq.customerName.trim() || !newReq.customerPhone.trim()) {
      toast({ title: "Required", description: "Service name, customer name, and phone are required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      serviceName: newReq.serviceName.trim(),
      servicePrice: newReq.servicePrice ? parseInt(newReq.servicePrice) : null,
      customerName: newReq.customerName.trim(),
      customerPhone: newReq.customerPhone.trim(),
      customerAddress: newReq.customerAddress.trim() || null,
      preferredDate: newReq.preferredDate || null,
      preferredTime: newReq.preferredTime || null,
      notes: newReq.notes.trim() || null,
    });
  };

  const pendingCount = requests.filter((r: any) => r.status === "Pending").length;
  const callRequestCount = requests.filter((r: any) => r.status === "Pending" && r.requestType === "call").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2" data-testid="text-requests-title">
          <Phone className="h-5 w-5 text-blue-600" />
          Service Requests
          {pendingCount > 0 && (
            <Badge className="bg-red-500 text-white text-xs animate-pulse">{pendingCount} new</Badge>
          )}
          {callRequestCount > 0 && (
            <Badge className="bg-green-600 text-white text-xs animate-pulse">{callRequestCount} calls</Badge>
          )}
        </h2>
        <Button size="sm" className="bg-blue-600 h-8" onClick={() => setShowAddForm(!showAddForm)} data-testid="btn-add-request">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Request
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-blue-300 bg-blue-50/30" data-testid="card-add-request-form">
          <CardContent className="p-3 space-y-3">
            <p className="text-sm font-bold text-blue-800">New Service Request</p>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Select Service</label>
              <select
                className="w-full h-9 border rounded-md px-3 text-sm bg-white"
                onChange={(e) => handleServiceSelect(e.target.value)}
                data-testid="select-service"
              >
                <option value="custom">-- Custom Service --</option>
                {servicesList.map((svc: any) => (
                  <option key={svc.id} value={svc.id}>{svc.name} — ₹{svc.price}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Service Name *</label>
                <Input className="h-9" placeholder="e.g. AC Repair" value={newReq.serviceName} onChange={(e) => setNewReq({ ...newReq, serviceName: e.target.value })} data-testid="input-req-service-name" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Price (₹)</label>
                <Input className="h-9" type="number" placeholder="500" value={newReq.servicePrice} onChange={(e) => setNewReq({ ...newReq, servicePrice: e.target.value })} data-testid="input-req-price" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Customer Name *</label>
                <Input className="h-9" placeholder="Customer name" value={newReq.customerName} onChange={(e) => setNewReq({ ...newReq, customerName: e.target.value })} data-testid="input-req-name" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Phone *</label>
                <Input className="h-9" type="tel" placeholder="Phone number" maxLength={10} value={newReq.customerPhone} onChange={(e) => setNewReq({ ...newReq, customerPhone: e.target.value })} data-testid="input-req-phone" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Address</label>
              <Input className="h-9" placeholder="Customer address" value={newReq.customerAddress} onChange={(e) => setNewReq({ ...newReq, customerAddress: e.target.value })} data-testid="input-req-address" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Preferred Date</label>
                <Input className="h-9" type="date" value={newReq.preferredDate} onChange={(e) => setNewReq({ ...newReq, preferredDate: e.target.value })} data-testid="input-req-date" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Preferred Time</label>
                <select className="h-9 w-full border rounded-md px-3 text-sm bg-white" value={newReq.preferredTime} onChange={(e) => setNewReq({ ...newReq, preferredTime: e.target.value })} data-testid="select-req-time">
                  <option value="">Select</option>
                  <option value="Morning (8AM-12PM)">Morning (8-12)</option>
                  <option value="Afternoon (12PM-4PM)">Afternoon (12-4)</option>
                  <option value="Evening (4PM-8PM)">Evening (4-8)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Notes</label>
              <textarea className="w-full border rounded-md px-3 py-2 text-sm h-14 resize-none" placeholder="Any special notes..." value={newReq.notes} onChange={(e) => setNewReq({ ...newReq, notes: e.target.value })} data-testid="input-req-notes" />
            </div>

            <div className="flex gap-2">
              <Button className="flex-1 h-9 bg-blue-600" onClick={handleSubmitRequest} disabled={createMutation.isPending} data-testid="btn-submit-request">
                {createMutation.isPending ? "Saving..." : "Create Request"}
              </Button>
              <Button variant="outline" className="h-9" onClick={() => { setShowAddForm(false); setNewReq({ serviceName: "", servicePrice: "", customerName: "", customerPhone: "", customerAddress: "", preferredDate: "", preferredTime: "", notes: "" }); }} data-testid="btn-cancel-add">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><RefreshCw className="h-6 w-6 animate-spin" /></div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Phone className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No service requests yet</p>
            <p className="text-xs mt-1">Click "Add Request" to create one manually</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req: any) => (
            <Card key={req.id} className={`border shadow-sm ${req.status === "Pending" ? (req.requestType === "call" ? "border-green-300 bg-green-50/30" : "border-yellow-300 bg-yellow-50/30") : ""}`} data-testid={`request-card-${req.id}`}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm">{req.serviceName}</p>
                      {req.requestType === "call" && (
                        <Badge className="bg-green-600 text-white text-[9px] px-1.5 py-0 h-4 animate-pulse">CALL REQUEST</Badge>
                      )}
                    </div>
                    {req.servicePrice && <p className="text-xs text-blue-600 font-medium">₹{req.servicePrice}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(req.status || "Pending")}`}>
                    {req.status || "Pending"}
                  </span>
                </div>

                {req.requestType === "call" && req.notes && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
                    <p className="text-[10px] font-medium text-green-800 mb-0.5">Reason for call:</p>
                    <p className="text-xs text-green-900">"{req.notes}"</p>
                  </div>
                )}

                <div className="space-y-1 text-xs text-gray-600 mb-2">
                  <p className="flex items-center gap-1"><Users className="h-3 w-3" /> {req.customerName}</p>
                  <p className="flex items-center gap-1"><Phone className="h-3 w-3" />
                    <a href={`tel:${req.customerPhone}`} className="text-blue-600 underline">{req.customerPhone}</a>
                  </p>
                  {req.customerAddress && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {req.customerAddress}</p>}
                  {req.preferredDate && <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {req.preferredDate} {req.preferredTime || ""}</p>}
                  {req.requestType !== "call" && req.notes && <p className="bg-gray-50 rounded p-1.5 text-gray-700 mt-1">"{req.notes}"</p>}
                </div>

                <p className="text-[10px] text-gray-400 mb-2">
                  {req.createdAt ? new Date(req.createdAt).toLocaleString("en-IN") : ""}
                </p>

                <div className="flex gap-1.5 flex-wrap">
                  {req.status === "Pending" && (
                    <>
                      <Button size="sm" className="h-7 text-[10px] bg-blue-600" onClick={() => updateStatusMutation.mutate({ id: req.id, status: "Confirmed" })} data-testid={`confirm-request-${req.id}`}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Confirm
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] text-red-600 border-red-200" onClick={() => updateStatusMutation.mutate({ id: req.id, status: "Cancelled" })} data-testid={`cancel-request-${req.id}`}>
                        <XCircle className="h-3 w-3 mr-1" /> Cancel
                      </Button>
                    </>
                  )}
                  {req.status === "Confirmed" && (
                    <Button size="sm" className="h-7 text-[10px] bg-green-600" onClick={() => updateStatusMutation.mutate({ id: req.id, status: "Completed" })} data-testid={`complete-request-${req.id}`}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Completed
                    </Button>
                  )}
                  <a href={`tel:${req.customerPhone}`}>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" data-testid={`call-request-${req.id}`}>
                      <Phone className="h-3 w-3 mr-1" /> Call
                    </Button>
                  </a>
                  <a href={`https://wa.me/91${req.customerPhone?.replace(/\D/g, "")}?text=Hi ${req.customerName}, regarding your ${req.serviceName} booking request...`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] text-green-600 border-green-200" data-testid={`whatsapp-request-${req.id}`}>
                      <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                    </Button>
                  </a>
                  <Button size="sm" variant="outline" className="h-7 text-[10px] text-red-500 border-red-200" onClick={() => { if (confirm("Delete this request?")) deleteMutation.mutate(req.id); }} data-testid={`delete-request-${req.id}`}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const logout = useStore((state) => state.logout);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Product Management State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    originalPrice: "",
    image: "",
    images: [] as string[],
    category: "vegetables",
    unit: "",
    stock: "100",
  });

  // Fetch products from database
  interface DbProduct {
    id: number;
    name: string;
    price: number;
    originalPrice: number;
    image: string;
    category: string;
    unit: string | null;
    stock: number | null;
    isActive: string | null;
    sortOrder: number | null;
  }
  const { data: dbProductsData, isLoading: productsLoading } = useQuery<DbProduct[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  
  // Use only database products
  const products: Product[] = (dbProductsData || []).map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    category: p.category as "vegetables" | "fruits" | "dairy",
    unit: p.unit || "1 kg",
    sortOrder: p.sortOrder || 0,
  }));

  // Settings State
  const [settings, setSettings] = useState({
    minOrderForFreeDelivery: "149",
    deliveryCharge: "20",
    morningSlotStart: "7",
    morningSlotEnd: "12",
    eveningSlotStart: "16",
    eveningSlotEnd: "21",
  });

  // Fetch delivery settings from database
  const { data: deliverySettingsData, refetch: refetchDeliverySettings } = useQuery<{
    minOrderForFreeDelivery: string;
    deliveryCharge: string;
  }>({
    queryKey: ["/api/settings/delivery"],
    queryFn: async () => {
      const res = await fetch("/api/settings/delivery");
      return res.json();
    },
  });

  // Update settings state when delivery settings load
  useEffect(() => {
    if (deliverySettingsData) {
      setSettings(prev => ({
        ...prev,
        minOrderForFreeDelivery: deliverySettingsData.minOrderForFreeDelivery || "149",
        deliveryCharge: deliverySettingsData.deliveryCharge || "20",
      }));
    }
  }, [deliverySettingsData]);

  // Save delivery settings
  const saveDeliverySettings = async () => {
    try {
      await fetch("/api/settings/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minOrderForFreeDelivery: settings.minOrderForFreeDelivery,
          deliveryCharge: settings.deliveryCharge,
        }),
      });
      refetchDeliverySettings();
      toast({
        title: "Saved!",
        description: "Delivery settings updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save delivery settings",
        variant: "destructive",
      });
    }
  };

  // ─── TODAY'S OFFERS ───────────────────────────────────
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    image: "",
    discount: "",
    isActive: "true",
    expiryDate: "",
  });
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);

  const { data: allOffersData = [], refetch: refetchOffers } = useQuery<any[]>({
    queryKey: ["/api/admin/offers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/offers");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const invalidateOffers = () => {
    refetchOffers();
    queryClient.invalidateQueries({ queryKey: ["/api/offers"] });
  };

  const saveOffer = async () => {
    if (!offerForm.title.trim()) {
      toast({ title: "Error", description: "Title required", variant: "destructive" });
      return;
    }
    try {
      const url = editingOfferId ? `/api/admin/offers/${editingOfferId}` : "/api/admin/offers";
      const method = editingOfferId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerForm),
      });
      if (!res.ok) throw new Error();
      invalidateOffers();
      setShowOfferForm(false);
      setEditingOfferId(null);
      setOfferForm({ title: "", description: "", image: "", discount: "", isActive: "true", expiryDate: "" });
      toast({ title: editingOfferId ? "Offer Updated!" : "Offer Added!", description: "Offer saved successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to save offer", variant: "destructive" });
    }
  };

  const deleteOffer = async (id: number) => {
    try {
      await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
      invalidateOffers();
      toast({ title: "Deleted", description: "Offer removed" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const toggleOfferActive = async (offer: any) => {
    try {
      await fetch(`/api/admin/offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...offer, isActive: offer.isActive === "true" ? "false" : "true" }),
      });
      invalidateOffers();
    } catch {
      toast({ title: "Error", description: "Failed to toggle offer", variant: "destructive" });
    }
  };

  const { data: serviceRequestsData } = useQuery<any[]>({
    queryKey: ["/api/service-requests"],
    queryFn: async () => {
      const res = await fetch("/api/service-requests");
      if (!res.ok) return [];
      return res.json();
    }
  });
  const pendingServiceRequests = (serviceRequestsData || []).filter((r: any) => r.status === "Pending").length;

  // Contact Number Settings State
  const [contactNumber, setContactNumber] = useState("9999878381");

  // Fetch Contact Number from database
  const { data: contactNumberData, refetch: refetchContactNumber } = useQuery<{
    contactNumber: string;
  }>({
    queryKey: ["/api/settings/contact-number"],
    queryFn: async () => {
      const res = await fetch("/api/settings/contact-number");
      return res.json();
    },
  });

  // Update Contact Number state when data loads
  useEffect(() => {
    if (contactNumberData?.contactNumber) {
      setContactNumber(contactNumberData.contactNumber);
    }
  }, [contactNumberData]);

  // Save Contact Number
  const saveContactNumber = async () => {
    try {
      await fetch("/api/settings/contact-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactNumber }),
      });
      refetchContactNumber();
      toast({
        title: "Saved!",
        description: "Contact number updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save contact number",
        variant: "destructive",
      });
    }
  };

  // Category Management State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    type: "product",
    iconKey: "",
    imageUrl: "",
    colorStart: "from-green-100",
    colorEnd: "to-green-200",
    borderColor: "border-green-300",
    textColor: "text-green-900",
    sortOrder: "0",
    isActive: "true",
    showOnHome: "true",
  });

  // Service Management State
  const [showAddService, setShowAddService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    originalPrice: "",
    image: "",
    categorySlug: "",
    unit: "per service",
    sortOrder: "0",
    isActive: "true",
  });

  // Customer Editing State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerEditAreaId, setCustomerEditAreaId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSegment, setCustomerSegment] = useState<"all" | "regular" | "never_ordered" | "low_activity">("all");
  
  // Contacts Copy State
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [contactsSearch, setContactsSearch] = useState("");

  // Order Search State
  const [orderSearch, setOrderSearch] = useState("");

  // Sales Modal State
  const [showSalesModal, setShowSalesModal] = useState(false);

  // Payment QR Code State
  const [paymentQrCode, setPaymentQrCode] = useState<string | null>(null);
  const [qrUploading, setQrUploading] = useState(false);

  // Home Banner State
  const [homeBanner, setHomeBanner] = useState<string | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);

  // Banner Text State
  const [bannerText, setBannerText] = useState({
    tagLine: "🏠 Daily Essentials & Services",
    mainHeading: "Fresh Groceries Delivered",
    subHeading: "+ Home Services You Trust",
    description: "Veggies, Fruits, Dairy | Electricity, Mobile, Water RO & More",
    buttonText: "Shop Now"
  });
  const [bannerTextSaving, setBannerTextSaving] = useState(false);

  // Order Details State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<Array<{
    id: number;
    orderId: number;
    productId: number | null;
    productName: string;
    category: string;
    quantity: number;
    unit: string;
    price: number;
  }>>([]);
  const [orderItemsLoading, setOrderItemsLoading] = useState(false);

  const fetchOrderItems = async (orderId: number) => {
    setOrderItemsLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/items`);
      if (res.ok) {
        const data = await res.json();
        setOrderItems(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch order items:", error);
      setOrderItems([]);
    } finally {
      setOrderItemsLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    fetchOrderItems(order.id);
  };

  // Fetch stats from API
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      return res.json();
    },
  });

  // Fetch daily sales (65 days)
  const { data: dailySalesData, isLoading: dailySalesLoading } = useQuery<DailySale[]>({
    queryKey: ["/api/admin/sales/daily"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sales/daily?days=65");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: showSalesModal,
  });
  const dailySales = Array.isArray(dailySalesData) ? dailySalesData : [];

  // Fetch monthly sales (60 months)
  const { data: monthlySalesData, isLoading: monthlySalesLoading } = useQuery<MonthlySale[]>({
    queryKey: ["/api/admin/sales/monthly"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sales/monthly?months=60");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: showSalesModal,
  });
  const monthlySales = Array.isArray(monthlySalesData) ? monthlySalesData : [];

  // Fetch customers with order stats from API (auto-refresh every 4 seconds)
  const { data: customersData, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/customers/analytics");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 4000,
  });
  const allCustomers = Array.isArray(customersData) ? customersData : [];
  
  // Fetch sellers separately
  const { data: sellersData } = useQuery<any[]>({
    queryKey: ["/api/sellers"],
    queryFn: async () => {
      const res = await fetch("/api/sellers");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 4000,
  });
  const allSellers = Array.isArray(sellersData) ? sellersData : [];
  const [sellerCategoryModal, setSellerCategoryModal] = useState<any>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Filter customers by segment
  const customers = allCustomers
    .filter(customer => {
      if (customerSegment === "all") return true;
      const orderCount = customer.orderCount || 0;
      if (customerSegment === "never_ordered") return orderCount === 0;
      if (customerSegment === "regular") return orderCount >= 3;
      if (customerSegment === "low_activity") return orderCount > 0 && orderCount < 3;
      return true;
    })
    .sort((a, b) => {
      // Sort by createdAt date - newest first
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  // Track previous counts for notifications
  const [prevOrderCount, setPrevOrderCount] = useState<number>(0);
  const [prevCustomerCount, setPrevCustomerCount] = useState<number>(0);
  const [prevSellerCount, setPrevSellerCount] = useState<number>(0);

  // Fetch orders from API (auto-refresh every 4 seconds)
  const { data: ordersData, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 4000,
  });
  
  // Sort orders by newest first (by createdAt or id)
  const orders = Array.isArray(ordersData) 
    ? [...ordersData].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
        return dateB - dateA; // Newest first
      })
    : [];

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVMHK4be1amKWC4kY6q3n4pxZXebt5yYhVg6JTlZjLaxq5xqOy4iRXmVq6WdkH5jSj9GTU1QV2Vyfpufr7OnnZJzVjofEzJFZpmvtauehXFeUFZTVVRZX2x1hpahtLO0q52EZT8sCBwsVH6mrLm2tK2dk4R1a2hrbn6PorS+vreulnpVLAoIDjdllamwsLGtoZmQh4F7fH6DiJOhsL7Fxr23qZN0SyEJCx9Fa5+tsLCrpJyWkY+Mi4yOk5qir7rExMC7sZ6EZDoWDxE1Xoqjq6yopqKenJqanZydoKOlr7zIy8nBsqCLa0kkFBInS3aQoKajpKOioqSoqKqqq6uutbnDy8rFuKyae1o3HxYkO1d8j5ycoqanra+zsrKwrq2utrvCx8nExLmvnolrRyokN0dheYuWnKGmq7G2ura1s7Gwsri+w8TExcC4rqCQeGNNO0E+SFdodIKLlpyirK60t7a0s7O1t7y/w8TExcK9taqejntqXFFJSU5YWWN0gYqPl52iprCzsbOysrW3ury9vb6/vbyxppmPgXVoYFhYWl1hZnB4fYSNlJqgpa21tbSwrq6wtLe4urq7vL28tq2hloiAc2peWFZZXGFkaXF4foGJkJWco6mxtre3tLKwsbO2ubi5ury8u7exqZ+ThnxwZ2BcWlteYmVqb3V7gIaLkpmfpq2ztba2trOxsLG0t7i4uLq7u7m2sKihloqAfXRuamhnam1wcXV6foGGio6VnKKprK+ysrKysrGxsrS2tre4urq5trKuqaKblI6Ih4aEhIWGiIqLjpCSlZibn6Onq62vr6+vrrCwsLK0tre3t7e3t7azr6yopZ+bmJaUk5KSkpKSlJWXmZqcnp+hpKeoq6ytrq6urq6vsLGys7O0tLS0s7KxsK2qqaelpKKhn5+fn5+goKGipKWmqKmrrK2tr6+wsbGysrO0tbW1tbS0s7KxsK+uraunpqempqalpqanqKipqqutrq+wsbKzs7S0tLS0s7OysrGwsK+vrq6tra2trq6urq+vsLCxsbKys7O0tLS0tLSzs7OzsrKysrGxsbGxsbGxsbGxsbKysrKzs7Ozs7S0tLS0tLS0tLOzsrKysrKxsbGxsLCwsLCwsLCwsbGxsbKysrOzs7S0tLS0tLS0tLOzsrKysrGxsbCwsLCwsLCwsLCwsbGxsrKys7Ozsw==");
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  // Show notification when new order or customer comes
  useEffect(() => {
    if (orders.length > prevOrderCount && prevOrderCount > 0) {
      const newOrdersCount = orders.length - prevOrderCount;
      playNotificationSound();
      toast({
        title: `🔔 ${newOrdersCount} नया Order आया!`,
        description: "नए orders top पर दिख रहे हैं",
        duration: 5000,
      });
    }
    setPrevOrderCount(orders.length);
  }, [orders.length]);

  // Show notification when new customer registers
  useEffect(() => {
    const pendingCustomers = allCustomers.filter(c => c.approvalStatus === "pending");
    if (pendingCustomers.length > prevCustomerCount && prevCustomerCount >= 0) {
      const newCount = pendingCustomers.length - prevCustomerCount;
      if (newCount > 0 && prevCustomerCount > 0) {
        playNotificationSound();
        toast({
          title: `👤 ${newCount} नया Customer Request!`,
          description: "Approval pending में देखें",
          duration: 5000,
        });
      }
    }
    setPrevCustomerCount(pendingCustomers.length);
  }, [allCustomers]);

  // Show notification when new seller registers
  useEffect(() => {
    const pendingSellers = allSellers.filter((c: any) => c.sellerStatus === 'pending');
    if (pendingSellers.length > prevSellerCount && prevSellerCount >= 0) {
      const newCount = pendingSellers.length - prevSellerCount;
      if (newCount > 0 && prevSellerCount > 0) {
        playNotificationSound();
        toast({
          title: `🏪 ${newCount} नया Seller Request!`,
          description: "Sellers tab में देखें",
          duration: 5000,
        });
      }
    }
    setPrevSellerCount(pendingSellers.length);
  }, [allSellers]);

  // Fetch categories from API
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const categoriesList = Array.isArray(categoriesData) 
    ? [...categoriesData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) 
    : [];

  // Fetch services from API
  const { data: servicesData, isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const servicesList = Array.isArray(servicesData) 
    ? [...servicesData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) 
    : [];

  // Fetch areas with sub-areas from API
  const { data: areasData, isLoading: areasLoading } = useQuery<AreaWithSubAreas[]>({
    queryKey: ["/api/areas-with-sub-areas"],
    queryFn: async () => {
      const res = await fetch("/api/areas-with-sub-areas");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const areasList = Array.isArray(areasData) 
    ? [...areasData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) 
    : [];

  // Area management state
  const [showAddArea, setShowAddArea] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [newArea, setNewArea] = useState({ name: "" });
  const [showAddSubArea, setShowAddSubArea] = useState<number | null>(null);
  const [editingSubArea, setEditingSubArea] = useState<SubArea | null>(null);
  const [newSubArea, setNewSubArea] = useState({ name: "" });

  // Delivery Slots
  interface DeliverySlot {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    isActive: string;
    sortOrder: number;
  }
  interface AreaSlotSetting {
    id: number;
    areaId: number;
    slotId: number;
    isActive: string;
  }
  const { data: deliverySlotsData, isLoading: slotsLoading, refetch: refetchSlots } = useQuery<DeliverySlot[]>({
    queryKey: ["/api/delivery-slots"],
    queryFn: async () => {
      const res = await fetch("/api/delivery-slots");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const deliverySlots = Array.isArray(deliverySlotsData) ? deliverySlotsData : [];
  
  // State for area-specific slot visibility
  const [selectedAreaForSlots, setSelectedAreaForSlots] = useState<number | null>(null);
  const { data: areaSlotSettingsData, refetch: refetchAreaSlotSettings } = useQuery<AreaSlotSetting[]>({
    queryKey: ["/api/delivery-slots/area-settings", selectedAreaForSlots],
    queryFn: async () => {
      if (!selectedAreaForSlots) return [];
      const res = await fetch(`/api/delivery-slots/area-settings/${selectedAreaForSlots}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedAreaForSlots,
  });
  const areaSlotSettings = Array.isArray(areaSlotSettingsData) ? areaSlotSettingsData : [];

  // Fetch all area slot settings for matrix view
  const { data: allAreaSlotSettingsData, refetch: refetchAllAreaSlotSettings } = useQuery<AreaSlotSetting[]>({
    queryKey: ["/api/delivery-slots/all-area-settings"],
    queryFn: async () => {
      const res = await fetch("/api/delivery-slots/all-area-settings");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const allAreaSlotSettings = Array.isArray(allAreaSlotSettingsData) ? allAreaSlotSettingsData : [];

  // Helper function to check if a slot is enabled for an area
  const isSlotEnabledForArea = (areaId: number, slotId: number) => {
    const setting = allAreaSlotSettings.find(s => s.areaId === areaId && s.slotId === slotId);
    // If no specific setting, default to enabled (follows global setting)
    if (!setting) return true;
    return String(setting.isActive) === "true";
  };

  // Toggle slot for area
  const toggleAreaSlot = async (areaId: number, slotId: number, currentlyEnabled: boolean) => {
    await fetch("/api/delivery-slots/area-visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        areaId,
        slotId,
        isActive: currentlyEnabled ? "false" : "true",
      }),
    });
    refetchAllAreaSlotSettings();
    refetchAreaSlotSettings();
  };

  // Payment QR Code Query
  const { data: paymentQrData, refetch: refetchPaymentQr } = useQuery<{ qrCode: string | null }>({
    queryKey: ["/api/settings/payment-qr"],
    queryFn: async () => {
      const res = await fetch("/api/settings/payment-qr");
      return res.json();
    },
  });

  // Banners Query
  const { data: bannersData, isLoading: bannersLoading, refetch: refetchBanners } = useQuery<Banner[]>({
    queryKey: ["/api/banners"],
    queryFn: async () => {
      const res = await fetch("/api/banners");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const bannersList = Array.isArray(bannersData) 
    ? [...bannersData].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) 
    : [];

  // Banner management state
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [newBanner, setNewBanner] = useState({
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    ctaText: "",
    ctaLink: "",
    bgColor: "from-green-400 to-green-600",
    textColor: "white",
    isActive: "true",
    sortOrder: 0,
  });

  // Update local state when data changes
  const currentPaymentQr = paymentQrData?.qrCode || paymentQrCode;

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setQrUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPaymentQrCode(base64);
      
      await fetch("/api/settings/payment-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: base64 }),
      });
      refetchPaymentQr();
      setQrUploading(false);
      toast({ title: "Saved!", description: "Payment QR code uploaded" });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = async () => {
    setPaymentQrCode(null);
    await fetch("/api/settings/payment-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCode: "" }),
    });
    refetchPaymentQr();
    toast({ title: "Removed", description: "Payment QR code removed" });
  };

  // Home Banner Query
  const { data: homeBannerData, refetch: refetchHomeBanner } = useQuery<{ banner: string | null }>({
    queryKey: ["/api/settings/home-banner"],
    queryFn: async () => {
      const res = await fetch("/api/settings/home-banner");
      return res.json();
    },
  });
  const currentHomeBanner = homeBannerData?.banner || homeBanner;

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBannerUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setHomeBanner(base64);
      
      await fetch("/api/settings/home-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banner: base64 }),
      });
      refetchHomeBanner();
      setBannerUploading(false);
      toast({ title: "Saved!", description: "Home banner uploaded" });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBanner = async () => {
    setHomeBanner(null);
    await fetch("/api/settings/home-banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banner: "" }),
    });
    refetchHomeBanner();
    toast({ title: "Removed", description: "Home banner removed" });
  };

  // Banner Text Query
  const { data: bannerTextData, refetch: refetchBannerText } = useQuery<{
    tagLine: string;
    mainHeading: string;
    subHeading: string;
    description: string;
    buttonText: string;
  }>({
    queryKey: ["/api/settings/banner-text"],
    queryFn: async () => {
      const res = await fetch("/api/settings/banner-text");
      return res.json();
    },
  });

  // Update local state when data loads
  useEffect(() => {
    if (bannerTextData) {
      setBannerText(bannerTextData);
    }
  }, [bannerTextData]);

  const handleSaveBannerText = async () => {
    setBannerTextSaving(true);
    await fetch("/api/settings/banner-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bannerText),
    });
    refetchBannerText();
    setBannerTextSaving(false);
    toast({
      title: "Saved!",
      description: "Banner text updated successfully",
    });
  };

  // Stock filter state
  const [stockFilter, setStockFilter] = useState<'all' | 'today' | 'weekly' | 'pending' | 'purchase'>('purchase');

  // Admin Credentials State
  const [adminCredentials, setAdminCredentials] = useState({
    currentPassword: "",
    newUsername: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [adminCredentialsSaving, setAdminCredentialsSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSaveAdminCredentials = async () => {
    if (!adminCredentials.currentPassword) {
      toast({ title: "Error", description: "Please enter current password", variant: "destructive" });
      return;
    }
    if (adminCredentials.newPassword && adminCredentials.newPassword !== adminCredentials.confirmPassword) {
      toast({ title: "Error", description: "New passwords don't match", variant: "destructive" });
      return;
    }
    if (!adminCredentials.newUsername && !adminCredentials.newPassword) {
      toast({ title: "Error", description: "Please enter new username or password", variant: "destructive" });
      return;
    }

    setAdminCredentialsSaving(true);
    try {
      const response = await fetch("/api/admin/update-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: adminCredentials.currentPassword,
          newUsername: adminCredentials.newUsername || undefined,
          newPassword: adminCredentials.newPassword || undefined
        }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update credentials");
      }
      
      toast({ title: "Success!", description: "Admin credentials updated" });
      setAdminCredentials({ currentPassword: "", newUsername: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setAdminCredentialsSaving(false);
    }
  };

  // Fetch stock summary from API with filters
  interface StockItem {
    productName: string;
    category: string;
    totalQuantity: number;
    unit: string | null;
    unitPrice: number;
    totalCost: number;
  }
  const { data: stockSummaryData, isLoading: stockLoading, refetch: refetchStock } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-summary", stockFilter],
    queryFn: async () => {
      let url = "/api/stock-summary";
      const params = new URLSearchParams();
      
      if (stockFilter === 'today') {
        params.append('filter', 'today');
      } else if (stockFilter === 'weekly') {
        params.append('filter', 'weekly');
      }
      if (stockFilter === 'pending') {
        params.append('status', 'Pending');
      } else if (stockFilter === 'purchase') {
        // Total Purchase Quantity: Pending + Shipped + Out of Delivery
        params.append('status', 'Pending,Shipped,Out of Delivery,Processing');
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
  const stockSummary = Array.isArray(stockSummaryData) ? stockSummaryData : [];

  // Group stock by category
  const stockByCategory = stockSummary.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, StockItem[]>);

  // Export stock summary as PDF
  const exportStockPDF = () => {
    if (stockSummary.length === 0) return;
    
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(34, 139, 34);
    doc.text('AtoZDukaan - Purchase List', 14, 20);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${today}`, 14, 28);
    
    // Filter info
    const filterLabel = stockFilter === 'purchase' ? 'Total Purchase Qty' : 
                        stockFilter === 'pending' ? 'Pending Only' :
                        stockFilter === 'today' ? 'Today' :
                        stockFilter === 'weekly' ? 'Last 7 Days' : 'All Time';
    doc.text(`Filter: ${filterLabel}`, 14, 34);
    
    // Table data
    const tableData = stockSummary.map(item => [
      item.productName,
      item.category,
      item.totalQuantity.toString(),
      item.unit || 'kg',
      `Rs ${item.totalCost}`
    ]);
    
    // Add total row
    tableData.push(['', '', '', 'Grand Total:', `Rs ${stockTotalCost}`]);
    
    autoTable(doc, {
      startY: 40,
      head: [['Product Name', 'Category', 'Qty', 'Unit', 'Estimated']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [34, 139, 34],
        textColor: 255,
        fontStyle: 'bold'
      },
      footStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 250, 245] },
      styles: { fontSize: 10 },
    });
    
    doc.save(`purchase-list-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export customers to CSV
  const exportCustomersCSV = () => {
    if (customers.length === 0) return;
    
    const headers = ['Name', 'Mobile Number', 'Address', 'Area', 'Sub-Area', 'Email'];
    const csvData = customers.map(c => [
      c.name || c.username || '',
      c.phone || '',
      c.address || '',
      c.mainAreaName || '',
      c.subAreaName || '',
      c.username || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export customers to PDF
  const exportCustomersPDF = () => {
    if (customers.length === 0) return;
    
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(34, 139, 34);
    doc.text('AtoZDukaan - Customer List', 14, 20);
    
    // Date and count
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${today}`, 14, 28);
    doc.text(`Total Customers: ${customers.length}`, 14, 34);
    
    // Table data
    const tableData = customers.map((c, idx) => [
      (idx + 1).toString(),
      c.name || c.username || '-',
      c.phone || '-',
      c.address || '-',
      c.mainAreaName || '-',
      c.subAreaName || '-'
    ]);
    
    autoTable(doc, {
      startY: 42,
      head: [['#', 'Name', 'Mobile', 'Address', 'Area', 'Sub-Area']],
      body: tableData,
      theme: 'striped',
      headStyles: { 
        fillColor: [34, 139, 34],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [245, 250, 245] },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 30 },
        2: { cellWidth: 25 },
        3: { cellWidth: 55 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 }
      }
    });
    
    doc.save(`customers-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Calculate totals for stock summary
  const stockTotalCost = stockSummary.reduce((acc, item) => acc + (item.totalCost || 0), 0);

  // Generate and download order invoice PDF
  const downloadOrderInvoice = async (order: Order) => {
    try {
      // Fetch latest order data and items in parallel
      const [orderRes, itemsRes] = await Promise.all([
        fetch(`/api/orders`),
        fetch(`/api/orders/${order.id}/items`)
      ]);
      const allOrders = await orderRes.json();
      const items = await itemsRes.json();
      
      // Get the latest order data with updated payment status
      const latestOrder = allOrders.find((o: Order) => o.id === order.id) || order;
      
      const doc = new jsPDF();
      const orderDate = new Date(order.createdAt || new Date()).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Header - Company Name
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('AtoZDukaan', 14, 20);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text('Fresh Groceries & Home Services', 14, 27);
      doc.text('📞 9999878381  |  🌐 atozdukaan.com', 14, 33);
      
      // Invoice Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('INVOICE', 150, 20);
      
      // Order Info Box
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60);
      doc.text(`Invoice #: INV-${order.id.toString().padStart(4, '0')}`, 135, 28);
      doc.text(`Date: ${orderDate}`, 135, 34);
      
      // Divider line
      doc.setDrawColor(200);
      doc.line(14, 38, 196, 38);
      
      // Customer Details
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Bill To:', 14, 48);
      doc.setFontSize(10);
      doc.setTextColor(60);
      let customerY = 52;
      doc.text(order.customerName || 'Customer', 14, customerY);
      customerY += 6;
      if (order.customerPhone) {
        doc.text(`Phone: ${order.customerPhone}`, 14, customerY);
        customerY += 6;
      }
      if (order.mainAreaName || order.subAreaName) {
        const areaText = `Area: ${order.mainAreaName || ''}${order.subAreaName ? ' - ' + order.subAreaName : ''}`;
        doc.text(areaText, 14, customerY);
        customerY += 6;
      }
      if (order.deliveryAddress) {
        const addressLines = doc.splitTextToSize(`Address: ${order.deliveryAddress}`, 80);
        doc.text(addressLines, 14, customerY);
        customerY += addressLines.length * 5;
      }
      doc.text(`Delivery: ${order.deliverySlot || 'N/A'}`, 14, customerY);
      
      // Calculate table start Y based on customer details
      const tableStartY = Math.max(customerY + 15, 80);
      
      // Items Table with serial numbers
      const tableData = Array.isArray(items) && items.length > 0 
        ? items.map((item: any, index: number) => [
            (index + 1).toString(),
            item.productName,
            item.quantity.toString(),
            item.unit || 'kg',
            `Rs ${item.price}`,
            `Rs ${item.quantity * item.price}`
          ])
        : [['1', 'No items found', '-', '-', '-', '-']];
      
      autoTable(doc, {
        startY: tableStartY,
        head: [['#', 'Product', 'Qty', 'Unit', 'Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [34, 139, 34],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        alternateRowStyles: { fillColor: [245, 250, 245] },
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          1: { cellWidth: 60 },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      });
      
      // Get the final Y position after the table
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      
      // Order Notes (if any)
      if (order.orderNotes) {
        doc.setFillColor(255, 250, 230);
        const notesLines = doc.splitTextToSize(`Notes: ${order.orderNotes}`, 180);
        const notesHeight = notesLines.length * 5 + 10;
        doc.rect(14, finalY, 182, notesHeight, 'F');
        doc.setFontSize(10);
        doc.setTextColor(100, 80, 0);
        doc.text('Customer Notes:', 18, finalY + 6);
        doc.setTextColor(60);
        doc.text(notesLines, 18, finalY + 12);
        finalY += notesHeight + 5;
      }
      
      // Total Amount
      if (order.referralDiscount > 0) {
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Gross Amount:`, 125, finalY + 8);
        doc.text(`Rs ${order.total + order.referralDiscount}`, 170, finalY + 8);
        finalY += 8;
        doc.setTextColor(34, 139, 34);
        doc.text(`Referral Discount:`, 125, finalY + 8);
        doc.text(`-Rs ${order.referralDiscount}`, 170, finalY + 8);
        finalY += 10;
      }
      doc.setFillColor(240, 240, 240);
      doc.rect(120, finalY, 75, 12, 'F');
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(order.referralDiscount > 0 ? 'Net Payable:' : 'Grand Total:', 125, finalY + 8);
      doc.setFontSize(14);
      doc.setTextColor(34, 139, 34);
      doc.text(`Rs ${order.total}`, 170, finalY + 8);
      
      finalY += 18;
      
      // Payment Status (use latestOrder to get updated payment status)
      const paymentStatusText = latestOrder.paymentStatus === 'online_paid' 
        ? 'Payment: Online Payment Done' 
        : latestOrder.paymentStatus === 'cod' 
        ? 'Payment: Cash on Delivery' 
        : 'Payment: Pending';
      const paymentStatusColor = latestOrder.paymentStatus === 'online_paid' 
        ? [34, 139, 34] : latestOrder.paymentStatus === 'cod' 
        ? [59, 130, 246] : [234, 179, 8];
      doc.setFillColor(paymentStatusColor[0], paymentStatusColor[1], paymentStatusColor[2]);
      doc.roundedRect(14, finalY, 80, 10, 2, 2, 'F');
      doc.setFontSize(10);
      doc.setTextColor(255);
      doc.text(paymentStatusText, 18, finalY + 7);
      
      finalY += 18;
      
      // Payment QR Code (if available)
      if (currentPaymentQr) {
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text('Pay via UPI / Paytm / PhonePe', 14, finalY);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('Scan the QR code to make payment', 14, finalY + 6);
        
        try {
          doc.addImage(currentPaymentQr, 'PNG', 14, finalY + 10, 45, 45);
          finalY += 60;
        } catch (err) {
          console.error('Failed to add QR code to PDF:', err);
        }
      }
      
      // Footer
      doc.setFontSize(9);
      doc.setTextColor(150);
      doc.text('Thank you for shopping with AtoZDukaan!', 14, finalY + 10);
      doc.text('For queries: Call 9999878381 | WhatsApp: 9999878381', 14, finalY + 16);
      
      doc.save(`AtoZDukaan-Invoice-${order.id}.pdf`);
    } catch (error) {
      console.error('Error generating invoice:', error);
    }
  };

  // Filter service categories
  const serviceCategories = categoriesList.filter(c => c.type === "service");

  const handleMoveCategoryUp = (category: Category) => {
    const currentIndex = categoriesList.findIndex(c => c.id === category.id);
    if (currentIndex <= 0) return;
    
    const prevCategory = categoriesList[currentIndex - 1];
    const currentOrder = category.sortOrder || 0;
    const prevOrder = prevCategory.sortOrder || 0;
    
    updateCategoryMutation.mutate({ id: category.id, sortOrder: prevOrder });
    updateCategoryMutation.mutate({ id: prevCategory.id, sortOrder: currentOrder });
  };

  const handleMoveCategoryDown = (category: Category) => {
    const currentIndex = categoriesList.findIndex(c => c.id === category.id);
    if (currentIndex >= categoriesList.length - 1) return;
    
    const nextCategory = categoriesList[currentIndex + 1];
    const currentOrder = category.sortOrder || 0;
    const nextOrder = nextCategory.sortOrder || 0;
    
    updateCategoryMutation.mutate({ id: category.id, sortOrder: nextOrder });
    updateCategoryMutation.mutate({ id: nextCategory.id, sortOrder: currentOrder });
  };

  // Mutation for creating category
  const createCategoryMutation = useMutation({
    mutationFn: async (category: Omit<Category, "id">) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setShowAddCategory(false);
      setNewCategory({
        name: "", slug: "", type: "product", iconKey: "", imageUrl: "",
        colorStart: "from-green-100", colorEnd: "to-green-200",
        borderColor: "border-green-300", textColor: "text-green-900",
        sortOrder: "0", isActive: "true", showOnHome: "true",
      });
    },
  });

  // Mutation for updating category
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Category> & { id: number }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setEditingCategory(null);
    },
  });

  // Mutation for deleting category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
    },
  });

  // Mutation for creating service
  const createServiceMutation = useMutation({
    mutationFn: async (service: Omit<Service, "id">) => {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(service),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setShowAddService(false);
      setNewService({
        name: "", description: "", price: "", originalPrice: "",
        image: "", categorySlug: "", unit: "per service",
        sortOrder: "0", isActive: "true",
      });
    },
  });

  // Mutation for updating service
  const updateServiceMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Service> & { id: number }) => {
      const res = await fetch(`/api/services/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
      setEditingService(null);
    },
  });

  // Mutation for deleting service
  const deleteServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    },
  });

  // Banner mutations
  const createBannerMutation = useMutation({
    mutationFn: async (banner: Omit<Banner, "id" | "createdAt">) => {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(banner),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setShowAddBanner(false);
      setNewBanner({
        title: "", subtitle: "", description: "", imageUrl: "",
        ctaText: "", ctaLink: "", bgColor: "from-green-400 to-green-600",
        textColor: "white", isActive: "true", sortOrder: 0,
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Banner> & { id: number }) => {
      const res = await fetch(`/api/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setEditingBanner(null);
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/banners/${id}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
    },
  });

  // Area mutations
  const createAreaMutation = useMutation({
    mutationFn: async (area: { name: string }) => {
      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(area),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas-with-sub-areas"] });
      setShowAddArea(false);
      setNewArea({ name: "" });
    },
  });

  const updateAreaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Area> }) => {
      const res = await fetch(`/api/areas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas-with-sub-areas"] });
      setEditingArea(null);
    },
  });

  const deleteAreaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/areas/${id}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas-with-sub-areas"] });
    },
  });

  // Sub-area mutations
  const createSubAreaMutation = useMutation({
    mutationFn: async (subArea: { areaId: number; name: string }) => {
      const res = await fetch("/api/sub-areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subArea),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas-with-sub-areas"] });
      setShowAddSubArea(null);
      setNewSubArea({ name: "" });
    },
  });

  const updateSubAreaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SubArea> }) => {
      const res = await fetch(`/api/sub-areas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas-with-sub-areas"] });
      setEditingSubArea(null);
    },
  });

  const deleteSubAreaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/sub-areas/${id}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/areas-with-sub-areas"] });
    },
  });

  // Mutation for updating customer approval
  const updateApprovalMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/customers/${id}/approval`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  // Mutation for updating customer details
  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update customer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setEditingCustomer(null);
    },
  });

  // Mutation for deleting customer
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete customer");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Customer Deleted",
        description: "Customer has been removed successfully",
      });
    },
  });

  const handleDeleteCustomer = (id: string) => {
    if (confirm("क्या आप इस customer को delete करना चाहते हैं?")) {
      deleteCustomerMutation.mutate(id);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerEditAreaId(customer.mainAreaId?.toString() || "");
  };

  const handleSaveCustomer = () => {
    if (!editingCustomer) return;
    updateCustomerMutation.mutate({ 
      id: editingCustomer.id, 
      data: {
        name: editingCustomer.name,
        phone: editingCustomer.phone,
        username: editingCustomer.username,
        address: editingCustomer.address,
        mainAreaId: editingCustomer.mainAreaId,
        mainAreaName: editingCustomer.mainAreaName,
        subAreaId: editingCustomer.subAreaId,
        subAreaName: editingCustomer.subAreaName,
        approvalStatus: editingCustomer.approvalStatus,
        referralCode: editingCustomer.referralCode,
      }
    });
  };

  // Mutation for updating order status
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status,
          deliveredAt: status === "Delivered" ? new Date().toISOString() : undefined
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const handleApproveCustomer = (customerId: string) => {
    updateApprovalMutation.mutate({ id: customerId, status: "approved" });
  };

  const handleRejectCustomer = (customerId: string) => {
    updateApprovalMutation.mutate({ id: customerId, status: "rejected" });
  };

  const getApprovalBadge = (status: string | null) => {
    if (status === "approved") return { label: "Approved", color: "bg-green-100 text-green-700", icon: CheckCircle };
    if (status === "rejected") return { label: "Rejected", color: "bg-red-100 text-red-700", icon: XCircle };
    return { label: "Pending", color: "bg-yellow-100 text-yellow-700", icon: Clock };
  };

  // Mutation for creating product
  const createProductMutation = useMutation({
    mutationFn: async (product: { name: string; price: number; originalPrice: number; image: string; images?: string[]; category: string; unit: string; stock: number }) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      if (!res.ok) throw new Error("Failed to create product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setNewProduct({ name: "", price: "", originalPrice: "", image: "", images: [], category: "vegetables", unit: "", stock: "100" });
      setShowAddProduct(false);
    },
  });

  // Mutation for deleting product
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Delete failed", description: String(error), variant: "destructive" });
    },
  });

  // Mutation for updating product
  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: number; sortOrder?: number; [key: string]: any }) => {
      const { id, ...updates } = data;
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  // Sort products by sortOrder
  const sortedProducts = [...products].sort((a, b) => ((a as any).sortOrder || 0) - ((b as any).sortOrder || 0));

  const handleMoveProductUp = (product: any) => {
    const currentIndex = sortedProducts.findIndex(p => p.id === product.id);
    if (currentIndex <= 0) return;
    
    const prevProduct = sortedProducts[currentIndex - 1];
    const currentOrder = product.sortOrder || 0;
    const prevOrder = prevProduct.sortOrder || 0;
    
    updateProductMutation.mutate({ id: product.id, sortOrder: prevOrder });
    updateProductMutation.mutate({ id: prevProduct.id, sortOrder: currentOrder });
  };

  const handleMoveProductDown = (product: any) => {
    const currentIndex = sortedProducts.findIndex(p => p.id === product.id);
    if (currentIndex >= sortedProducts.length - 1) return;
    
    const nextProduct = sortedProducts[currentIndex + 1];
    const currentOrder = product.sortOrder || 0;
    const nextOrder = nextProduct.sortOrder || 0;
    
    updateProductMutation.mutate({ id: product.id, sortOrder: nextOrder });
    updateProductMutation.mutate({ id: nextProduct.id, sortOrder: currentOrder });
  };

  const handleAddProduct = () => {
    const mainImage = newProduct.images.length > 0 ? newProduct.images[0] : newProduct.image;
    if (!newProduct.name || !newProduct.price || !mainImage) return;
    createProductMutation.mutate({
      name: newProduct.name,
      price: parseInt(newProduct.price),
      originalPrice: parseInt(newProduct.originalPrice) || parseInt(newProduct.price),
      image: mainImage,
      images: newProduct.images.length > 0 ? newProduct.images : (newProduct.image ? [newProduct.image] : []),
      category: newProduct.category,
      unit: newProduct.unit || "1 kg",
      stock: parseInt(newProduct.stock) || 100,
    });
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleUpdateOrderStatus = (orderId: number, newStatus: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status: newStatus });
  };

  const getOrderStatusColor = (status: string | null) => {
    switch(status) {
      case "Delivered": return "bg-green-100 text-green-700";
      case "Processing": return "bg-blue-100 text-blue-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;
    createCategoryMutation.mutate({
      name: newCategory.name.trim(),
      slug: newCategory.slug.trim(),
      type: newCategory.type,
      iconKey: newCategory.iconKey || null,
      imageUrl: newCategory.imageUrl || null,
      colorStart: newCategory.colorStart,
      colorEnd: newCategory.colorEnd,
      borderColor: newCategory.borderColor,
      textColor: newCategory.textColor,
      sortOrder: parseInt(newCategory.sortOrder) || 0,
      isActive: newCategory.isActive,
      showOnHome: newCategory.showOnHome,
    });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;
    updateCategoryMutation.mutate({
      id: editingCategory.id,
      name: editingCategory.name,
      slug: editingCategory.slug,
      iconKey: editingCategory.iconKey,
      imageUrl: editingCategory.imageUrl,
      colorStart: editingCategory.colorStart,
      colorEnd: editingCategory.colorEnd,
      borderColor: editingCategory.borderColor,
      textColor: editingCategory.textColor,
      sortOrder: editingCategory.sortOrder,
      isActive: editingCategory.isActive,
      showOnHome: editingCategory.showOnHome,
    });
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleAddService = () => {
    if (!newService.name.trim() || !newService.price || !newService.image || !newService.categorySlug) return;
    createServiceMutation.mutate({
      name: newService.name.trim(),
      description: newService.description || null,
      price: parseInt(newService.price) || 0,
      originalPrice: parseInt(newService.originalPrice) || parseInt(newService.price) || 0,
      image: newService.image,
      categorySlug: newService.categorySlug,
      unit: newService.unit || "per service",
      sortOrder: parseInt(newService.sortOrder) || 0,
      isActive: newService.isActive,
    });
  };

  const handleUpdateService = () => {
    if (!editingService) return;
    updateServiceMutation.mutate({
      id: editingService.id,
      name: editingService.name,
      description: editingService.description,
      price: editingService.price,
      originalPrice: editingService.originalPrice,
      image: editingService.image,
      categorySlug: editingService.categorySlug,
      unit: editingService.unit,
      sortOrder: editingService.sortOrder,
      isActive: editingService.isActive,
    });
  };

  const handleDeleteService = (id: number) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteServiceMutation.mutate(id);
    }
  };

  const handleAddBanner = () => {
    if (!newBanner.imageUrl.trim()) return;
    createBannerMutation.mutate({
      title: newBanner.title || null,
      subtitle: newBanner.subtitle || null,
      description: newBanner.description || null,
      imageUrl: newBanner.imageUrl,
      ctaText: newBanner.ctaText || null,
      ctaLink: newBanner.ctaLink || null,
      bgColor: newBanner.bgColor || null,
      textColor: newBanner.textColor || null,
      isActive: newBanner.isActive,
      sortOrder: newBanner.sortOrder,
    });
  };

  const handleUpdateBanner = () => {
    if (!editingBanner) return;
    updateBannerMutation.mutate({
      id: editingBanner.id,
      title: editingBanner.title,
      subtitle: editingBanner.subtitle,
      description: editingBanner.description,
      imageUrl: editingBanner.imageUrl,
      ctaText: editingBanner.ctaText,
      ctaLink: editingBanner.ctaLink,
      bgColor: editingBanner.bgColor,
      textColor: editingBanner.textColor,
      isActive: String(editingBanner.isActive),
      sortOrder: editingBanner.sortOrder,
    });
  };

  const handleDeleteBanner = (id: number) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      deleteBannerMutation.mutate(id);
    }
  };

  const getCategoryIcon = (iconKey: string | null) => {
    if (!iconKey || !LUCIDE_ICONS[iconKey]) return LayoutGrid;
    return LUCIDE_ICONS[iconKey];
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-blue-100 text-xs">AtoZDukaan Management</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Notification Badges */}
            {(() => {
              const pendingOrders = orders.filter(o => o.status === 'pending').length;
              const now = new Date();
              const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              const newCustomers = allCustomers.filter((c: any) => c.createdAt && new Date(c.createdAt) >= oneDayAgo && !c.isAdmin);
              const pendingSellers = allSellers.filter((c: any) => c.sellerStatus === 'pending').length;
              return (
                <div className="flex items-center gap-1">
                  {pendingOrders > 0 && (
                    <div 
                      className="bg-red-500 text-white text-xs px-2 py-1 rounded-full cursor-pointer animate-pulse"
                      onClick={() => setActiveTab('orders')}
                      data-testid="badge-pending-orders"
                    >
                      📦 {pendingOrders}
                    </div>
                  )}
                  {newCustomers.length > 0 && (
                    <div 
                      className="bg-green-500 text-white text-xs px-2 py-1 rounded-full cursor-pointer animate-pulse"
                      onClick={() => setActiveTab('customers')}
                      data-testid="badge-new-customers"
                    >
                      🆕 {newCustomers.length}
                    </div>
                  )}
                  {pendingServiceRequests > 0 && (
                    <div 
                      className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full cursor-pointer animate-pulse"
                      onClick={() => setActiveTab('requests')}
                      data-testid="badge-pending-requests"
                    >
                      📞 {pendingServiceRequests}
                    </div>
                  )}
                  {pendingSellers > 0 && (
                    <div 
                      className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full cursor-pointer animate-pulse"
                      onClick={() => setActiveTab('sellers')}
                      data-testid="badge-pending-sellers"
                    >
                      🏪 {pendingSellers}
                    </div>
                  )}
                </div>
              );
            })()}
            <Button
              onClick={() => {
                logout();
                setLocation("/admin-login");
              }}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              data-testid="admin-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 gap-1 mb-2">
            <TabsTrigger value="dashboard" className="text-[8px] px-0.5">Dashboard</TabsTrigger>
            <TabsTrigger value="categories" className="text-[8px] px-0.5">Categories</TabsTrigger>
            <TabsTrigger value="areas" className="text-[8px] px-0.5">Areas</TabsTrigger>
            <TabsTrigger value="orders" className="text-[8px] px-0.5">Orders</TabsTrigger>
          </TabsList>
          <TabsList className="w-full grid grid-cols-4 gap-1 mb-2">
            <TabsTrigger value="stock" className="text-[8px] px-0.5">Stock</TabsTrigger>
            <TabsTrigger value="customers" className="text-[8px] px-0.5">Customers</TabsTrigger>
            <TabsTrigger value="sellers" className="text-[8px] px-0.5">Sellers</TabsTrigger>
            <TabsTrigger value="staff" className="text-[8px] px-0.5">Staff</TabsTrigger>
          </TabsList>
          <TabsList className="w-full grid grid-cols-5 gap-1 mb-4">
            <TabsTrigger value="sales" className="text-[8px] px-0.5">Sales</TabsTrigger>
            <TabsTrigger value="requests" className="text-[8px] px-0.5">Requests</TabsTrigger>
            <TabsTrigger value="banners" className="text-[8px] px-0.5">Banners</TabsTrigger>
            <TabsTrigger value="pricelist" className="text-[8px] px-0.5">Rate List</TabsTrigger>
            <TabsTrigger value="settings" className="text-[8px] px-0.5">Settings</TabsTrigger>
          </TabsList>

          {/* Quick Links to Products & Services Pages */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Button
              variant="outline"
              className="h-14 flex flex-col gap-1 bg-green-50 border-green-200 hover:bg-green-100"
              onClick={() => setLocation("/admin/products")}
              data-testid="nav-products"
            >
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-xs font-medium text-green-700">Products</span>
            </Button>
            <Button
              variant="outline"
              className="h-14 flex flex-col gap-1 bg-blue-50 border-blue-200 hover:bg-blue-100"
              onClick={() => setLocation("/admin/services")}
              data-testid="nav-services"
            >
              <Settings className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Services</span>
            </Button>
            <Button
              variant="outline"
              className="h-14 flex flex-col gap-1 bg-purple-50 border-purple-200 hover:bg-purple-100"
              onClick={() => setLocation("/admin/accounts")}
              data-testid="nav-accounts"
            >
              <IndianRupee className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-medium text-purple-700">P&L</span>
            </Button>
          </div>

          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-4">
            {/* Today's Quick Stats */}
            {(() => {
              const today = new Date().toISOString().split('T')[0];
              const todayOrders = orders.filter(o => o.createdAt?.startsWith(today));
              const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
              return (
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs font-medium">Today's Stats</p>
                      <p className="text-2xl font-bold">₹{todayRevenue.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-bold">
                        {todayOrders.length} orders
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Card 
                  className="border shadow-sm cursor-pointer hover:shadow-md hover:border-green-300 transition-all" 
                  data-testid="stat-revenue"
                  onClick={() => setShowSalesModal(true)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                      <IndianRupee className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="text-xl font-bold text-green-600">₹{stats?.totalRevenue || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Total Revenue</div>
                    <div className="text-[8px] text-green-500 mt-1">Click for details →</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm" data-testid="stat-pending">
                  <CardContent className="p-4 text-center">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center mx-auto mb-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="text-xl font-bold text-orange-600">{stats?.pendingOrders || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Pending Orders</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm" data-testid="stat-products">
                  <CardContent className="p-4 text-center">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="text-xl font-bold text-blue-600">{stats?.totalProducts || products.length}</div>
                    <div className="text-[10px] text-muted-foreground">Total Products</div>
                  </CardContent>
                </Card>
                <Card className="border shadow-sm" data-testid="stat-customers">
                  <CardContent className="p-4 text-center">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="text-xl font-bold text-purple-600">{stats?.totalCustomers || 0}</div>
                    <div className="text-[10px] text-muted-foreground">Total Customers</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Orders in Dashboard */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Orders</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <p className="p-4 text-center text-muted-foreground text-sm">No orders yet</p>
                ) : (
                  orders.slice(0, 3).map((order, idx) => (
                    <div key={order.id} className={`flex items-center justify-between p-3 ${idx !== Math.min(orders.length, 3) - 1 ? "border-b" : ""}`}>
                      <div>
                        <p className="text-sm font-medium">Order #{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">₹{order.total}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Settings Quick Access */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Quick Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Free Delivery Above</span>
                  <span className="text-sm font-bold">₹{settings.minOrderForFreeDelivery}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Delivery Charge</span>
                  <span className="text-sm font-bold">₹{settings.deliveryCharge}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Morning Slot</span>
                  <span className="text-sm font-bold">{settings.morningSlotStart} AM - {settings.morningSlotEnd} PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Evening Slot</span>
                  <span className="text-sm font-bold">{parseInt(settings.eveningSlotStart) > 12 ? parseInt(settings.eveningSlotStart) - 12 : settings.eveningSlotStart} PM - {parseInt(settings.eveningSlotEnd) > 12 ? parseInt(settings.eveningSlotEnd) - 12 : settings.eveningSlotEnd} PM</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CATEGORIES TAB */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Categories ({categoriesList.length})</h2>
              <Button size="sm" onClick={() => setShowAddCategory(true)} className="gap-1" data-testid="button-add-category">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>

            {categoriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : categoriesList.length === 0 ? (
              <Card className="border">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No categories yet. Add your first category!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {categoriesList.map(category => {
                  const IconComponent = getCategoryIcon(category.iconKey);
                  return (
                    <Card key={category.id} className="border shadow-sm" data-testid={`category-card-${category.id}`}>
                      <CardContent className="p-3">
                        <div className="flex gap-3 items-center">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${category.colorStart} ${category.colorEnd} border ${category.borderColor} flex items-center justify-center`}>
                            {category.imageUrl ? (
                              <img src={category.imageUrl} alt={category.name} className="w-8 h-8 object-contain" />
                            ) : (
                              <IconComponent className={`h-6 w-6 ${category.textColor}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{category.name}</p>
                            <p className="text-xs text-muted-foreground">/{category.slug} • Order: {category.sortOrder}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${category.type === "service" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                {category.type === "service" ? "Service" : "Product"}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${category.isActive === "true" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                {category.isActive === "true" ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-0.5">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleMoveCategoryUp(category)}
                                data-testid={`move-up-category-${category.id}`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-6 w-6 p-0"
                                onClick={() => handleMoveCategoryDown(category)}
                                data-testid={`move-down-category-${category.id}`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0"
                                onClick={() => setEditingCategory(category)}
                                data-testid={`edit-category-${category.id}`}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                onClick={() => handleDeleteCategory(category.id)}
                                data-testid={`delete-category-${category.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
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

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Products ({sortedProducts.length})</h2>
              <Button size="sm" onClick={() => setShowAddProduct(true)} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>

            {/* Group products by category */}
            {(() => {
              const allCategories = categoriesList;
              const categoryOrder = allCategories.map(c => c.slug);
              const uniqueCategories = Array.from(new Set(sortedProducts.map(p => p.category)));
              const orderedCategories = [...uniqueCategories].sort((a, b) => {
                const aIndex = categoryOrder.indexOf(a);
                const bIndex = categoryOrder.indexOf(b);
                return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
              });
              
              return orderedCategories.map(category => {
                const categoryProducts = sortedProducts.filter(p => p.category === category);
                const categoryInfo = categoriesList.find(c => c.slug === category);
                const categoryName = categoryInfo?.name || category;
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-transparent p-2 rounded-lg">
                      <h3 className="text-sm font-bold capitalize text-primary">{categoryName}</h3>
                      <span className="text-xs text-muted-foreground">({categoryProducts.length} items)</span>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {categoryProducts.map(product => (
                        <Card key={product.id} className="border shadow-sm overflow-hidden" data-testid={`product-card-${product.id}`}>
                          <div className="relative">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-20 object-cover"
                            />
                            <div className="absolute top-1 right-1 flex gap-0.5">
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="h-5 w-5 p-0 bg-white/90 hover:bg-white shadow-sm"
                                onClick={() => setEditingProduct(product)}
                                data-testid={`edit-product-${product.id}`}
                              >
                                <Edit2 className="h-2.5 w-2.5" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="h-5 w-5 p-0 bg-white/90 hover:bg-red-50 text-red-600 shadow-sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                disabled={deleteProductMutation.isPending}
                                data-testid={`delete-product-${product.id}`}
                              >
                                {deleteProductMutation.isPending ? (
                                  <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-2.5 w-2.5" />
                                )}
                              </Button>
                            </div>
                            <div className="absolute bottom-1 left-1 flex gap-0.5">
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="h-5 w-5 p-0 bg-white/90 hover:bg-white shadow-sm"
                                onClick={() => handleMoveProductUp(product)}
                                data-testid={`move-up-product-${product.id}`}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                className="h-5 w-5 p-0 bg-white/90 hover:bg-white shadow-sm"
                                onClick={() => handleMoveProductDown(product)}
                                data-testid={`move-down-product-${product.id}`}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <CardContent className="p-2">
                            <p className="font-medium text-xs truncate">{product.name}</p>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="text-xs font-bold text-primary">₹{product.price}</span>
                              <span className="text-[10px] text-muted-foreground">{product.unit}</span>
                            </div>
                            {product.originalPrice > product.price && (
                              <span className="text-[10px] text-muted-foreground line-through">₹{product.originalPrice}</span>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </TabsContent>

          {/* SERVICES TAB */}
          <TabsContent value="services" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Services ({servicesList.length})</h2>
              <Button size="sm" onClick={() => setShowAddService(true)} className="gap-1" data-testid="add-service-btn">
                <Plus className="h-4 w-4" />
                Add Service
              </Button>
            </div>

            {servicesLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : servicesList.length === 0 ? (
              <Card className="border">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No services yet. Add your first service!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {servicesList.map(service => {
                  const category = categoriesList.find(c => c.slug === service.categorySlug);
                  return (
                    <Card key={service.id} className="border shadow-sm" data-testid={`service-card-${service.id}`}>
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <img 
                            src={service.image} 
                            alt={service.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{category?.name || service.categorySlug} • {service.unit}</p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm font-bold text-primary">₹{service.price}</span>
                              {service.originalPrice > service.price && (
                                <span className="text-xs text-muted-foreground line-through">₹{service.originalPrice}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingService(service)}
                              data-testid={`edit-service-${service.id}`}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteService(service.id)}
                              data-testid={`delete-service-${service.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* AREAS TAB */}
          <TabsContent value="areas" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Delivery Areas ({areasList.length})</h2>
              <Button size="sm" onClick={() => setShowAddArea(true)} className="gap-1" data-testid="add-area-btn">
                <Plus className="h-4 w-4" />
                Add Area
              </Button>
            </div>
            
            {areasLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : areasList.length === 0 ? (
              <Card className="border">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No areas yet. Add your first delivery area like Govindpuram or Shastri Nagar!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {areasList.map(area => (
                  <Card key={area.id} className="border shadow-sm" data-testid={`area-card-${area.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{area.name}</span>
                          <span className="text-xs text-muted-foreground">({area.subAreas.length} sub-areas)</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 px-2"
                            onClick={() => setShowAddSubArea(area.id)}
                            data-testid={`add-subarea-${area.id}`}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Sub-Area
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0"
                            onClick={() => setEditingArea(area)}
                            data-testid={`edit-area-${area.id}`}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Delete "${area.name}" and all its sub-areas?`)) {
                                deleteAreaMutation.mutate(area.id);
                              }
                            }}
                            data-testid={`delete-area-${area.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Sub-areas list */}
                      {area.subAreas.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                          {area.subAreas.map(subArea => (
                            <div key={subArea.id} className="flex items-center justify-between bg-white rounded px-3 py-2 border" data-testid={`subarea-${subArea.id}`}>
                              <span className="text-sm">{subArea.name}</span>
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => setEditingSubArea(subArea)}
                                  data-testid={`edit-subarea-${subArea.id}`}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0 text-red-600"
                                  onClick={() => {
                                    if (confirm(`Delete "${subArea.name}"?`)) {
                                      deleteSubAreaMutation.mutate(subArea.id);
                                    }
                                  }}
                                  data-testid={`delete-subarea-${subArea.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Add Sub-Area inline form */}
                      {showAddSubArea === area.id && (
                        <div className="mt-3 flex gap-2 bg-blue-50 p-3 rounded-lg">
                          <Input
                            placeholder="Enter sub-area name (e.g., Balaji Enclave)"
                            value={newSubArea.name}
                            onChange={(e) => setNewSubArea({ name: e.target.value })}
                            className="flex-1"
                            data-testid="input-new-subarea-name"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => {
                              if (newSubArea.name.trim()) {
                                createSubAreaMutation.mutate({ areaId: area.id, name: newSubArea.name.trim() });
                              }
                            }}
                            data-testid="save-new-subarea-btn"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setShowAddSubArea(null);
                              setNewSubArea({ name: "" });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Add Area Modal */}
            {showAddArea && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      Add New Area
                      <Button variant="ghost" size="sm" onClick={() => setShowAddArea(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Area name (e.g., Govindpuram)"
                      value={newArea.name}
                      onChange={(e) => setNewArea({ name: e.target.value })}
                      data-testid="input-new-area-name"
                    />
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        if (newArea.name.trim()) {
                          createAreaMutation.mutate({ name: newArea.name.trim() });
                        }
                      }}
                      data-testid="save-area-btn"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Area
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Edit Area Modal */}
            {editingArea && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      Edit Area
                      <Button variant="ghost" size="sm" onClick={() => setEditingArea(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Area name"
                      defaultValue={editingArea.name}
                      onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                      data-testid="input-edit-area-name"
                    />
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        updateAreaMutation.mutate({ id: editingArea.id, data: { name: editingArea.name } });
                      }}
                      data-testid="update-area-btn"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Update Area
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Edit Sub-Area Modal */}
            {editingSubArea && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      Edit Sub-Area
                      <Button variant="ghost" size="sm" onClick={() => setEditingSubArea(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Sub-area name"
                      defaultValue={editingSubArea.name}
                      onChange={(e) => setEditingSubArea({ ...editingSubArea, name: e.target.value })}
                      data-testid="input-edit-subarea-name"
                    />
                    <Button 
                      className="w-full" 
                      onClick={() => {
                        updateSubAreaMutation.mutate({ id: editingSubArea.id, data: { name: editingSubArea.name } });
                      }}
                      data-testid="update-subarea-btn"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Update Sub-Area
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">All Orders ({orders.length})</h2>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="pl-9"
                  data-testid="order-search-input"
                />
              </div>
            </div>
            
            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <Card className="border">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No orders yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const filteredOrders = orders.filter(order => {
                    if (!orderSearch.trim()) return true;
                    const search = orderSearch.toLowerCase();
                    return (
                      order.customerName?.toLowerCase().includes(search) ||
                      order.customerPhone?.toLowerCase().includes(search) ||
                      order.id.toString().includes(search)
                    );
                  });
                  
                  if (filteredOrders.length === 0 && orderSearch.trim()) {
                    return (
                      <Card className="border">
                        <CardContent className="p-6 text-center text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No orders found for "{orderSearch}"</p>
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => setOrderSearch("")}
                            className="mt-2"
                          >
                            Clear search
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  return filteredOrders.map(order => (
                  <Card 
                    key={order.id} 
                    className="border shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
                    data-testid={`order-card-${order.id}`}
                    onClick={() => handleViewOrder(order)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-sm">Order #{order.id}</p>
                          <p className="text-xs text-muted-foreground">{order.customerName} {order.customerPhone && `• ${order.customerPhone}`}</p>
                          {(order.mainAreaName || order.subAreaName) && (
                            <p className="text-xs text-blue-600 font-medium">📍 {order.mainAreaName}{order.subAreaName && ` → ${order.subAreaName}`}</p>
                          )}
                          <p className="text-xs text-muted-foreground">📅 Order: {formatDate(order.createdAt)} • {order.deliverySlot}</p>
                          {order.deliveredAt && (
                            <p className="text-xs text-green-600 font-medium">✅ Delivered: {formatDate(order.deliveredAt)}</p>
                          )}
                          {order.deliveryAddress && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={order.deliveryAddress}>{order.deliveryAddress}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {order.referralDiscount > 0 ? (
                            <>
                              <p className="text-xs text-muted-foreground line-through">₹{order.total + order.referralDiscount}</p>
                              <p className="text-xs text-green-600">🎁 -₹{order.referralDiscount}</p>
                              <p className="font-bold">₹{order.total}</p>
                            </>
                          ) : (
                            <p className="font-bold">₹{order.total}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{order.itemsCount} items</p>
                        </div>
                      </div>
                      
                      {order.orderNotes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mt-2 text-xs text-amber-800">
                          <span className="font-medium">📝 Notes:</span> {order.orderNotes}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <div className="flex-1" />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 gap-1 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadOrderInvoice(order);
                          }}
                          data-testid={`download-invoice-${order.id}`}
                        >
                          <Download className="h-3 w-3" />
                          Bill
                        </Button>
                        <select
                          value={order.status || "Pending"}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs border rounded px-2 py-1 bg-white"
                          data-testid={`order-status-${order.id}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                ));
                })()}
              </div>
            )}
          </TabsContent>

          {/* CUSTOMERS TAB */}
          <TabsContent value="customers" className="space-y-4">
            {(() => {
              const now = new Date();
              const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
              const recentCustomers = allCustomers.filter((c: Customer) => c.createdAt && new Date(c.createdAt) >= oneDayAgo);
              if (recentCustomers.length === 0) return null;
              return (
                <Card className="border-green-300 bg-green-50" data-testid="card-new-customers-alert">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🆕</span>
                      <p className="text-sm font-bold text-green-800">New Customers Today ({recentCustomers.length})</p>
                    </div>
                    <div className="space-y-2">
                      {recentCustomers.map((c: Customer) => (
                        <div key={c.id} className="bg-white rounded-lg p-2 border border-green-200 text-sm" data-testid={`new-customer-${c.id}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-green-900">{c.name || "No Name"}</span>
                            <span className="text-[10px] text-gray-500">{c.createdAt ? new Date(c.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 mt-0.5">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{c.phone || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-600 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">{c.address || "No address"}</span>
                          </div>
                          {(c.mainAreaName || c.subAreaName) && (
                            <div className="mt-1 flex gap-1 flex-wrap">
                              {c.mainAreaName && <Badge variant="secondary" className="text-[10px] px-1 py-0">{c.mainAreaName}</Badge>}
                              {c.subAreaName && <Badge variant="outline" className="text-[10px] px-1 py-0">{c.subAreaName}</Badge>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-bold">Customers ({customers.length})</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={customerSegment}
                  onChange={(e) => setCustomerSegment(e.target.value as "all" | "regular" | "never_ordered" | "low_activity")}
                  className="text-sm border rounded-md px-3 py-2 bg-white"
                  data-testid="select-customer-segment"
                >
                  <option value="all">All Customers ({allCustomers.length})</option>
                  <option value="regular">Regular (3+ orders) ({allCustomers.filter(c => (c.orderCount || 0) >= 3).length})</option>
                  <option value="never_ordered">Never Ordered ({allCustomers.filter(c => (c.orderCount || 0) === 0).length})</option>
                  <option value="low_activity">Low Activity (1-2 orders) ({allCustomers.filter(c => {const oc = c.orderCount || 0; return oc > 0 && oc < 3;}).length})</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowContactsModal(true)}
                  className="h-9 gap-1"
                  data-testid="btn-copy-contacts"
                >
                  <ClipboardList className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportCustomersCSV}
                  className="h-9 gap-1"
                  data-testid="btn-export-csv"
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportCustomersPDF}
                  className="h-9 gap-1"
                  data-testid="btn-export-pdf"
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search name, phone, referral code..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-md"
                    data-testid="input-customer-search"
                  />
                </div>
              </div>
            </div>
            
            {customersLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : customers.length === 0 ? (
              <Card className="border">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No customers registered yet
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {customers
                  .filter(customer => {
                    if (!customerSearch.trim()) return true;
                    const search = customerSearch.toLowerCase();
                    return (
                      (customer.name?.toLowerCase().includes(search)) ||
                      (customer.username?.toLowerCase().includes(search)) ||
                      (customer.phone?.toLowerCase().includes(search)) ||
                      (customer.address?.toLowerCase().includes(search)) ||
                      (customer.mainAreaName?.toLowerCase().includes(search)) ||
                      (customer.subAreaName?.toLowerCase().includes(search)) ||
                      (customer.referralCode?.toLowerCase().includes(search)) ||
                      (customer.referredBy?.toLowerCase().includes(search))
                    );
                  })
                  .map(customer => {
                  const badge = getApprovalBadge(customer.approvalStatus);
                  const BadgeIcon = badge.icon;
                  return (
                    <Card key={customer.id} className={`border shadow-sm ${customer.createdAt && (new Date().getTime() - new Date(customer.createdAt).getTime()) < 24 * 60 * 60 * 1000 ? 'border-green-300 bg-green-50/30' : ''}`} data-testid={`customer-card-${customer.id}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{customer.name || customer.username}</p>
                              {customer.createdAt && (new Date().getTime() - new Date(customer.createdAt).getTime()) < 24 * 60 * 60 * 1000 && (
                                <Badge className="bg-green-500 text-white text-[9px] px-1.5 py-0" data-testid={`badge-new-${customer.id}`}>NEW</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{customer.username}</p>
                            {customer.phone && <p className="text-xs text-blue-600 font-medium">📞 {customer.phone}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 w-7 p-0"
                              onClick={() => handleEditCustomer(customer)}
                              data-testid={`edit-customer-${customer.id}`}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${badge.color}`}>
                              <BadgeIcon className="h-3 w-3" />
                              {badge.label}
                            </div>
                          </div>
                        </div>
                        
                        {(customer.mainAreaName || customer.subAreaName) && (
                          <p className="text-xs text-blue-600 font-medium mb-1">📍 {customer.mainAreaName}{customer.subAreaName && ` → ${customer.subAreaName}`}</p>
                        )}
                        
                        {customer.address && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{customer.address}</p>
                        )}

                        {/* Join Source - Direct or Referral */}
                        <div className="mb-2">
                          {customer.referredBy ? (
                            <div className="bg-green-50 border border-green-200 rounded-md p-2">
                              <p className="text-xs font-medium text-green-800">
                                🔗 Referral Join
                              </p>
                              <p className="text-xs text-green-700">
                                Referred by code: <span className="font-bold">{customer.referredBy}</span>
                              </p>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-2">
                              <p className="text-xs font-medium text-gray-700">
                                ➡️ Direct Join
                              </p>
                              <p className="text-xs text-gray-500">No referral code used</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-2 text-xs">
                          {customer.referralCode && (
                            <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                              🎫 Code: {customer.referralCode}
                            </span>
                          )}
                          {customer.referralCount !== undefined && customer.referralCount > 0 && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                              👥 {customer.referralCount} Referral{customer.referralCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {(customer.referralBalance || 0) > 0 && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">
                              💰 Wallet: ₹{customer.referralBalance}
                            </span>
                          )}
                        </div>
                        
                        {/* Show who this customer referred */}
                        {customer.referralCode && (customer.referralCount || 0) > 0 && (
                          <div className="bg-blue-50 rounded-md p-2 mb-2">
                            <p className="text-xs font-medium text-blue-800 mb-1">Referred Users:</p>
                            <div className="flex flex-wrap gap-1">
                              {customers
                                .filter(c => c.referredBy === customer.referralCode)
                                .map(referred => (
                                  <span key={referred.id} className="bg-white text-xs px-2 py-0.5 rounded border text-blue-700">
                                    {referred.name || referred.username}
                                  </span>
                                ))
                              }
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            (customer.orderCount || 0) === 0 
                              ? "bg-red-100 text-red-700" 
                              : (customer.orderCount || 0) >= 3 
                                ? "bg-green-100 text-green-700" 
                                : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {(customer.orderCount || 0) === 0 
                              ? "Never Ordered" 
                              : `${customer.orderCount} Order${(customer.orderCount || 0) > 1 ? 's' : ''}`
                            }
                          </span>
                          {(customer.totalSpent || 0) > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                              Total: ₹{customer.totalSpent}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3">
                          Joined: {formatDate(customer.createdAt)}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-300 text-red-600 hover:bg-red-50"
                            disabled={deleteCustomerMutation.isPending}
                            onClick={() => handleDeleteCustomer(customer.id)}
                            data-testid={`delete-customer-${customer.id}`}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* SELLERS MANAGEMENT TAB */}
          <TabsContent value="sellers" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Store className="h-5 w-5" />
                Seller Management
              </h2>
            </div>
            
            {(() => {
              const pendingSellers = allSellers.filter((c: any) => c.sellerStatus === 'pending');
              const approvedSellers = allSellers.filter((c: any) => c.sellerStatus === 'approved');
              const rejectedSellers = allSellers.filter((c: any) => c.sellerStatus === 'rejected');
              
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-3 bg-yellow-50 border-yellow-200">
                      <div className="text-center">
                        <Clock className="h-6 w-6 mx-auto text-yellow-600 mb-1" />
                        <div className="text-2xl font-bold text-yellow-700">{pendingSellers.length}</div>
                        <div className="text-xs text-yellow-600">Pending</div>
                      </div>
                    </Card>
                    <Card className="p-3 bg-green-50 border-green-200">
                      <div className="text-center">
                        <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-1" />
                        <div className="text-2xl font-bold text-green-700">{approvedSellers.length}</div>
                        <div className="text-xs text-green-600">Approved</div>
                      </div>
                    </Card>
                    <Card className="p-3 bg-red-50 border-red-200">
                      <div className="text-center">
                        <XCircle className="h-6 w-6 mx-auto text-red-600 mb-1" />
                        <div className="text-2xl font-bold text-red-700">{rejectedSellers.length}</div>
                        <div className="text-xs text-red-600">Rejected</div>
                      </div>
                    </Card>
                  </div>

                  {pendingSellers.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Pending Approval ({pendingSellers.length})
                      </h3>
                      <div className="space-y-3">
                        {pendingSellers.map((seller: any) => (
                          <Card key={seller.id} className="p-4 border-yellow-200 bg-yellow-50/50">
                            <div className="flex flex-col gap-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium text-lg">{seller.shopName || 'No Shop Name'}</div>
                                  <div className="text-sm text-gray-600">{seller.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {seller.phone || 'No phone'}
                                  </div>
                                </div>
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                                  Pending
                                </Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setSellerCategoryModal(seller);
                                    setSelectedCategories(seller.allowedCategories || []);
                                  }}
                                  data-testid={`approve-seller-${seller.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                                  onClick={async () => {
                                    await fetch(`/api/admin/sellers/${seller.id}/reject`, { method: 'POST' });
                                    queryClient.invalidateQueries({ queryKey: ['/api/sellers'] });
                                  }}
                                  data-testid={`reject-seller-${seller.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this seller?')) {
                                      await fetch(`/api/admin/sellers/${seller.id}`, { method: 'DELETE' });
                                      queryClient.invalidateQueries({ queryKey: ['/api/sellers'] });
                                    }
                                  }}
                                  data-testid={`delete-seller-${seller.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {approvedSellers.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Approved Sellers ({approvedSellers.length})
                      </h3>
                      <div className="space-y-3">
                        {approvedSellers.map((seller: any) => (
                          <Card key={seller.id} className="p-4 border-green-200 bg-green-50/50">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium">{seller.shopName || 'No Shop Name'}</div>
                                  <div className="text-sm text-gray-600">{seller.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {seller.phone || 'No phone'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                    Active
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={async () => {
                                      if (confirm('Are you sure you want to delete this seller?')) {
                                        await fetch(`/api/admin/sellers/${seller.id}`, { method: 'DELETE' });
                                        queryClient.invalidateQueries({ queryKey: ['/api/sellers'] });
                                      }
                                    }}
                                    data-testid={`delete-approved-seller-${seller.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {seller.allowedCategories && seller.allowedCategories.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {seller.allowedCategories.map((cat: string) => {
                                    const catInfo = categoriesList.find((c: any) => c.slug === cat);
                                    return (
                                      <Badge key={cat} variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                        {catInfo?.name || cat}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-[10px] text-gray-400 mt-1">All categories allowed</p>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full mt-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => {
                                  setSellerCategoryModal({ ...seller, isEdit: true });
                                  setSelectedCategories(seller.allowedCategories || []);
                                }}
                                data-testid={`manage-categories-${seller.id}`}
                              >
                                <Settings className="h-3.5 w-3.5 mr-1" />
                                Manage Categories
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {rejectedSellers.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Rejected Sellers ({rejectedSellers.length})
                      </h3>
                      <div className="space-y-3">
                        {rejectedSellers.map((seller: any) => (
                          <Card key={seller.id} className="p-4 border-red-200 bg-red-50/50">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">{seller.shopName || 'No Shop Name'}</div>
                                <div className="text-sm text-gray-600">{seller.name}</div>
                                <div className="text-xs text-gray-500">{seller.phone || 'No phone'}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 border-green-300"
                                  onClick={async () => {
                                    await fetch(`/api/admin/sellers/${seller.id}/approve`, { method: 'POST' });
                                    queryClient.invalidateQueries({ queryKey: ['/api/sellers'] });
                                  }}
                                  data-testid={`reapprove-seller-${seller.id}`}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this seller?')) {
                                      await fetch(`/api/admin/sellers/${seller.id}`, { method: 'DELETE' });
                                      queryClient.invalidateQueries({ queryKey: ['/api/sellers'] });
                                    }
                                  }}
                                  data-testid={`delete-rejected-seller-${seller.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {pendingSellers.length === 0 && approvedSellers.length === 0 && rejectedSellers.length === 0 && (
                    <Card className="p-8 text-center">
                      <Store className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No sellers registered yet</p>
                    </Card>
                  )}
                </div>
              );
            })()}

            {sellerCategoryModal && (
              <Dialog open={!!sellerCategoryModal} onOpenChange={() => setSellerCategoryModal(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      {sellerCategoryModal.isEdit ? "Manage Categories" : "Approve & Set Categories"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-medium">{sellerCategoryModal.shopName || 'No Shop Name'}</p>
                      <p className="text-sm text-gray-500">{sellerCategoryModal.name} • {sellerCategoryModal.phone}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Allowed Categories</p>
                      <p className="text-xs text-gray-400 mb-3">Select categories where this seller can add products. If none selected, all categories will be allowed.</p>
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {categoriesList.filter((c: any) => c.type === "product").map((cat: any) => {
                          const isSelected = selectedCategories.includes(cat.slug);
                          return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setSelectedCategories(prev =>
                                  isSelected ? prev.filter(s => s !== cat.slug) : [...prev, cat.slug]
                                );
                              }}
                              className={`p-2.5 rounded-xl border-2 text-left transition-all text-xs ${isSelected ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
                              data-testid={`toggle-cat-${cat.slug}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <div className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-blue-500 border-blue-500" : "border-gray-300"}`}>
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                {cat.name}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {selectedCategories.length > 0 && (
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-xs text-blue-600 font-medium">{selectedCategories.length} categories selected</p>
                          <button onClick={() => setSelectedCategories([])} className="text-xs text-red-500 hover:underline">Clear all</button>
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        if (sellerCategoryModal.isEdit) {
                          await fetch(`/api/admin/sellers/${sellerCategoryModal.id}/categories`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ allowedCategories: selectedCategories }),
                          });
                        } else {
                          await fetch(`/api/admin/sellers/${sellerCategoryModal.id}/approve`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ allowedCategories: selectedCategories }),
                          });
                        }
                        queryClient.invalidateQueries({ queryKey: ['/api/sellers'] });
                        setSellerCategoryModal(null);
                        toast({
                          title: sellerCategoryModal.isEdit ? "Categories updated!" : "Seller approved!",
                          description: selectedCategories.length > 0
                            ? `${selectedCategories.length} categories assigned`
                            : "All categories allowed",
                        });
                      }}
                      data-testid="btn-confirm-seller-categories"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {sellerCategoryModal.isEdit ? "Save Categories" : "Approve Seller"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* STAFF MANAGEMENT TAB */}
          <TabsContent value="staff" className="space-y-4">
            <StaffManagementTab />
          </TabsContent>

          {/* SALES ANALYTICS TAB */}
          <TabsContent value="sales" className="space-y-4">
            <SalesAnalyticsTab />
          </TabsContent>

          {/* BANNERS TAB */}
          <TabsContent value="banners" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Home Banners ({bannersList.length})</h2>
              <Button
                size="sm"
                onClick={() => setShowAddBanner(true)}
                className="gap-1"
                data-testid="btn-add-banner"
              >
                <Plus className="h-4 w-4" />
                Add Banner
              </Button>
            </div>

            {bannersLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : bannersList.length === 0 ? (
              <Card className="border">
                <CardContent className="p-6 text-center text-muted-foreground">
                  No banners yet. Add banners to show on home page carousel.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {bannersList.map((banner) => (
                  <Card key={banner.id} className="border shadow-sm overflow-hidden" data-testid={`banner-card-${banner.id}`}>
                    <div className="flex">
                      <div className="w-24 h-20 flex-shrink-0">
                        <img 
                          src={banner.imageUrl} 
                          alt={banner.title || 'Banner'} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="flex-1 p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{banner.title || 'Untitled Banner'}</p>
                            {banner.subtitle && <p className="text-xs text-muted-foreground">{banner.subtitle}</p>}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded ${String(banner.isActive) === "true" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                {String(banner.isActive) === "true" ? "Active" : "Hidden"}
                              </span>
                              <span className="text-xs text-muted-foreground">Order: {banner.sortOrder}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => setEditingBanner(banner)}
                              data-testid={`edit-banner-${banner.id}`}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteBanner(banner.id)}
                              data-testid={`delete-banner-${banner.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Add Banner Modal */}
            {showAddBanner && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Add New Banner</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setShowAddBanner(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Image URL *</label>
                      <Input
                        value={newBanner.imageUrl}
                        onChange={(e) => setNewBanner({ ...newBanner, imageUrl: e.target.value })}
                        placeholder="https://example.com/banner.jpg"
                        data-testid="input-banner-image"
                      />
                      <p className="text-xs text-muted-foreground mt-1">📐 Recommended size: 800x400 pixels (2:1 ratio)</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={newBanner.title}
                        onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                        placeholder="Summer Sale!"
                        data-testid="input-banner-title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Subtitle</label>
                      <Input
                        value={newBanner.subtitle}
                        onChange={(e) => setNewBanner({ ...newBanner, subtitle: e.target.value })}
                        placeholder="Up to 50% off"
                        data-testid="input-banner-subtitle"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={newBanner.description}
                        onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })}
                        placeholder="Fresh vegetables at best prices"
                        data-testid="input-banner-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Button Text</label>
                        <Input
                          value={newBanner.ctaText}
                          onChange={(e) => setNewBanner({ ...newBanner, ctaText: e.target.value })}
                          placeholder="Shop Now"
                          data-testid="input-banner-cta"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Button Link</label>
                        <Input
                          value={newBanner.ctaLink}
                          onChange={(e) => setNewBanner({ ...newBanner, ctaLink: e.target.value })}
                          placeholder="/categories/vegetables"
                          data-testid="input-banner-link"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Sort Order</label>
                        <Input
                          type="number"
                          value={newBanner.sortOrder}
                          onChange={(e) => setNewBanner({ ...newBanner, sortOrder: parseInt(e.target.value) || 0 })}
                          data-testid="input-banner-order"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          checked={newBanner.isActive === "true"}
                          onCheckedChange={(checked) => setNewBanner({ ...newBanner, isActive: checked ? "true" : "false" })}
                          data-testid="switch-banner-active"
                        />
                        <span className="text-sm">Active</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleAddBanner}
                      disabled={!newBanner.imageUrl.trim() || createBannerMutation.isPending}
                      className="w-full"
                      data-testid="btn-save-banner"
                    >
                      {createBannerMutation.isPending ? "Adding..." : "Add Banner"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Edit Banner Modal */}
            {editingBanner && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Edit Banner</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setEditingBanner(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Image URL *</label>
                      <Input
                        value={editingBanner.imageUrl}
                        onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                        placeholder="https://example.com/banner.jpg"
                        data-testid="input-edit-banner-image"
                      />
                      <p className="text-xs text-muted-foreground mt-1">📐 Recommended size: 800x400 pixels (2:1 ratio)</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={editingBanner.title || ""}
                        onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                        placeholder="Summer Sale!"
                        data-testid="input-edit-banner-title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Subtitle</label>
                      <Input
                        value={editingBanner.subtitle || ""}
                        onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                        placeholder="Up to 50% off"
                        data-testid="input-edit-banner-subtitle"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={editingBanner.description || ""}
                        onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                        placeholder="Fresh vegetables at best prices"
                        data-testid="input-edit-banner-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Button Text</label>
                        <Input
                          value={editingBanner.ctaText || ""}
                          onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                          placeholder="Shop Now"
                          data-testid="input-edit-banner-cta"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Button Link</label>
                        <Input
                          value={editingBanner.ctaLink || ""}
                          onChange={(e) => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                          placeholder="/categories/vegetables"
                          data-testid="input-edit-banner-link"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium">Sort Order</label>
                        <Input
                          type="number"
                          value={editingBanner.sortOrder || 0}
                          onChange={(e) => setEditingBanner({ ...editingBanner, sortOrder: parseInt(e.target.value) || 0 })}
                          data-testid="input-edit-banner-order"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                        <Switch
                          checked={String(editingBanner.isActive) === "true"}
                          onCheckedChange={(checked) => setEditingBanner({ ...editingBanner, isActive: checked ? "true" : "false" })}
                          data-testid="switch-edit-banner-active"
                        />
                        <span className="text-sm">Active</span>
                      </div>
                    </div>
                    <Button
                      onClick={handleUpdateBanner}
                      disabled={!editingBanner.imageUrl?.trim() || updateBannerMutation.isPending}
                      className="w-full"
                      data-testid="btn-update-banner"
                    >
                      {updateBannerMutation.isPending ? "Updating..." : "Update Banner"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* PRICE LIST TAB */}
          <TabsContent value="pricelist" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Rate List for WhatsApp</h2>
              <Button
                size="sm"
                onClick={() => {
                  const allProducts = products;
                  const vegetablesProducts = allProducts.filter(p => {
                    const cat = p.category?.toLowerCase() || '';
                    return cat.includes('vegetable') || cat.includes('sabji') || cat.includes('sabzi') || cat === 'fresh vegetables';
                  });
                  const fruitsProducts = allProducts.filter(p => {
                    const cat = p.category?.toLowerCase() || '';
                    return cat.includes('fruit') || cat.includes('phal') || cat === 'seasonal fruits';
                  });
                  const dairyProducts = allProducts.filter(p => {
                    const cat = p.category?.toLowerCase() || '';
                    return cat.includes('dairy') || cat.includes('milk') || cat.includes('doodh');
                  });
                  
                  let priceList = `🛒 *AtoZDukaan - Aaj ki tazi sabzi aur phal*\n`;
                  priceList += `📅 ${new Date().toLocaleDateString('hi-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
                  
                  if (vegetablesProducts.length > 0) {
                    priceList += `🥬 *सब्जियां (Vegetables)*\n`;
                    priceList += `━━━━━━━━━━━━━━━\n`;
                    vegetablesProducts.forEach(p => {
                      priceList += `${p.name} - ₹${p.price}/${p.unit || 'kg'}\n`;
                    });
                    priceList += `\n`;
                  }
                  
                  if (fruitsProducts.length > 0) {
                    priceList += `🍎 *फल (Fruits)*\n`;
                    priceList += `━━━━━━━━━━━━━━━\n`;
                    fruitsProducts.forEach(p => {
                      priceList += `${p.name} - ₹${p.price}/${p.unit || 'kg'}\n`;
                    });
                    priceList += `\n`;
                  }
                  
                  if (dairyProducts.length > 0) {
                    priceList += `🥛 *डेयरी (Dairy)*\n`;
                    priceList += `━━━━━━━━━━━━━━━\n`;
                    dairyProducts.forEach(p => {
                      priceList += `${p.name} - ₹${p.price}/${p.unit || 'pc'}\n`;
                    });
                    priceList += `\n`;
                  }
                  
                  priceList += `📞 Order करने के लिए WhatsApp करें\n`;
                  priceList += `🚚 Free Home Delivery ₹${settings.minOrderForFreeDelivery || '300'}+ Orders\n`;
                  priceList += `\n_AtoZDukaan - Fresh Groceries & Home Services_`;
                  
                  navigator.clipboard.writeText(priceList);
                  toast({
                    title: "Copied!",
                    description: "Rate list copied. Now paste on WhatsApp!",
                  });
                }}
                className="bg-green-600 hover:bg-green-700"
                data-testid="copy-pricelist"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy for WhatsApp
              </Button>
            </div>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2 bg-green-50">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-green-600" />
                  सब्जियां (Vegetables)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {products
                    .filter(p => {
                      const cat = p.category?.toLowerCase() || '';
                      return cat.includes('vegetable') || cat.includes('sabji') || cat.includes('sabzi');
                    })
                    .map(product => (
                      <div key={product.id} className="flex items-center justify-between px-4 py-2">
                        <span className="text-sm">{product.name}</span>
                        <span className="font-semibold text-green-700">₹{product.price}/{product.unit || 'kg'}</span>
                      </div>
                    ))
                  }
                  {products.filter(p => {
                    const cat = p.category?.toLowerCase() || '';
                    return cat.includes('vegetable') || cat.includes('sabji');
                  }).length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">No vegetables added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2 bg-orange-50">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Cherry className="h-4 w-4 text-orange-600" />
                  फल (Fruits)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {products
                    .filter(p => {
                      const cat = p.category?.toLowerCase() || '';
                      return cat.includes('fruit') || cat.includes('phal');
                    })
                    .map(product => (
                      <div key={product.id} className="flex items-center justify-between px-4 py-2">
                        <span className="text-sm">{product.name}</span>
                        <span className="font-semibold text-orange-700">₹{product.price}/{product.unit || 'kg'}</span>
                      </div>
                    ))
                  }
                  {products.filter(p => {
                    const cat = p.category?.toLowerCase() || '';
                    return cat.includes('fruit') || cat.includes('phal');
                  }).length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">No fruits added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2 bg-blue-50">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Milk className="h-4 w-4 text-blue-600" />
                  डेयरी (Dairy)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {products
                    .filter(p => {
                      const cat = p.category?.toLowerCase() || '';
                      return cat.includes('dairy') || cat.includes('milk') || cat.includes('doodh');
                    })
                    .map(product => (
                      <div key={product.id} className="flex items-center justify-between px-4 py-2">
                        <span className="text-sm">{product.name}</span>
                        <span className="font-semibold text-blue-700">₹{product.price}/{product.unit || 'pc'}</span>
                      </div>
                    ))
                  }
                  {products.filter(p => {
                    const cat = p.category?.toLowerCase() || '';
                    return cat.includes('dairy') || cat.includes('milk');
                  }).length === 0 && (
                    <p className="text-center text-muted-foreground py-4 text-sm">No dairy products added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp पर कैसे भेजें?
              </h3>
              <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                <li>"Copy for WhatsApp" बटन दबाएं</li>
                <li>WhatsApp खोलें और Group/Contact select करें</li>
                <li>Message box में long press करके Paste करें</li>
                <li>Send करें!</li>
              </ol>
            </div>
          </TabsContent>

          {/* SERVICE REQUESTS TAB */}
          <TabsContent value="requests" className="space-y-4">
            <ServiceRequestsTab />
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-lg font-bold">App Settings</h2>
            
            {/* Manage Today's Offers */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-lg">🏷️</span>
                    Manage Today's Offers
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingOfferId(null);
                      setOfferForm({ title: "", description: "", image: "", discount: "", isActive: "true", expiryDate: "" });
                      setShowOfferForm(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full h-8 px-3 text-xs"
                    data-testid="btn-add-offer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Offer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Offer Form */}
                {showOfferForm && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-orange-800">{editingOfferId ? "Edit Offer" : "New Offer"}</h4>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Title *</label>
                      <Input
                        value={offerForm.title}
                        onChange={e => setOfferForm({...offerForm, title: e.target.value})}
                        placeholder="जैसे: 20% off on Vegetables"
                        className="mt-1 h-8 text-sm"
                        data-testid="input-offer-title"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Description</label>
                      <Input
                        value={offerForm.description}
                        onChange={e => setOfferForm({...offerForm, description: e.target.value})}
                        placeholder="Offer details..."
                        className="mt-1 h-8 text-sm"
                        data-testid="input-offer-description"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Image URL (optional)</label>
                      <Input
                        value={offerForm.image}
                        onChange={e => setOfferForm({...offerForm, image: e.target.value})}
                        placeholder="https://..."
                        className="mt-1 h-8 text-sm"
                        data-testid="input-offer-image"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Discount Label</label>
                        <Input
                          value={offerForm.discount}
                          onChange={e => setOfferForm({...offerForm, discount: e.target.value})}
                          placeholder="जैसे: 20% OFF"
                          className="mt-1 h-8 text-sm"
                          data-testid="input-offer-discount"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">Expiry Date</label>
                        <Input
                          type="date"
                          value={offerForm.expiryDate}
                          onChange={e => setOfferForm({...offerForm, expiryDate: e.target.value})}
                          className="mt-1 h-8 text-sm"
                          data-testid="input-offer-expiry"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveOffer} className="flex-1 h-8 text-xs bg-orange-500 hover:bg-orange-600" data-testid="btn-save-offer">
                        <Save className="h-3.5 w-3.5 mr-1" />
                        {editingOfferId ? "Update" : "Save"} Offer
                      </Button>
                      <Button variant="outline" onClick={() => setShowOfferForm(false)} className="h-8 text-xs" data-testid="btn-cancel-offer">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Offers List */}
                {allOffersData.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <span className="text-3xl block mb-2">🏷️</span>
                    Koi offer nahi hai. "Add Offer" se shuru karo!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allOffersData.map((offer: any) => (
                      <div key={offer.id} data-testid={`offer-item-${offer.id}`} className="flex items-center gap-3 bg-white border rounded-xl p-3 shadow-sm">
                        {offer.image && (
                          <img src={offer.image} alt={offer.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 truncate">{offer.title}</p>
                            {offer.discount && <Badge className="bg-orange-100 text-orange-700 border-0 text-[10px]">{offer.discount}</Badge>}
                          </div>
                          {offer.description && <p className="text-xs text-muted-foreground truncate">{offer.description}</p>}
                          {offer.expiryDate && <p className="text-[10px] text-orange-600">Expires: {offer.expiryDate}</p>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Switch
                            checked={offer.isActive === "true"}
                            onCheckedChange={() => toggleOfferActive(offer)}
                            data-testid={`toggle-offer-${offer.id}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-500"
                            onClick={() => {
                              setEditingOfferId(offer.id);
                              setOfferForm({
                                title: offer.title || "",
                                description: offer.description || "",
                                image: offer.image || "",
                                discount: offer.discount || "",
                                isActive: offer.isActive || "true",
                                expiryDate: offer.expiryDate || "",
                              });
                              setShowOfferForm(true);
                            }}
                            data-testid={`btn-edit-offer-${offer.id}`}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500"
                            onClick={() => deleteOffer(offer.id)}
                            data-testid={`btn-delete-offer-${offer.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Number Settings */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  Contact Number (Pending Approval Page)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Phone Number</label>
                  <Input 
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="9999878381"
                    className="mt-1"
                    data-testid="input-contact-number"
                  />
                </div>
                <p className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <strong>यह number कहाँ दिखेगा:</strong> जब नए customer का account approval pending होता है, तब उन्हें Call और WhatsApp button दिखता है इस number के साथ। वो तुरंत order के लिए contact कर सकते हैं।
                </p>
                <Button 
                  onClick={saveContactNumber}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  data-testid="save-contact-number"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Contact Number
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Delivery Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Free Delivery Above (₹)</label>
                  <Input 
                    type="number"
                    value={settings.minOrderForFreeDelivery}
                    onChange={(e) => setSettings({...settings, minOrderForFreeDelivery: e.target.value})}
                    className="mt-1"
                    data-testid="input-free-delivery"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Delivery Charge (₹)</label>
                  <Input 
                    type="number"
                    value={settings.deliveryCharge}
                    onChange={(e) => setSettings({...settings, deliveryCharge: e.target.value})}
                    className="mt-1"
                    data-testid="input-delivery-charge"
                  />
                </div>
                <Button 
                  onClick={saveDeliverySettings}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="save-delivery-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Delivery Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Delivery Slots</span>
                  <span className="text-xs text-muted-foreground font-normal">{deliverySlots.length} slots</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                ) : deliverySlots.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No delivery slots configured</p>
                ) : (
                  deliverySlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-2 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{slot.name}</div>
                          <div className="text-xs text-muted-foreground">{slot.startTime} - {slot.endTime}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={slot.isActive === "true"}
                          onCheckedChange={async (checked) => {
                            await fetch(`/api/delivery-slots/${slot.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ isActive: checked ? "true" : "false" }),
                            });
                            refetchSlots();
                          }}
                          data-testid={`switch-slot-${slot.id}`}
                        />
                        <span className={`text-xs px-2 py-0.5 rounded ${slot.isActive === "true" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                          {slot.isActive === "true" ? "Show" : "Hide"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                
              </CardContent>
            </Card>

            {/* Area-wise Delivery Slot Matrix */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Area-wise Delivery Slots
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Control which delivery slots are available in each area. Green = Available, Red = Not Available
                </p>
              </CardHeader>
              <CardContent className="p-0">
                {areasList.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No areas configured yet</p>
                ) : deliverySlots.filter(s => String(s.isActive) === "true").length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No active delivery slots configured</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-2 font-medium sticky left-0 bg-gray-50 min-w-[120px]">Area</th>
                          {deliverySlots.filter(s => String(s.isActive) === "true").map(slot => (
                            <th key={slot.id} className="text-center p-2 font-medium min-w-[80px]">
                              <div>{slot.name}</div>
                              <div className="text-[10px] text-muted-foreground font-normal">{slot.startTime}-{slot.endTime}</div>
                            </th>
                          ))}
                          <th className="text-center p-2 font-medium min-w-[60px]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {areasList.map((area) => {
                          const activeSlots = deliverySlots.filter(s => String(s.isActive) === "true");
                          const enabledCount = activeSlots.filter(slot => isSlotEnabledForArea(area.id, slot.id)).length;
                          const allEnabled = enabledCount === activeSlots.length;
                          const noneEnabled = enabledCount === 0;
                          
                          return (
                            <tr key={area.id} className="hover:bg-gray-50">
                              <td className="p-2 font-medium sticky left-0 bg-white border-r">
                                {area.name}
                              </td>
                              {activeSlots.map(slot => {
                                const isEnabled = isSlotEnabledForArea(area.id, slot.id);
                                return (
                                  <td key={slot.id} className="text-center p-1">
                                    <button
                                      onClick={() => toggleAreaSlot(area.id, slot.id, isEnabled)}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                        isEnabled 
                                          ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                          : "bg-red-100 text-red-600 hover:bg-red-200"
                                      }`}
                                      data-testid={`toggle-area-${area.id}-slot-${slot.id}`}
                                    >
                                      {isEnabled ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                    </button>
                                  </td>
                                );
                              })}
                              <td className="text-center p-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  noneEnabled 
                                    ? "bg-red-100 text-red-700" 
                                    : allEnabled 
                                      ? "bg-green-100 text-green-700" 
                                      : "bg-yellow-100 text-yellow-700"
                                }`}>
                                  {noneEnabled ? "No Delivery" : allEnabled ? "All Slots" : `${enabledCount} Slots`}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="p-3 border-t bg-gray-50">
                  <p className="text-[10px] text-muted-foreground">
                    💡 Tip: Click on the circles to toggle delivery slots for each area. If all slots are off for an area, delivery will not be available there.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Payment QR Code (UPI/Paytm/PhonePe)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Upload your payment QR code. It will be shown to customers during checkout and on invoices.
                </p>
                
                {currentPaymentQr ? (
                  <div className="space-y-3">
                    <div className="flex justify-center p-4 bg-white border rounded-lg">
                      <img 
                        src={currentPaymentQr} 
                        alt="Payment QR Code" 
                        className="max-w-[200px] max-h-[200px] object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrUpload}
                          className="hidden"
                          data-testid="input-change-qr"
                        />
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          disabled={qrUploading}
                          onClick={(e) => {
                            e.preventDefault();
                            (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                          }}
                        >
                          {qrUploading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Edit2 className="h-4 w-4 mr-2" />}
                          Change QR
                        </Button>
                      </label>
                      <Button 
                        variant="destructive" 
                        onClick={handleRemoveQr}
                        data-testid="button-remove-qr"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="hidden"
                      data-testid="input-upload-qr"
                    />
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                      }}
                    >
                      {qrUploading ? (
                        <RefreshCw className="h-8 w-8 mx-auto text-primary animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-8 w-8 mx-auto text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">Click to upload QR code</p>
                          <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">App Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">App Version</span>
                  <span className="font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Products</span>
                  <span className="font-medium">{stats?.totalProducts || products.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Customers</span>
                  <span className="font-medium">{stats?.totalCustomers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Revenue</span>
                  <span className="font-medium text-green-600">₹{stats?.totalRevenue || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Admin Credentials Section */}
            <Card className="border shadow-sm border-red-200 bg-red-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <Lock className="h-4 w-4" />
                  Admin Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Current Password *</label>
                  <div className="relative mt-1">
                    <Input 
                      type={showCurrentPassword ? "text" : "password"}
                      value={adminCredentials.currentPassword}
                      onChange={(e) => setAdminCredentials({...adminCredentials, currentPassword: e.target.value})}
                      placeholder="Enter current password"
                      data-testid="input-current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">New Username (Email)</label>
                  <Input 
                    type="email"
                    value={adminCredentials.newUsername}
                    onChange={(e) => setAdminCredentials({...adminCredentials, newUsername: e.target.value})}
                    placeholder="Leave blank to keep current"
                    className="mt-1"
                    data-testid="input-new-username"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">New Password</label>
                  <div className="relative mt-1">
                    <Input 
                      type={showNewPassword ? "text" : "password"}
                      value={adminCredentials.newPassword}
                      onChange={(e) => setAdminCredentials({...adminCredentials, newPassword: e.target.value})}
                      placeholder="Leave blank to keep current"
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
                  <Input 
                    type="password"
                    value={adminCredentials.confirmPassword}
                    onChange={(e) => setAdminCredentials({...adminCredentials, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    className="mt-1"
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={handleSaveAdminCredentials}
                  disabled={adminCredentialsSaving}
                  data-testid="button-save-credentials"
                >
                  {adminCredentialsSaving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Update Credentials
                </Button>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => alert("Settings saved!")} data-testid="button-save-settings">
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </Button>
          </TabsContent>

          {/* STOCK SUMMARY TAB */}
          <TabsContent value="stock" className="space-y-4">
            {/* Header with title and actions */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Total Purchase Quantity
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => refetchStock()}
                      className="h-8"
                      data-testid="button-refresh-stock"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={exportStockPDF}
                      disabled={stockSummary.length === 0}
                      className="h-8"
                      data-testid="button-export-pdf"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Button 
                    variant={stockFilter === 'purchase' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStockFilter('purchase')}
                    className="h-7 text-xs"
                    data-testid="filter-purchase"
                  >
                    Total Purchase Qty
                  </Button>
                  <Button 
                    variant={stockFilter === 'pending' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStockFilter('pending')}
                    className="h-7 text-xs"
                    data-testid="filter-pending"
                  >
                    Pending Only
                  </Button>
                  <Button 
                    variant={stockFilter === 'today' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStockFilter('today')}
                    className="h-7 text-xs"
                    data-testid="filter-today"
                  >
                    Today
                  </Button>
                  <Button 
                    variant={stockFilter === 'weekly' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStockFilter('weekly')}
                    className="h-7 text-xs"
                    data-testid="filter-weekly"
                  >
                    Last 7 Days
                  </Button>
                  <Button 
                    variant={stockFilter === 'all' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setStockFilter('all')}
                    className="h-7 text-xs"
                    data-testid="filter-all"
                  >
                    All Time
                  </Button>
                </div>

                {/* Filter Description */}
                <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
                  {stockFilter === 'purchase' && "Pending + Processing + Shipped + Out of Delivery orders की total quantity"}
                  {stockFilter === 'pending' && "सिर्फ Pending orders की quantity"}
                  {stockFilter === 'today' && "आज के सभी orders की quantity"}
                  {stockFilter === 'weekly' && "पिछले 7 दिनों के orders की quantity"}
                  {stockFilter === 'all' && "सभी orders की total quantity"}
                </div>

                {/* Summary Stats */}
                {stockSummary.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-600">{stockSummary.length}</div>
                      <div className="text-[10px] text-muted-foreground">Total Items</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-600">₹{stockTotalCost}</div>
                      <div className="text-[10px] text-muted-foreground">Total Purchase Cost</div>
                    </div>
                  </div>
                )}

                {/* Bar Chart */}
                {stockSummary.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Quantity by Product</span>
                    </div>
                    <div className="space-y-2">
                      {stockSummary.slice(0, 10).map((item, idx) => {
                        const maxQty = Math.max(...stockSummary.map(s => s.totalQuantity));
                        const barWidth = (item.totalQuantity / maxQty) * 100;
                        return (
                          <div key={`bar-${item.productName}-${idx}`} className="flex items-center gap-2">
                            <div className="w-20 text-[10px] truncate">{item.productName}</div>
                            <div className="flex-1 bg-slate-200 rounded-full h-4 overflow-hidden">
                              <div 
                                className="bg-primary h-full rounded-full transition-all"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <div className="w-12 text-[10px] text-right font-medium">
                              {item.totalQuantity}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Table */}
                {stockLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : stockSummary.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-8">
                    No orders found for selected filter. Stock summary will appear here once customers place orders.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="stock-table">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left p-2 font-medium text-xs">Product Name</th>
                          <th className="text-right p-2 font-medium text-xs">Total Qty</th>
                          <th className="text-center p-2 font-medium text-xs">Unit</th>
                          <th className="text-right p-2 font-medium text-xs">Estimated (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(stockByCategory).map(([category, items]) => (
                          <>
                            <tr key={`cat-${category}`} className="bg-primary/10">
                              <td colSpan={4} className="p-2 font-semibold text-xs uppercase tracking-wide text-primary">
                                {category}
                              </td>
                            </tr>
                            {items.map((item, idx) => (
                              <tr 
                                key={`${item.productName}-${idx}`} 
                                className="border-b hover:bg-slate-50"
                                data-testid={`stock-row-${item.productName.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                <td className="p-2 font-medium">{item.productName}</td>
                                <td className="p-2 text-right font-bold text-primary">
                                  {item.totalQuantity}
                                </td>
                                <td className="p-2 text-center text-muted-foreground">{item.unit || 'kg'}</td>
                                <td className="p-2 text-right font-medium text-green-600">₹{item.totalCost || 0}</td>
                              </tr>
                            ))}
                          </>
                        ))}
                        <tr className="bg-slate-100 font-bold">
                          <td colSpan={3} className="p-2 text-right">Grand Total Estimated:</td>
                          <td className="p-2 text-right text-green-600">₹{stockTotalCost}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add New Product</h2>
              <button onClick={() => setShowAddProduct(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Product Name</label>
                <Input 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="e.g., Fresh Carrots"
                  className="mt-1"
                  data-testid="input-product-name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Price (₹)</label>
                  <Input 
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    placeholder="45"
                    className="mt-1"
                    data-testid="input-product-price"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Original Price (₹)</label>
                  <Input 
                    type="number"
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({...newProduct, originalPrice: e.target.value})}
                    placeholder="60"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Image Links (Max 3)</label>
                <div className="space-y-2 mt-1">
                  {[0, 1, 2].map((idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-[10px] text-muted-foreground w-5 shrink-0">{idx === 0 ? "Main" : `#${idx + 1}`}</span>
                      <Input
                        placeholder={`Image ${idx + 1} URL paste karein`}
                        value={newProduct.images[idx] || ""}
                        onChange={(e) => {
                          const updated = [...newProduct.images];
                          if (e.target.value) {
                            updated[idx] = e.target.value;
                          } else {
                            updated.splice(idx, 1);
                          }
                          const filtered = updated.filter(Boolean);
                          setNewProduct({ ...newProduct, images: filtered, image: filtered[0] || "" });
                        }}
                        className="flex-1 text-xs"
                        data-testid={`input-product-image-${idx}`}
                      />
                      {newProduct.images[idx] && (
                        <img src={newProduct.images[idx]} alt="" className="w-8 h-8 object-cover rounded border shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Pehli image main hogi. Max 3 links.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value as any})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    data-testid="select-product-category"
                  >
                    <optgroup label="Product Categories">
                      {categoriesList.filter(c => c.type !== "service").map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Service Categories">
                      {categoriesList.filter(c => c.type === "service").map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Unit</label>
                  <Input 
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    placeholder="1 kg"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Stock Quantity</label>
                <Input 
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  placeholder="100"
                  className="mt-1"
                />
              </div>

              {/* Validation message */}
              {(!newProduct.name || !newProduct.price || (newProduct.images.length === 0 && !newProduct.image)) && (
                <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
                  Product Name, Price aur kam se kam 1 Image zaruri hai
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1" 
                  onClick={handleAddProduct} 
                  disabled={!newProduct.name || !newProduct.price || (newProduct.images.length === 0 && !newProduct.image) || createProductMutation.isPending}
                  data-testid="button-add-product"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {createProductMutation.isPending ? "Adding..." : "Add Product"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowAddProduct(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add New Category</h2>
              <button onClick={() => setShowAddCategory(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category Name *</label>
                <Input 
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="e.g., Vegetables"
                  className="mt-1"
                  data-testid="input-category-name"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Slug (URL) - auto-generated from name if empty</label>
                <Input 
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({...newCategory, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')})}
                  placeholder="leave empty to auto-generate"
                  className="mt-1"
                  data-testid="input-category-slug"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Category Type</label>
                <select
                  value={newCategory.type}
                  onChange={(e) => setNewCategory({...newCategory, type: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  data-testid="select-category-type"
                >
                  <option value="product">Product Category</option>
                  <option value="service">Service Category</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Icon (Lucide icon name)</label>
                <select
                  value={newCategory.iconKey}
                  onChange={(e) => setNewCategory({...newCategory, iconKey: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  data-testid="select-category-icon"
                >
                  <option value="">Select Icon...</option>
                  {Object.keys(LUCIDE_ICONS).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Image URL (optional - overrides icon)</label>
                <Input 
                  value={newCategory.imageUrl}
                  onChange={(e) => setNewCategory({...newCategory, imageUrl: e.target.value})}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Gradient Start</label>
                  <select
                    value={newCategory.colorStart}
                    onChange={(e) => setNewCategory({...newCategory, colorStart: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="from-green-100">Green</option>
                    <option value="from-orange-100">Orange</option>
                    <option value="from-blue-100">Blue</option>
                    <option value="from-purple-100">Purple</option>
                    <option value="from-red-100">Red</option>
                    <option value="from-yellow-100">Yellow</option>
                    <option value="from-pink-100">Pink</option>
                    <option value="from-cyan-100">Cyan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Gradient End</label>
                  <select
                    value={newCategory.colorEnd}
                    onChange={(e) => setNewCategory({...newCategory, colorEnd: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="to-green-200">Green</option>
                    <option value="to-orange-200">Orange</option>
                    <option value="to-blue-200">Blue</option>
                    <option value="to-purple-200">Purple</option>
                    <option value="to-red-200">Red</option>
                    <option value="to-yellow-200">Yellow</option>
                    <option value="to-pink-200">Pink</option>
                    <option value="to-cyan-200">Cyan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Border Color</label>
                  <select
                    value={newCategory.borderColor}
                    onChange={(e) => setNewCategory({...newCategory, borderColor: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="border-green-300">Green</option>
                    <option value="border-orange-300">Orange</option>
                    <option value="border-blue-300">Blue</option>
                    <option value="border-purple-300">Purple</option>
                    <option value="border-red-300">Red</option>
                    <option value="border-yellow-300">Yellow</option>
                    <option value="border-pink-300">Pink</option>
                    <option value="border-cyan-300">Cyan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Text Color</label>
                  <select
                    value={newCategory.textColor}
                    onChange={(e) => setNewCategory({...newCategory, textColor: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="text-green-900">Green</option>
                    <option value="text-orange-900">Orange</option>
                    <option value="text-blue-900">Blue</option>
                    <option value="text-purple-900">Purple</option>
                    <option value="text-red-900">Red</option>
                    <option value="text-yellow-900">Yellow</option>
                    <option value="text-pink-900">Pink</option>
                    <option value="text-cyan-900">Cyan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Sort Order</label>
                  <Input 
                    type="number"
                    value={newCategory.sortOrder}
                    onChange={(e) => setNewCategory({...newCategory, sortOrder: e.target.value})}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={newCategory.isActive}
                    onChange={(e) => setNewCategory({...newCategory, isActive: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1" 
                  onClick={handleAddCategory} 
                  disabled={createCategoryMutation.isPending}
                  data-testid="button-submit-category"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {createCategoryMutation.isPending ? "Adding..." : "Add Category"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowAddCategory(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Category</h2>
              <button onClick={() => setEditingCategory(null)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category Name</label>
                  <Input 
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Slug (URL)</label>
                  <Input 
                    value={editingCategory.slug}
                    onChange={(e) => setEditingCategory({...editingCategory, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Icon (Lucide icon name)</label>
                <select
                  value={editingCategory.iconKey || ""}
                  onChange={(e) => setEditingCategory({...editingCategory, iconKey: e.target.value || null})}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Select Icon...</option>
                  {Object.keys(LUCIDE_ICONS).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Image URL (optional)</label>
                <Input 
                  value={editingCategory.imageUrl || ""}
                  onChange={(e) => setEditingCategory({...editingCategory, imageUrl: e.target.value || null})}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Gradient Start</label>
                  <select
                    value={editingCategory.colorStart || "from-green-100"}
                    onChange={(e) => setEditingCategory({...editingCategory, colorStart: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="from-green-100">Green</option>
                    <option value="from-orange-100">Orange</option>
                    <option value="from-blue-100">Blue</option>
                    <option value="from-purple-100">Purple</option>
                    <option value="from-red-100">Red</option>
                    <option value="from-yellow-100">Yellow</option>
                    <option value="from-pink-100">Pink</option>
                    <option value="from-cyan-100">Cyan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Gradient End</label>
                  <select
                    value={editingCategory.colorEnd || "to-green-200"}
                    onChange={(e) => setEditingCategory({...editingCategory, colorEnd: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="to-green-200">Green</option>
                    <option value="to-orange-200">Orange</option>
                    <option value="to-blue-200">Blue</option>
                    <option value="to-purple-200">Purple</option>
                    <option value="to-red-200">Red</option>
                    <option value="to-yellow-200">Yellow</option>
                    <option value="to-pink-200">Pink</option>
                    <option value="to-cyan-200">Cyan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Border Color</label>
                  <select
                    value={editingCategory.borderColor || "border-green-300"}
                    onChange={(e) => setEditingCategory({...editingCategory, borderColor: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="border-green-300">Green</option>
                    <option value="border-orange-300">Orange</option>
                    <option value="border-blue-300">Blue</option>
                    <option value="border-purple-300">Purple</option>
                    <option value="border-red-300">Red</option>
                    <option value="border-yellow-300">Yellow</option>
                    <option value="border-pink-300">Pink</option>
                    <option value="border-cyan-300">Cyan</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Text Color</label>
                  <select
                    value={editingCategory.textColor || "text-green-900"}
                    onChange={(e) => setEditingCategory({...editingCategory, textColor: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="text-green-900">Green</option>
                    <option value="text-orange-900">Orange</option>
                    <option value="text-blue-900">Blue</option>
                    <option value="text-purple-900">Purple</option>
                    <option value="text-red-900">Red</option>
                    <option value="text-yellow-900">Yellow</option>
                    <option value="text-pink-900">Pink</option>
                    <option value="text-cyan-900">Cyan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Sort Order</label>
                  <Input 
                    type="number"
                    value={editingCategory.sortOrder || 0}
                    onChange={(e) => setEditingCategory({...editingCategory, sortOrder: parseInt(e.target.value) || 0})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select
                    value={editingCategory.isActive || "true"}
                    onChange={(e) => setEditingCategory({...editingCategory, isActive: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Show on Home</label>
                  <select
                    value={editingCategory.showOnHome || "true"}
                    onChange={(e) => setEditingCategory({...editingCategory, showOnHome: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    data-testid="select-show-on-home"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1" 
                  onClick={handleUpdateCategory}
                  disabled={updateCategoryMutation.isPending}
                  data-testid="button-save-category"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditingCategory(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Product</h2>
              <button onClick={() => setEditingProduct(null)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Product Name</label>
                <Input 
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Price (₹)</label>
                  <Input 
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Original Price (₹)</label>
                  <Input 
                    type="number"
                    value={editingProduct.originalPrice}
                    onChange={(e) => setEditingProduct({...editingProduct, originalPrice: parseFloat(e.target.value) || 0})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Image Links (Max 3)</label>
                <div className="space-y-2 mt-1">
                  {[0, 1, 2].map((idx) => {
                    const currentImages = editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : editingProduct.image ? [editingProduct.image] : [];
                    return (
                      <div key={idx} className="flex gap-2 items-center">
                        <span className="text-[10px] text-muted-foreground w-5 shrink-0">{idx === 0 ? "Main" : `#${idx + 1}`}</span>
                        <Input
                          placeholder={`Image ${idx + 1} URL paste karein`}
                          value={currentImages[idx] || ""}
                          onChange={(e) => {
                            const updated = [...currentImages];
                            if (e.target.value) {
                              updated[idx] = e.target.value;
                            } else {
                              updated.splice(idx, 1);
                            }
                            const filtered = updated.filter(Boolean);
                            setEditingProduct({ ...editingProduct, images: filtered, image: filtered[0] || "" });
                          }}
                          className="flex-1 text-xs"
                        />
                        {currentImages[idx] && (
                          <img src={currentImages[idx]} alt="" className="w-8 h-8 object-cover rounded border shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Pehli image main hogi. Max 3 links.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select 
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value as any})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <optgroup label="Product Categories">
                      {categoriesList.filter(c => c.type !== "service").map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Service Categories">
                      {categoriesList.filter(c => c.type === "service").map(cat => (
                        <option key={cat.id} value={cat.slug}>{cat.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Unit</label>
                  <Input 
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({...editingProduct, unit: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    const realId = editingProduct.id > 1000 ? editingProduct.id - 1000 : editingProduct.id;
                    updateProductMutation.mutate({ 
                      id: realId, 
                      name: editingProduct.name,
                      price: editingProduct.price,
                      originalPrice: editingProduct.originalPrice,
                      image: editingProduct.image,
                      category: editingProduct.category,
                      unit: editingProduct.unit
                    });
                    setEditingProduct(null);
                  }}
                  data-testid="button-save-product"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Add New Service</h2>
              <button onClick={() => setShowAddService(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Service Name</label>
                <Input 
                  value={newService.name}
                  onChange={(e) => setNewService({...newService, name: e.target.value})}
                  placeholder="e.g., Screen Replacement"
                  className="mt-1"
                  data-testid="input-service-name"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Input 
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                  placeholder="Brief description of the service"
                  className="mt-1"
                  data-testid="input-service-description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Price (₹)</label>
                  <Input 
                    type="number"
                    value={newService.price}
                    onChange={(e) => setNewService({...newService, price: e.target.value})}
                    placeholder="1500"
                    className="mt-1"
                    data-testid="input-service-price"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Original Price (₹)</label>
                  <Input 
                    type="number"
                    value={newService.originalPrice}
                    onChange={(e) => setNewService({...newService, originalPrice: e.target.value})}
                    placeholder="2000"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Image URL</label>
                <Input 
                  value={newService.image}
                  onChange={(e) => setNewService({...newService, image: e.target.value})}
                  placeholder="https://..."
                  className="mt-1"
                  data-testid="input-service-image"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Service Category</label>
                  <select 
                    value={newService.categorySlug}
                    onChange={(e) => setNewService({...newService, categorySlug: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                    data-testid="select-service-category"
                  >
                    <option value="">Select category...</option>
                    {serviceCategories.map(cat => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Unit</label>
                  <Input 
                    value={newService.unit}
                    onChange={(e) => setNewService({...newService, unit: e.target.value})}
                    placeholder="per service"
                    className="mt-1"
                  />
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleAddService}
                disabled={!newService.name || !newService.price || !newService.image || !newService.categorySlug}
                data-testid="button-add-service"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Service</h2>
              <button onClick={() => setEditingService(null)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Service Name</label>
                <Input 
                  value={editingService.name}
                  onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Input 
                  value={editingService.description || ""}
                  onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Price (₹)</label>
                  <Input 
                    type="number"
                    value={editingService.price}
                    onChange={(e) => setEditingService({...editingService, price: parseInt(e.target.value) || 0})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Original Price (₹)</label>
                  <Input 
                    type="number"
                    value={editingService.originalPrice}
                    onChange={(e) => setEditingService({...editingService, originalPrice: parseInt(e.target.value) || 0})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Image URL</label>
                <Input 
                  value={editingService.image}
                  onChange={(e) => setEditingService({...editingService, image: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Service Category</label>
                  <select 
                    value={editingService.categorySlug}
                    onChange={(e) => setEditingService({...editingService, categorySlug: e.target.value})}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    {serviceCategories.map(cat => (
                      <option key={cat.id} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Unit</label>
                  <Input 
                    value={editingService.unit || ""}
                    onChange={(e) => setEditingService({...editingService, unit: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1" 
                  onClick={handleUpdateService}
                  data-testid="button-save-service"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditingService(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Edit Customer</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingCustomer(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <Input 
                  value={editingCustomer.name || ""}
                  onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input 
                  value={editingCustomer.username || ""}
                  onChange={(e) => setEditingCustomer({...editingCustomer, username: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone</label>
                <Input 
                  value={editingCustomer.phone || ""}
                  onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Main Area</label>
                <select
                  value={customerEditAreaId}
                  onChange={(e) => {
                    const areaId = e.target.value;
                    setCustomerEditAreaId(areaId);
                    const selectedArea = areasList.find(a => a.id.toString() === areaId);
                    setEditingCustomer({
                      ...editingCustomer, 
                      mainAreaId: areaId ? parseInt(areaId) : null,
                      mainAreaName: selectedArea?.name || null,
                      subAreaId: null,
                      subAreaName: null,
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">Select Area</option>
                  {areasList.map(area => (
                    <option key={area.id} value={area.id.toString()}>{area.name}</option>
                  ))}
                </select>
              </div>
              {customerEditAreaId && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Sub-Area</label>
                  <select
                    value={editingCustomer.subAreaId?.toString() || ""}
                    onChange={(e) => {
                      const subAreaId = e.target.value;
                      const selectedArea = areasList.find(a => a.id.toString() === customerEditAreaId);
                      const selectedSubArea = selectedArea?.subAreas.find(s => s.id.toString() === subAreaId);
                      setEditingCustomer({
                        ...editingCustomer, 
                        subAreaId: subAreaId ? parseInt(subAreaId) : null,
                        subAreaName: selectedSubArea?.name || null,
                      });
                    }}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">Select Sub-Area</option>
                    {areasList.find(a => a.id.toString() === customerEditAreaId)?.subAreas.map(subArea => (
                      <option key={subArea.id} value={subArea.id.toString()}>{subArea.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Full Address</label>
                <Input 
                  value={editingCustomer.address || ""}
                  onChange={(e) => setEditingCustomer({...editingCustomer, address: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Referral Code</label>
                <Input 
                  value={editingCustomer.referralCode || ""}
                  onChange={(e) => setEditingCustomer({...editingCustomer, referralCode: e.target.value})}
                  className="mt-1"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={editingCustomer.approvalStatus || "pending"}
                  onChange={(e) => setEditingCustomer({...editingCustomer, approvalStatus: e.target.value})}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  className="flex-1" 
                  onClick={handleSaveCustomer}
                  disabled={updateCustomerMutation.isPending}
                  data-testid="button-save-customer"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {updateCustomerMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditingCustomer(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Details Modal */}
      {showSalesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Sales Details</h2>
                <p className="text-green-100 text-xs">Daily & Monthly Revenue Report</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setShowSalesModal(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {dailySalesLoading || monthlySalesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Tabs defaultValue="daily" className="w-full">
                  <TabsList className="w-full grid grid-cols-2 mb-4 gap-2">
                    <TabsTrigger value="daily" className="text-xs sm:text-sm px-2 py-2 flex flex-col sm:flex-row items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>Daily (65 Days)</span>
                    </TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs sm:text-sm px-2 py-2 flex flex-col sm:flex-row items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      <span>Monthly (60 Mo)</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="daily" className="space-y-4">
                    {(() => {
                      const totalRevenue = dailySales.reduce((sum, d) => sum + d.total, 0);
                      const totalOrders = dailySales.reduce((sum, d) => sum + d.orderCount, 0);
                      const daysWithData = dailySales.filter(d => d.orderCount > 0).length;
                      const dailyAvg = daysWithData > 0 ? Math.round(totalRevenue / daysWithData) : 0;
                      
                      return (
                        <>
                          <div className="bg-green-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold text-green-600">
                                  ₹{totalRevenue.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">Total (65 Days)</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-blue-600">
                                  {totalOrders}
                                </div>
                                <div className="text-xs text-muted-foreground">Total Orders</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-purple-600">
                                  ₹{dailyAvg.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">Daily Avg</div>
                              </div>
                            </div>
                          </div>

                          {totalOrders === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No delivered orders in the last 65 days</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="text-left p-2 font-medium">Date</th>
                                    <th className="text-right p-2 font-medium">Orders</th>
                                    <th className="text-right p-2 font-medium">Revenue</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {dailySales.map((day, idx) => (
                                    <tr key={day.date} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                      <td className="p-2">{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                      <td className="p-2 text-right">{day.orderCount}</td>
                                      <td className="p-2 text-right font-medium text-green-600">₹{day.total.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </TabsContent>

                  <TabsContent value="monthly" className="space-y-4">
                    {(() => {
                      const totalRevenue = monthlySales.reduce((sum, m) => sum + m.total, 0);
                      const totalOrders = monthlySales.reduce((sum, m) => sum + m.orderCount, 0);
                      const monthsWithData = monthlySales.filter(m => m.orderCount > 0).length;
                      const monthlyAvg = monthsWithData > 0 ? Math.round(totalRevenue / monthsWithData) : 0;
                      
                      return (
                        <>
                          <div className="bg-blue-50 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                              <div>
                                <div className="text-2xl font-bold text-green-600">
                                  ₹{totalRevenue.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">Total (60 Months)</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-blue-600">
                                  {totalOrders}
                                </div>
                                <div className="text-xs text-muted-foreground">Total Orders</div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-purple-600">
                                  ₹{monthlyAvg.toLocaleString()}
                                </div>
                                <div className="text-xs text-muted-foreground">Monthly Avg</div>
                              </div>
                            </div>
                          </div>

                          {totalOrders === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p>No delivered orders in the last 60 months</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="text-left p-2 font-medium">Month</th>
                                    <th className="text-right p-2 font-medium">Orders</th>
                                    <th className="text-right p-2 font-medium">Revenue</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {monthlySales.map((month, idx) => {
                                    const [year, mon] = month.month.split('-');
                                    const monthName = new Date(parseInt(year), parseInt(mon) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                                    return (
                                      <tr key={month.month} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                        <td className="p-2">{monthName}</td>
                                        <td className="p-2 text-right">{month.orderCount}</td>
                                        <td className="p-2 text-right font-medium text-green-600">₹{month.total.toLocaleString()}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Order #{selectedOrder.id}</h2>
                <p className="text-blue-100 text-xs">{selectedOrder.customerName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => setSelectedOrder(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-150px)]">
              {/* Customer Details */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <h3 className="font-medium text-sm mb-2">Customer Details</h3>
                <div className="text-xs space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {selectedOrder.customerName}</p>
                  {selectedOrder.customerPhone && <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.customerPhone}</p>}
                  {selectedOrder.deliveryAddress && <p><span className="text-muted-foreground">Address:</span> {selectedOrder.deliveryAddress}</p>}
                  {(selectedOrder.mainAreaName || selectedOrder.subAreaName) && (
                    <p><span className="text-muted-foreground">Area:</span> {selectedOrder.mainAreaName}{selectedOrder.subAreaName && ` → ${selectedOrder.subAreaName}`}</p>
                  )}
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Delivery Slot:</span>
                  <span>{selectedOrder.deliverySlot}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full ${getOrderStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.orderNotes && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mb-4 text-xs text-amber-800">
                  <span className="font-medium">📝 Notes:</span> {selectedOrder.orderNotes}
                </div>
              )}

              {/* Order Items */}
              <h3 className="font-medium text-sm mb-2">Order Items</h3>
              {orderItemsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : orderItems.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No items found
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left p-2 font-medium">Item</th>
                        <th className="text-center p-2 font-medium">Qty</th>
                        <th className="text-right p-2 font-medium">Price</th>
                        <th className="text-right p-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="p-2">
                            <div className="font-medium text-xs">{item.productName}</div>
                            <div className="text-xs text-muted-foreground">{item.unit}</div>
                          </td>
                          <td className="p-2 text-center text-xs">{item.quantity}</td>
                          <td className="p-2 text-right text-xs">₹{item.price}</td>
                          <td className="p-2 text-right text-xs font-medium">₹{item.price * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      {selectedOrder.referralDiscount > 0 ? (
                        <>
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="p-2 text-right text-sm text-muted-foreground">Gross Amount:</td>
                            <td className="p-2 text-right text-sm text-muted-foreground">₹{selectedOrder.total + selectedOrder.referralDiscount}</td>
                          </tr>
                          <tr className="bg-green-50">
                            <td colSpan={3} className="p-2 text-right text-sm text-green-600">🎁 Referral Discount:</td>
                            <td className="p-2 text-right text-sm text-green-600 font-medium">-₹{selectedOrder.referralDiscount}</td>
                          </tr>
                          <tr className="bg-green-50 border-t border-green-200">
                            <td colSpan={3} className="p-2 text-right font-bold text-sm">Net Payable:</td>
                            <td className="p-2 text-right font-bold text-green-600 text-sm">₹{selectedOrder.total}</td>
                          </tr>
                        </>
                      ) : (
                        <tr className="bg-green-50">
                          <td colSpan={3} className="p-2 text-right font-bold text-sm">Total:</td>
                          <td className="p-2 text-right font-bold text-green-600 text-sm">₹{selectedOrder.total}</td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t p-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  downloadOrderInvoice(selectedOrder);
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                Bill
              </Button>
              {selectedOrder.customerPhone && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  onClick={() => {
                    let phone = selectedOrder.customerPhone?.replace(/\D/g, '') || '';
                    // Add country code only if not already present (10 digit Indian number)
                    if (phone.length === 10) {
                      phone = '91' + phone;
                    } else if (phone.startsWith('91') && phone.length === 12) {
                      // Already has country code
                    } else if (phone.length > 10 && !phone.startsWith('91')) {
                      // Has some prefix, keep as is
                    }
                    const message = `🛒 *Order #${selectedOrder.id}*\n\nHello ${selectedOrder.customerName},\n\nYour order of ₹${selectedOrder.total} is ${selectedOrder.status?.toLowerCase()}.\n\nDelivery: ${selectedOrder.deliverySlot}\n\nThank you for ordering! 🙏`;
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
                  }}
                  data-testid="whatsapp-share-order"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
              )}
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={() => setSelectedOrder(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contacts Copy Modal */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Copy Contacts</h2>
                <p className="text-purple-100 text-xs">Search and copy customer contacts</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
                onClick={() => {
                  setShowContactsModal(false);
                  setContactsSearch("");
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, phone, area..."
                  value={contactsSearch}
                  onChange={(e) => setContactsSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-md"
                  data-testid="input-contacts-search"
                />
              </div>

              {/* Filtered Contacts List */}
              {(() => {
                const filteredContacts = customers.filter(customer => {
                  if (!contactsSearch.trim()) return true;
                  const search = contactsSearch.toLowerCase();
                  return (
                    (customer.name?.toLowerCase().includes(search)) ||
                    (customer.phone?.toLowerCase().includes(search)) ||
                    (customer.mainAreaName?.toLowerCase().includes(search)) ||
                    (customer.subAreaName?.toLowerCase().includes(search))
                  );
                });

                // CSV format for Google Sheets/Excel: Name, Phone (tab-separated for easy paste)
                const contactsForSheet = "Name\tPhone\n" + filteredContacts
                  .filter(c => c.phone)
                  .map(c => `${c.name || 'Unknown'}\t${c.phone}`)
                  .join('\n');

                const copyContacts = () => {
                  navigator.clipboard.writeText(contactsForSheet);
                  alert(`${filteredContacts.filter(c => c.phone).length} contacts copied! Paste directly in Google Sheets/Excel.`);
                };

                return (
                  <>
                    {/* Copy Button */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">
                        {filteredContacts.filter(c => c.phone).length} contacts with phone
                      </span>
                      <Button
                        size="sm"
                        onClick={copyContacts}
                        disabled={filteredContacts.filter(c => c.phone).length === 0}
                        className="gap-1"
                        data-testid="btn-copy-all-contacts"
                      >
                        <Copy className="h-4 w-4" />
                        Copy All
                      </Button>
                    </div>

                    {/* Contacts List */}
                    <div className="border rounded-lg max-h-[50vh] overflow-y-auto">
                      {filteredContacts.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          No contacts found
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredContacts.map(customer => (
                            <div 
                              key={customer.id} 
                              className="p-3 hover:bg-gray-50 flex items-center justify-between"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{customer.name || customer.username}</p>
                                <p className="text-xs text-blue-600">{customer.phone || 'No phone'}</p>
                                {(customer.mainAreaName || customer.subAreaName) && (
                                  <p className="text-xs text-muted-foreground">
                                    {customer.mainAreaName}{customer.subAreaName && ` → ${customer.subAreaName}`}
                                  </p>
                                )}
                              </div>
                              {customer.phone && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${customer.name || 'Unknown'}\t${customer.phone}`);
                                  }}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
