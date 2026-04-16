import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Calendar, Clock, MapPin, CheckCircle, Star, X, PhoneCall, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product, useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

interface ServiceCardProps {
  product: Product;
}

export function ServiceCard({ product }: ServiceCardProps) {
  const { user, isAuthenticated } = useStore();
  const { toast } = useToast();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<"booking" | "call">("booking");
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [callFormData, setCallFormData] = useState({
    customerName: "",
    customerPhone: "",
    reason: "",
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleBookNow = () => {
    setFormData({
      customerName: user?.name || "",
      customerPhone: user?.phone || "",
      customerAddress: user?.address || "",
      preferredDate: "",
      preferredTime: "",
      notes: "",
    });
    setShowBookingForm(true);
  };

  const handleCallRequest = () => {
    setCallFormData({
      customerName: user?.name || "",
      customerPhone: user?.phone || "",
      reason: "",
    });
    setShowCallForm(true);
  };

  const handleSubmitCallRequest = async () => {
    if (!callFormData.customerName.trim() || !callFormData.customerPhone.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter your name and phone number",
        variant: "destructive",
      });
      return;
    }
    if (callFormData.customerPhone.replace(/\D/g, "").length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }
    if (!callFormData.reason.trim()) {
      toast({
        title: "Please tell us why",
        description: "Please write the reason you want a call",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: product.name,
          serviceId: product.id > 10000 ? product.id - 10000 : product.id,
          servicePrice: product.price,
          customerName: callFormData.customerName.trim(),
          customerPhone: callFormData.customerPhone.trim(),
          notes: callFormData.reason.trim(),
          requestType: "call",
        }),
      });
      if (!res.ok) throw new Error("Failed");
      setShowCallForm(false);
      setSuccessType("call");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch {
      toast({
        title: "Error",
        description: "Could not submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      toast({
        title: "Required Fields",
        description: "Please enter your name and phone number",
        variant: "destructive",
      });
      return;
    }

    if (formData.customerPhone.replace(/\D/g, "").length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName: product.name,
          serviceId: product.id > 10000 ? product.id - 10000 : product.id,
          servicePrice: product.price,
          customerName: formData.customerName.trim(),
          customerPhone: formData.customerPhone.trim(),
          customerAddress: formData.customerAddress.trim() || null,
          preferredDate: formData.preferredDate || null,
          preferredTime: formData.preferredTime || null,
          notes: formData.notes.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      setShowBookingForm(false);
      setSuccessType("booking");
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="group relative flex flex-col rounded-xl border border-gray-200/50 bg-white shadow-sm transition-all hover:shadow-lg hover:border-primary/20 h-full"
        data-testid={`service-card-${product.id}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-gray-50 to-white p-2 rounded-t-xl">
          {(() => {
            const allImages = product.images && product.images.length > 0 ? product.images : [product.image];
            return (
              <>
                <img
                  src={allImages[currentImageIndex % allImages.length]}
                  alt={product.name}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
                {allImages.length > 1 && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex % allImages.length ? "w-3 bg-blue-600" : "w-1.5 bg-gray-300"}`}
                      />
                    ))}
                  </div>
                )}
              </>
            );
          })()}
          {discount > 0 && (
            <div className="absolute top-2 left-2 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
              {discount}% OFF
            </div>
          )}
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            SERVICE
          </div>
        </div>

        <div className="flex flex-1 flex-col p-3">
          <h3 className="font-medium text-foreground text-sm line-clamp-2 leading-tight mb-1">
            {product.name}
          </h3>
          <p className="text-[10px] text-muted-foreground mb-2">{product.unit || "per service"}</p>

          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`h-3 w-3 ${i <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
            ))}
            <span className="text-[10px] text-gray-500 ml-1">4.0</span>
          </div>

          <div className="mt-auto flex items-end justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground line-through opacity-70">₹{product.originalPrice}</span>
              <span className="text-base font-bold text-foreground">₹{product.price}</span>
            </div>

            <div className="flex flex-col gap-1">
              <Button
                size="sm"
                className="h-7 px-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-[10px] shadow-md hover:shadow-lg transition-all active:scale-95"
                onClick={handleBookNow}
                data-testid={`book-service-${product.id}`}
              >
                <Phone className="h-3 w-3 mr-1" />
                Book Now
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 border-green-300 bg-green-50 text-green-700 font-bold text-[10px] hover:bg-green-100 transition-all active:scale-95"
                onClick={handleCallRequest}
                data-testid={`call-request-${product.id}`}
              >
                <PhoneCall className="h-3 w-3 mr-1" />
                Call Request
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {showBookingForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowBookingForm(false)}>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Book Service</h3>
                <button onClick={() => setShowBookingForm(false)} className="p-1 hover:bg-white/20 rounded-full" data-testid="close-booking-form">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                <img src={product.image} alt={product.name} className="h-12 w-12 object-contain rounded-lg bg-white/20" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-blue-100 text-xs">{product.unit || "per service"}</p>
                </div>
                <p className="font-bold text-lg">₹{product.price}</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Your Name *</label>
                <Input
                  placeholder="Enter your name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="h-10"
                  data-testid="input-booking-name"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Phone Number *</label>
                <Input
                  placeholder="Enter 10-digit phone number"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="h-10"
                  type="tel"
                  maxLength={10}
                  data-testid="input-booking-phone"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Address
                </label>
                <Input
                  placeholder="Enter your address"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  className="h-10"
                  data-testid="input-booking-address"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Preferred Date
                  </label>
                  <Input
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="h-10"
                    min={new Date().toISOString().split("T")[0]}
                    data-testid="input-booking-date"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Preferred Time
                  </label>
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="h-10 w-full border rounded-md px-3 text-sm"
                    data-testid="select-booking-time"
                  >
                    <option value="">Select time</option>
                    <option value="Morning (8AM-12PM)">Morning (8AM-12PM)</option>
                    <option value="Afternoon (12PM-4PM)">Afternoon (12PM-4PM)</option>
                    <option value="Evening (4PM-8PM)">Evening (4PM-8PM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Special Instructions</label>
                <textarea
                  placeholder="Any special requirements or notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm h-16 resize-none"
                  data-testid="input-booking-notes"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-2 text-blue-800 text-xs">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Our team will call you to confirm the booking</span>
                </div>
              </div>

              <Button
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg"
                onClick={handleSubmit}
                disabled={isSubmitting}
                data-testid="btn-submit-booking"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Request Callback
                  </span>
                )}
              </Button>

              <p className="text-center text-[10px] text-gray-400">By booking, you agree to our terms of service</p>
            </div>
          </motion.div>
        </div>
      )}

      {showCallForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setShowCallForm(false)}>
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <PhoneCall className="h-5 w-5" />
                  Request a Call
                </h3>
                <button onClick={() => setShowCallForm(false)} className="p-1 hover:bg-white/20 rounded-full" data-testid="close-call-form">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-2">
                <img src={product.image} alt={product.name} className="h-12 w-12 object-contain rounded-lg bg-white/20" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-green-100 text-xs">{product.unit || "per service"}</p>
                </div>
                <p className="font-bold text-lg">₹{product.price}</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                <p className="text-xs text-green-800 flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 flex-shrink-0" />
                  <span>Humari team aapko call karegi aapki zaroorat samajhne ke liye</span>
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Your Name *</label>
                <Input
                  placeholder="Enter your name"
                  value={callFormData.customerName}
                  onChange={(e) => setCallFormData({ ...callFormData, customerName: e.target.value })}
                  className="h-10"
                  data-testid="input-call-name"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Phone Number *</label>
                <Input
                  placeholder="Enter 10-digit phone number"
                  value={callFormData.customerPhone}
                  onChange={(e) => setCallFormData({ ...callFormData, customerPhone: e.target.value })}
                  className="h-10"
                  type="tel"
                  maxLength={10}
                  data-testid="input-call-phone"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Aap call mein kya discuss karna chahte hain? *
                </label>
                <textarea
                  placeholder="e.g. Mobile ki display change karvani hai, price jaanna hai..."
                  value={callFormData.reason}
                  onChange={(e) => setCallFormData({ ...callFormData, reason: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 text-sm h-24 resize-none"
                  data-testid="input-call-reason"
                />
              </div>

              <Button
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm shadow-lg"
                onClick={handleSubmitCallRequest}
                disabled={isSubmitting}
                data-testid="btn-submit-call-request"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4" />
                    Submit Call Request
                  </span>
                )}
              </Button>

              <p className="text-center text-[10px] text-gray-400">We will call you within 30 minutes during business hours</p>
            </div>
          </motion.div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSuccess(false)}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 mx-4 max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${successType === "call" ? "bg-green-100" : "bg-blue-100"}`}>
              {successType === "call" ? (
                <PhoneCall className="h-8 w-8 text-green-600" />
              ) : (
                <CheckCircle className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {successType === "call" ? "Call Request Sent!" : "Booking Request Sent!"}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              Your {successType === "call" ? "call" : ""} request for <span className="font-medium">{product.name}</span> has been received.
            </p>
            <p className={`text-sm font-medium mb-4 ${successType === "call" ? "text-green-600" : "text-blue-600"}`}>
              {successType === "call" ? "Our team will call you soon!" : "Our team will call you shortly to confirm."}
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-left text-xs text-gray-600 space-y-1">
              <p><span className="font-medium">Service:</span> {product.name}</p>
              {successType === "booking" && <p><span className="font-medium">Price:</span> ₹{product.price}</p>}
              {successType === "call" && callFormData.reason && <p><span className="font-medium">Reason:</span> {callFormData.reason}</p>}
              {successType === "booking" && formData.preferredDate && <p><span className="font-medium">Date:</span> {formData.preferredDate}</p>}
              {successType === "booking" && formData.preferredTime && <p><span className="font-medium">Time:</span> {formData.preferredTime}</p>}
            </div>
            <Button
              className="mt-4 w-full"
              onClick={() => setShowSuccess(false)}
              data-testid="btn-close-success"
            >
              Done
            </Button>
          </motion.div>
        </div>
      )}
    </>
  );
}
