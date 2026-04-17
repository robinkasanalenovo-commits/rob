import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/store";
import { Minus, Plus, Trash2, Clock, Truck, ShoppingCart, MessageSquare, RefreshCw, CheckCircle, Download, ZoomIn, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface DeliverySlot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  isActive: string;
  sortOrder: number;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
const cart: any[] = [];
const updateQuantity = () => {};
const removeFromCart = () => {};
const clearCart = () => {};
const user = null;
const isAuthenticated = false;
  const [, setLocation] = useLocation();
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState("");
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState(0);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
  const [showPaymentQR, setShowPaymentQR] = useState(false);
  const { toast } = useToast();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const savings = cart.reduce((acc, item) => acc + (item.originalPrice - item.price) * item.quantity, 0);

  const referralBalance = 0;
const referralDiscount = 0;
const total = subtotal;

  // Fetch payment QR code
  const { data: paymentQrData } = useQuery<{ qrCode: string | null }>({
    queryKey: ["/api/settings/payment-qr"],
    queryFn: async () => {
      const res = await fetch("/api/settings/payment-qr");
      return res.json();
    },
  });
  const paymentQrCode = paymentQrData?.qrCode;

  // Fetch visible delivery slots for user's area
  const userAreaId = user?.mainAreaId;
  const { data: slotsData, isLoading: slotsLoading } = useQuery<DeliverySlot[]>({
    queryKey: ["/api/delivery-slots/area", userAreaId],
    queryFn: async () => {
      if (userAreaId) {
        const res = await fetch(`/api/delivery-slots/area/${userAreaId}`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } else {
        // Fallback: get all active slots if no area selected
        const res = await fetch("/api/delivery-slots");
        const data = await res.json();
        return Array.isArray(data) ? data.filter((s: DeliverySlot) => String(s.isActive) === "true") : [];
      }
    },
    enabled: open,
  });
  const deliverySlots = Array.isArray(slotsData) ? slotsData : [];

  // Auto-select first slot if none selected
  useEffect(() => {
    if (deliverySlots.length > 0 && !selectedSlotId) {
      setSelectedSlotId(deliverySlots[0].id.toString());
    }
  }, [deliverySlots, selectedSlotId]);

  // Place order directly
  const handlePlaceOrder = async () => {
    // Check if user is logged in
    const { isAuthenticated, user } = useStore.getState();
    
    if (!isAuthenticated || !user) {
      toast({
        title: "Login Required",
        description: "कृपया order करने के लिए पहले login करें",
      });
      onClose();
      setLocation("/auth");
      return;
    }

    // Check if user is approved

    if (!selectedSlotId || deliverySlots.length === 0) {
      toast({
        title: "Select Delivery Slot",
        description: "Please select a delivery slot before proceeding.",
        variant: "destructive",
      });
      return;
    }
    
    // Get selected slot info
    const selectedSlot = deliverySlots.find(s => s.id.toString() === selectedSlotId);
    const slotDisplay = selectedSlot 
      ? `${selectedSlot.name} (${selectedSlot.startTime} - ${selectedSlot.endTime})`
      : "No slot selected";
    
    try {
      // Prepare order items for stock tracking
      const orderItems = cart.map(item => ({
        productId: item.id,
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        productName: item.variantName ? `${item.name} (${item.variantName})` : item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price * item.quantity,
      }));
      
      const orderData = {
        userId: user?.id || null,
        customerName: user?.name || "Guest",
        customerPhone: user?.phone || "",
        mainAreaName: user?.mainAreaName || "",
        subAreaName: user?.subAreaName || "",
        total: subtotal,
        itemsCount: cart.length,
        deliverySlot: slotDisplay,
        deliveryAddress: user?.address || "",
        orderNotes: orderNotes.trim() || null,
        items: orderItems,
        applyReferralCredit: referralDiscount > 0,
      };
      
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      
      if (!res.ok) {
        throw new Error("Failed to place order");
      }
      
      const orderResult = await res.json();
      
      // Google Ads conversion tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': 'AW-17772211319/rfulCPmvu-4bEPfYuZpC',
          'transaction_id': orderResult.id?.toString() || '',
        });
      }
      
      // Show order confirmation with payment options
      setConfirmedOrderId(orderResult.id);
      setConfirmedOrderTotal(orderResult.total ?? total);
      setShowOrderConfirmation(true);
      clearCart();
      
      toast({
        title: "Order Placed Successfully!",
        description: `Your order will be delivered: ${slotDisplay}.`,
      });
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle Cash on Delivery selection
  const handleCashOnDelivery = async () => {
    if (confirmedOrderId) {
      try {
        await fetch(`/api/orders/${confirmedOrderId}/payment-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: "cod" }),
        });
      } catch (error) {
        console.error("Failed to update payment status:", error);
      }
    }
    handleCloseConfirmation();
  };

  // Show QR code for payment (don't update status yet - wait for confirmation)
  const handleMakePayment = () => {
    setShowPaymentQR(true);
  };

  // Confirm online payment done
  const handleConfirmOnlinePayment = async () => {
    if (confirmedOrderId) {
      try {
        await fetch(`/api/orders/${confirmedOrderId}/payment-status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: "online_paid" }),
        });
      } catch (error) {
        console.error("Failed to update payment status:", error);
      }
    }
    handleCloseConfirmation();
  };

  // Go back from QR to options
  const handleBackFromQR = () => {
    setShowPaymentQR(false);
  };

  const handleCloseConfirmation = () => {
    setShowOrderConfirmation(false);
    setConfirmedOrderTotal(0);
    setConfirmedOrderId(null);
    setShowPaymentQR(false);
    onClose();
  };

  // Reset states when drawer closes
  const handleDrawerClose = () => {
    setShowPaymentQR(false);
    onClose();
  };

  // Handle sheet open/close - prevent closing during payment options screen
  const handleSheetOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // If showing payment options, don't close on external events (like toast dismiss)
      if (showOrderConfirmation) {
        return; // Ignore close request - user must click a payment button
      }
      handleDrawerClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        {showOrderConfirmation && showPaymentQR ? (
          // Payment QR Screen - after clicking Make Payment
          <>
            <SheetHeader className="pb-2">
              <SheetTitle className="flex items-center gap-2 text-primary text-lg">
                <Truck className="h-5 w-5" />
                Pay ₹{confirmedOrderTotal}
              </SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 flex flex-col items-center py-2 space-y-3 overflow-y-auto">
              {paymentQrCode && (
                <div className="w-full space-y-3">
                  <div className="text-center">
                    <p className="font-bold text-base text-green-700">UPI / Paytm / PhonePe / Google Pay</p>
                    <p className="text-sm text-muted-foreground">QR code scan karein ya screenshot lein</p>
                  </div>
                  
                  <div className="flex justify-center p-3 bg-white border-2 border-green-200 rounded-xl shadow-lg">
                    <img 
                      src={paymentQrCode} 
                      alt="Payment QR Code" 
                      className="w-full max-w-[320px] h-auto object-contain"
                      data-testid="payment-qr-code"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 text-sm border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = paymentQrCode;
                        link.download = `payment-qr-${confirmedOrderId}.png`;
                        link.click();
                        toast({ title: "QR Downloaded!", description: "Gallery mein check karein" });
                      }}
                      data-testid="button-download-qr"
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Download QR
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-12 text-sm border-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                      onClick={() => {
                        if (navigator.share && paymentQrCode) {
                          fetch(paymentQrCode)
                            .then(res => res.blob())
                            .then(blob => {
                              const file = new File([blob], 'payment-qr.png', { type: 'image/png' });
                              navigator.share({
                                title: `Pay ₹${confirmedOrderTotal}`,
                                text: `AtoZDukaan - Order #${confirmedOrderId} - Amount: ₹${confirmedOrderTotal}`,
                                files: [file]
                              }).catch(() => {});
                            });
                        } else {
                          toast({ title: "Screenshot लें", description: "QR का screenshot लेकर share करें" });
                        }
                      }}
                      data-testid="button-share-qr"
                    >
                      <ZoomIn className="mr-2 h-5 w-5" />
                      Share QR
                    </Button>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-amber-800 font-medium">💡 Payment ke baad "Payment Done" button dabayein</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2 pt-2">
              <Button className="w-full h-14 text-base bg-green-600 hover:bg-green-700" onClick={handleConfirmOnlinePayment} data-testid="button-confirm-payment">
                <CheckCircle className="mr-2 h-5 w-5" />
                ✅ Payment Done - Confirm
              </Button>
              <Button variant="outline" className="w-full h-10" onClick={handleBackFromQR} data-testid="button-back-options">
                ← Back
              </Button>
            </div>
          </>
        ) : showOrderConfirmation ? (
          // Order Success - Show payment options (COD or Make Payment)
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                Order Placed!
              </SheetTitle>
            </SheetHeader>
            
            <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-6">
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-green-600">Thank you for your order!</p>
                <p className="text-3xl font-bold">₹{confirmedOrderTotal}</p>
                <p className="text-sm text-muted-foreground">Aap payment kaise karna chahenge?</p>
              </div>
              
              <Separator className="w-full" />
              
              <div className="w-full space-y-3">
                <Button 
                  className="w-full h-14 text-base" 
                  variant="outline"
                  onClick={handleCashOnDelivery}
                  data-testid="button-cod"
                >
                  <Truck className="mr-2 h-5 w-5" />
                  Cash on Delivery
                </Button>
                
                <Button 
                  className="w-full h-14 text-base bg-green-600 hover:bg-green-700" 
                  onClick={handleMakePayment}
                  disabled={!paymentQrCode}
                  data-testid="button-make-payment"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Make Payment (Online)
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Normal Cart View
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                My Cart ({cart.length})
              </SheetTitle>
            </SheetHeader>

            {cart.length > 0 ? (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6 py-4">
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.variantId || 'default'}`} className="flex gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-secondary/50">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-sm font-medium leading-none">{item.name}</h4>
                          {item.variantName && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded mt-0.5 inline-block">{item.variantName}</span>
                          )}
                        </div>
                        <p className="text-sm font-bold">₹{item.price * item.quantity}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.unit}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex h-7 items-center rounded-md border bg-background shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.id, -1, item.variantId)}
                            className="flex h-full w-7 items-center justify-center hover:bg-muted"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="min-w-[1.5rem] text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1, item.variantId)}
                            className="flex h-full w-7 items-center justify-center hover:bg-muted"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeFromCart(item.id, item.variantId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Select Delivery Slot
                </h4>
                {slotsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading slots...</span>
                  </div>
                ) : deliverySlots.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No delivery slots available for your area
                  </div>
                ) : (
                  <RadioGroup value={selectedSlotId} onValueChange={setSelectedSlotId} className="grid grid-cols-1 gap-3">
                    {deliverySlots.map((slot) => (
                      <div 
                        key={slot.id}
                        className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:border-primary/50 transition-colors [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
                      >
                        <RadioGroupItem value={slot.id.toString()} id={`slot-${slot.id}`} />
                        <Label htmlFor={`slot-${slot.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium">{slot.name} Slot</div>
                          <div className="text-xs text-muted-foreground">{slot.startTime} - {slot.endTime}</div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Order Notes (Optional)
                </h4>
                <Textarea
                  placeholder="कोई special request लिखें जैसे - Tempered glass के लिए model name, या अन्य details..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="input-order-notes"
                />
              </div>
            </ScrollArea>

            <div className="space-y-4 pt-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Item Total</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Total Savings</span>
                  <span>-₹{savings}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span>FREE</span>
                </div>

                {referralDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium" data-testid="referral-credit-section">
                    <span className="flex items-center gap-1.5">
                      <Gift className="h-3.5 w-3.5" />
                      Referral Bonus Applied
                    </span>
                    <span>-₹{referralDiscount}</span>
                  </div>
                )}

                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>Grand Total</span>
                  <span>₹{total}</span>
                </div>
                {referralDiscount > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 rounded px-2 py-1.5 mt-1" data-testid="referral-bonus-badge">
                    <Gift className="h-3 w-3" />
                    <span>₹{referralDiscount} referral credit auto-applied from your wallet (Balance: ₹{referralBalance})</span>
                  </div>
                )}
              </div>
              <SheetFooter>
                <Button className="w-full h-12 text-base" onClick={handlePlaceOrder} data-testid="button-place-order">
                  <Truck className="mr-2 h-4 w-4" />
                  Place Order
                </Button>
              </SheetFooter>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">
                Add fresh vegetables and fruits to your cart to get started.
              </p>
            </div>
            <Button onClick={onClose} variant="outline">
              Start Shopping
            </Button>
          </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
