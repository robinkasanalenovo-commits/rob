import { useState } from "react";
import { useLocation, Link } from "wouter";
import { LogOut, MapPin, Phone, Mail, Package, Edit2, ChevronRight, Gift, X, Bell, HelpCircle, Users, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  customerName: string;
  total: number;
  itemsCount: number;
  status: string;
  deliverySlot: string;
  createdAt: string;
}

export default function Profile() {
  const [_, setLocation] = useLocation();
  const { user, logout, cart, login } = useStore();
  const { toast } = useToast();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewAllOrders, setViewAllOrders] = useState(false);
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    address: user?.address || "",
  });

  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          username: profileData.email,
          address: profileData.address,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      // Update local store so address shows immediately everywhere
      login({ ...user, name: profileData.name, email: profileData.email, address: profileData.address });
      toast({ title: "Profile save ho gaya! ✅" });
      setSelectedModal(null);
    } catch {
      toast({ title: "Error", description: "Save nahi hua, dobara try karo", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Fetch user's orders from API
  const { data: ordersData, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/my", user?.name],
    queryFn: async () => {
      if (!user?.name) return [];
      const res = await fetch(`/api/orders/my?customerName=${encodeURIComponent(user.name)}`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!user?.name,
  });

  const orders = Array.isArray(ordersData) ? ordersData : [];
  const displayedOrders = viewAllOrders ? orders : orders.slice(0, 3);
  const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "delivered": return "bg-green-100 text-green-700";
      case "processing": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      case "cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-50 pb-24">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="container mx-auto px-3 py-4 space-y-6">
        
        {/* Profile Header Card */}
        <Card className="border-none bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{user?.name}</CardTitle>
                <CardDescription className="text-emerald-100">{user?.email}</CardDescription>
              </div>
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold backdrop-blur-sm border border-white/30">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-50 flex items-center gap-2 mb-3">
              <span className="inline-block h-2 w-2 rounded-full bg-green-300"></span>
              Account Active & Approved
            </p>
          </CardContent>
        </Card>

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{cart.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Items in Cart</div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{orders.length}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Orders</div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">₹{totalSpent}</div>
              <div className="text-xs text-muted-foreground mt-1">Total Spent</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Card */}
        <Link href="/referrals">
          <Card className="border-none bg-gradient-to-br from-emerald-50 to-teal-50 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Gift className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900">Earn ₹50 per referral</p>
                    <p className="text-xs text-emerald-700">Invite friends & earn</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </Link>


        {/* Account Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Account Information</h2>
          
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <button 
                onClick={() => { setProfileData({ name: user?.name || "", email: user?.email || "", address: user?.address || "" }); setSelectedModal("edit"); }}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Delivery Address</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                      {user?.address ? user.address : "Add your address"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              
              <button 
                onClick={() => { setProfileData({ name: user?.name || "", email: user?.email || "", address: user?.address || "" }); setSelectedModal("edit"); }}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Phone Number</p>
                    <p className="text-xs text-muted-foreground">{user?.phone || "Not added"}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              
              <button 
                onClick={() => setSelectedModal("edit")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Orders Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Order History</h2>
            {!viewAllOrders && orders.length > 3 && (
              <button 
                onClick={() => setViewAllOrders(true)}
                className="text-primary text-sm font-medium hover:underline"
              >
                View all
              </button>
            )}
          </div>
          
          {ordersLoading ? (
            <Card className="border shadow-sm">
              <CardContent className="p-6 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card className="border shadow-sm">
              <CardContent className="p-6 text-center text-muted-foreground">
                No orders yet. Start shopping!
              </CardContent>
            </Card>
          ) : (
            <Card className="border shadow-sm">
              <CardContent className="p-0">
                {displayedOrders.map((order, idx) => (
                  <div 
                    key={order.id}
                    className={`w-full flex items-center justify-between p-4 ${
                      idx !== displayedOrders.length - 1 ? "border-b" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium">Order #{order.id}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)} • {order.itemsCount} items</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{order.total}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {viewAllOrders && orders.length > 3 && (
            <Button
              onClick={() => setViewAllOrders(false)}
              variant="outline"
              className="w-full"
            >
              Show Less
            </Button>
          )}
        </div>

        {/* Preferences Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Preferences</h2>
          
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <button 
                onClick={() => { setProfileData({ name: user?.name || "", email: user?.email || "", address: user?.address || "" }); setSelectedModal("edit"); }}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0">
                <span className="text-sm font-medium">Edit Profile</span>
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </button>
              
              <button 
                onClick={() => setSelectedModal("help")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium">Help & Support</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Logout Button */}
        <Button 
          onClick={handleLogout}
          variant="outline" 
          className="w-full border-destructive text-destructive hover:bg-destructive/5 h-12 font-medium flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </main>

      <BottomNav onCartClick={() => setIsCartOpen(true)} />

      {/* Edit Profile Modal */}
      {selectedModal === "edit" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end animate-in fade-in">
          <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button 
                onClick={() => setSelectedModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <input 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  type="text"
                  className="w-full mt-2 px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <input 
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  type="email"
                  className="w-full mt-2 px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Delivery Address</label>
                <textarea 
                  value={profileData.address}
                  onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  className="w-full mt-2 px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                  ) : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedModal(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help & Support Modal */}
      {selectedModal === "help" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end animate-in fade-in">
          <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Help & Support</h2>
              <button 
                onClick={() => setSelectedModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 border border-border rounded-lg">
                <p className="font-medium mb-1">How to place an order?</p>
                <p className="text-sm text-muted-foreground">Browse products, add to cart, and checkout. Choose your preferred delivery slot: Morning (7 AM - 12 PM) or Evening (4 PM - 9 PM).</p>
              </div>

              <div className="p-3 border border-border rounded-lg">
                <p className="font-medium mb-1">What is the delivery charge?</p>
                <p className="text-sm text-muted-foreground">Free delivery on orders above ₹149. For orders below ₹149, delivery charge is ₹20.</p>
              </div>

              <div className="p-3 border border-border rounded-lg">
                <p className="font-medium mb-1">Can I cancel my order?</p>
                <p className="text-sm text-muted-foreground">Yes, you can cancel orders within 2 minutes of placing. After that, refunds take 5-7 business days.</p>
              </div>

              <div className="p-3 border border-border rounded-lg">
                <p className="font-medium mb-1">What payment methods are accepted?</p>
                <p className="text-sm text-muted-foreground">We accept Credit/Debit cards, UPI, Net Banking, and Wallets like Paytm, PhonePe, and Google Pay.</p>
              </div>

              <div className="p-3 border border-border rounded-lg">
                <p className="font-medium mb-1">How do I report a damaged item?</p>
                <p className="text-sm text-muted-foreground">Report within 1 hour of delivery through the app. We'll provide a replacement or refund immediately.</p>
              </div>

              <Button className="w-full bg-blue-600 hover:bg-blue-700 mt-4">Contact Support</Button>
              
              <Button 
                variant="outline"
                className="w-full mt-2"
                onClick={() => setSelectedModal(null)}
              >
                Back
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
