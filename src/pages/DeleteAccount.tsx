import { ArrowLeft, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function DeleteAccount() {
  const [_, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useStore();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const deletePhone = isAuthenticated ? user?.phone : phone;

    if (!deletePhone) {
      toast({ title: "Please enter your registered phone number", variant: "destructive" });
      return;
    }

    if (!confirmed) {
      toast({ title: "Please confirm that you understand your data will be permanently deleted", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/delete-account-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: deletePhone, reason }),
      });

      if (res.ok) {
        setSubmitted(true);
        if (isAuthenticated) {
          logout();
        }
      } else {
        const data = await res.json();
        toast({ title: data.message || "Something went wrong", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to submit request. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-primary text-white p-4 flex items-center gap-3">
          <button onClick={() => setLocation("/")} data-testid="back-button">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">Delete Account</h1>
        </div>

        <div className="p-6 max-w-md mx-auto text-center space-y-4 mt-10">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-green-800">Request Submitted</h2>
            <p className="text-sm text-green-700">
              Your account deletion request has been received. Your account and all associated data will be permanently deleted within 7 days.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              If you have any questions, contact us at 9999878381
            </p>
          </div>
          <Button onClick={() => setLocation("/")} className="mt-4" data-testid="button-go-home">
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-red-600 text-white p-4 flex items-center gap-3">
        <button onClick={() => setLocation("/")} data-testid="back-button">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">Delete Account</h1>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6 pb-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <h2 className="font-semibold text-red-800">Account Deletion Request</h2>
          </div>
          <p className="text-sm text-red-700">
            Requesting account deletion will permanently remove your account and all associated data including:
          </p>
          <ul className="text-sm text-red-700 list-disc pl-5 space-y-1">
            <li>Your profile information (name, phone, email, address)</li>
            <li>Order history</li>
            <li>Cart items and preferences</li>
            <li>Referral data</li>
          </ul>
          <p className="text-xs text-red-600 font-medium mt-2">
            This action cannot be undone. Your data will be deleted within 7 days of submitting this request.
          </p>
        </div>

        {isAuthenticated ? (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Logged in as:</p>
            <p className="font-medium">{user?.name || user?.phone}</p>
            <p className="text-sm text-muted-foreground">{user?.phone}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium">Registered Phone Number *</label>
            <Input
              type="tel"
              placeholder="Enter your registered phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              data-testid="input-delete-phone"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Reason for deletion (optional)</label>
          <textarea
            className="w-full border rounded-lg p-3 text-sm min-h-[80px] resize-none"
            placeholder="Tell us why you want to delete your account..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            data-testid="input-delete-reason"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4"
            data-testid="checkbox-confirm-delete"
          />
          <span className="text-sm text-muted-foreground">
            I understand that my account and all associated data will be permanently deleted and this action cannot be undone.
          </span>
        </label>

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          data-testid="button-submit-delete"
        >
          {loading ? "Submitting..." : "Delete My Account"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          For any questions, contact us at <a href="tel:9999878381" className="text-primary underline">9999878381</a>
        </p>
      </div>
    </div>
  );
}
