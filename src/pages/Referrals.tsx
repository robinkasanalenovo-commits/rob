import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Copy, Share2, Gift, Check, ArrowLeft, CheckCircle, Clock, ShoppingCart, RefreshCw, X, MessageCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";

interface ReferralUser {
  id: string;
  name: string;
  phone: string;
  approvalStatus: string;
  isApproved: boolean;
  hasPurchased: boolean;
  firstOrderDate: string | null;
  totalOrders: number;
  registeredAt: string;
}

interface ReferralData {
  referrals: ReferralUser[];
  count: number;
  approvedCount: number;
  purchasedCount: number;
}

export default function Referrals() {
  const [_, setLocation] = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const { toast } = useToast();
  const { user } = useStore();

  const referralCode = user?.referralCode || "NO_CODE";
  const commissionRate = 50;

  // Fetch referral data
  const { data: referralData, isLoading } = useQuery<ReferralData>({
    queryKey: ["/api/referrals/me", referralCode],
    queryFn: async () => {
      if (!referralCode || referralCode === "NO_CODE") {
        return { referrals: [], count: 0, approvedCount: 0, purchasedCount: 0 };
      }
      const res = await fetch(`/api/referrals/me?referralCode=${referralCode}`);
      return res.json();
    },
    enabled: !!referralCode && referralCode !== "NO_CODE",
  });

  const { data: referralBalanceData } = useQuery<{ balance: number }>({
    queryKey: ["/api/user/referral-balance", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/user/${user?.id}/referral-balance`);
      return res.json();
    },
    enabled: !!user?.id,
  });
  const walletBalance = referralBalanceData?.balance || 0;
  const earnings = (referralData?.purchasedCount || 0) * commissionRate;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = `https://atozdukaan.com?ref=${referralCode}`;
  const shareText = `🛒 AtoZDukaan se fresh groceries & services घर पर मंगवाएं!\n\nMera referral code use karo: *${referralCode}*\n👉 ${shareUrl}\n\nपहले order पर ₹50 की छूट! 📞 9999878381`;

  // Back button closes the sheet on Android WebView
  useEffect(() => {
    if (showShareSheet) {
      history.pushState({ shareSheet: true }, "");
      const handlePop = () => setShowShareSheet(false);
      window.addEventListener("popstate", handlePop);
      return () => window.removeEventListener("popstate", handlePop);
    }
  }, [showShareSheet]);

  const closeShareSheet = () => {
    setShowShareSheet(false);
    // If we pushed a state, go back to remove it cleanly
    if (history.state?.shareSheet) {
      history.back();
    }
  };

  const handleShareClick = () => {
    setShowShareSheet(true);
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, "_blank");
    setShowShareSheet(false);
  };

  const handleSMSShare = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`;
    window.location.href = smsUrl;
    setShowShareSheet(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({ title: "Link copy ho gaya! ✅", description: shareUrl });
    }).catch(() => {
      toast({ title: "Copy failed", description: "Manually copy karo: " + shareUrl });
    });
    setShowShareSheet(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-50 pb-24">
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="container mx-auto px-3 py-4 space-y-6">
        
        {/* Back Button */}
        <Button
          onClick={() => setLocation("/profile")}
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Hero Card */}
        <Card className="border-none bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-6 w-6" />
              Earn Money & Share
            </CardTitle>
            <CardDescription className="text-emerald-100">
              Invite friends and earn ₹{commissionRate} for every successful signup
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30 text-center">
                <div className="text-2xl font-bold">{referralData?.count || 0}</div>
                <div className="text-xs text-emerald-100 mt-1">Total Referrals</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30 text-center">
                <div className="text-2xl font-bold">{referralData?.approvedCount || 0}</div>
                <div className="text-xs text-emerald-100 mt-1">Approved</div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30 text-center">
                <div className="text-2xl font-bold">₹{earnings}</div>
                <div className="text-xs text-emerald-100 mt-1">Earnings</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {walletBalance > 0 && (
          <Card className="border-none bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg" data-testid="referral-wallet-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2.5">
                  <Gift className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-amber-100">Referral Wallet Balance</p>
                  <p className="text-2xl font-bold">₹{walletBalance}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-amber-100">Use at checkout</p>
                <p className="text-xs text-amber-100">Auto-applied on order</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral Code Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Your Referral Code</h2>
          
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <div className="bg-primary/5 rounded-lg p-4 border-2 border-dashed border-primary/30 flex items-center justify-between mb-4">
                <div className="font-mono text-lg font-bold text-primary">{referralCode}</div>
                <Button
                  onClick={handleCopyCode}
                  size="sm"
                  variant="ghost"
                  className={`transition-all ${copied ? "text-green-600" : "text-muted-foreground"}`}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <Button 
                onClick={handleShareClick}
                className="w-full bg-primary text-primary-foreground h-10 font-medium flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Referral Link
              </Button>
              
              <p className="text-xs text-muted-foreground text-center mt-3">
                ₹{commissionRate} earning when friend orders ₹279+
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">How It Works</h2>
          
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <div className="space-y-4 p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Share Your Code</p>
                    <p className="text-xs text-muted-foreground">Send your referral code to friends via WhatsApp, SMS, or email</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Friend Signs Up</p>
                    <p className="text-xs text-muted-foreground">They use your code to create their AtoZDukaan account</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Minimum Purchase of ₹279</p>
                    <p className="text-xs text-muted-foreground">Friend must place an order with minimum amount of ₹279</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-sm">Get Rewarded</p>
                    <p className="text-xs text-muted-foreground">Earn ₹{commissionRate} when their order is completed</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    5
                  </div>
                  <div>
                    <p className="font-medium text-sm">Withdraw Earnings</p>
                    <p className="text-xs text-muted-foreground">Use your earnings as credit for future orders or withdraw to bank</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Referrals List */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold">My Referrals</h2>
          
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : referralData && referralData.referrals.length > 0 ? (
                referralData.referrals.map((referral, idx) => (
                  <div 
                    key={referral.id}
                    className={`p-4 ${idx !== referralData.referrals.length - 1 ? "border-b" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {referral.name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{referral.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{referral.phone || "No phone"}</p>
                          {referral.registeredAt && (
                            <p className="text-[10px] text-muted-foreground">Joined: {formatDate(referral.registeredAt)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {referral.isApproved ? (
                          <span className="flex items-center gap-1 bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">
                            <CheckCircle className="h-3 w-3" /> Approved
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[10px] px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                        {referral.hasPurchased ? (
                          <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">
                            <ShoppingCart className="h-3 w-3" /> {referral.totalOrders} order{referral.totalOrders > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No orders yet</span>
                        )}
                        {referral.hasPurchased && (
                          <span className="text-xs font-bold text-green-600">+₹{commissionRate}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <Gift className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No referrals yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Share your code to start earning!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </main>

      <BottomNav onCartClick={() => setIsCartOpen(true)} />

      {/* Share Bottom Sheet */}
      {showShareSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" data-testid="share-sheet-overlay">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeShareSheet}
          />
          {/* Sheet — select-none prevents Android from detecting text as shareable URL */}
          <div className="relative bg-white rounded-t-2xl p-5 space-y-4 shadow-2xl select-none">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Share Referral Link</h3>
              <button
                onClick={closeShareSheet}
                className="p-1.5 rounded-full bg-gray-100 text-gray-500"
                data-testid="close-share-sheet"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Referral code (no URL displayed — prevents Android link-detect popup) */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Aapka referral code</p>
                <p className="text-lg font-bold text-primary tracking-wider">{referralCode}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralCode);
                  toast({ title: "Code copy ho gaya! ✅" });
                }}
                className="p-2 rounded-lg bg-primary/10 text-primary"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>

            {/* Share Options */}
            <div className="grid grid-cols-3 gap-3">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsAppShare}
                data-testid="share-whatsapp"
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-green-50 border border-green-200 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-700">WhatsApp</span>
              </button>

              {/* SMS */}
              <button
                onClick={handleSMSShare}
                data-testid="share-sms"
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 border border-blue-200 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-700">SMS</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                data-testid="share-copy-link"
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-purple-50 border border-purple-200 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                  <Copy className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-purple-700">Copy Link</span>
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 pb-2">
              Dosto ko share karo aur ₹50 kamao! 🎉
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
