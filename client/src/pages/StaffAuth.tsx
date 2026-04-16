import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, UserPlus, LogIn } from "lucide-react";

export default function StaffAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Enter phone number and password", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Login failed", variant: "destructive" });
        return;
      }
      login(data);
      if (data.staffStatus === "approved") {
        setLocation("/staff");
      } else {
        setLocation("/staff-pending");
      }
    } catch {
      toast({ title: "Login failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password || !name) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/staff/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, name, phone: phone || username }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Registration failed", variant: "destructive" });
        return;
      }
      login(data);
      setLocation("/staff-pending");
      toast({ title: "Account created! Waiting for admin approval." });
    } catch {
      toast({ title: "Registration failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <ClipboardList className="h-8 w-8 text-purple-600" />
          </div>
          <CardTitle className="text-xl">Purchase & Sale Manager</CardTitle>
          <p className="text-sm text-gray-500">AtoZDukaan Staff Portal</p>
        </CardHeader>
        <CardContent>
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Phone Number</label>
                <Input placeholder="Enter phone number" value={username} onChange={(e) => setUsername(e.target.value)} data-testid="input-staff-username" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Password</label>
                <Input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-staff-password" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700" data-testid="btn-staff-login">
                <LogIn className="h-4 w-4 mr-2" />
                {loading ? "Logging in..." : "Login"}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <button type="button" onClick={() => setIsLogin(false)} className="text-purple-600 font-medium" data-testid="btn-switch-signup">
                  Sign Up
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Full Name *</label>
                <Input placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} data-testid="input-staff-name" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Phone Number (Login ID) *</label>
                <Input placeholder="Enter phone number" value={username} onChange={(e) => setUsername(e.target.value)} data-testid="input-staff-signup-username" />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Password *</label>
                <Input type="password" placeholder="Create password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="input-staff-signup-password" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700" data-testid="btn-staff-signup">
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? "Creating..." : "Sign Up"}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <button type="button" onClick={() => setIsLogin(true)} className="text-purple-600 font-medium" data-testid="btn-switch-login">
                  Login
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
