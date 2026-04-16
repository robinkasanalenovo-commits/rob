import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useStore } from "@/lib/store";
import { Shield, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLogin() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { login, user, isAuthenticated } = useStore();
  
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already logged in as admin, redirect to admin panel
  useEffect(() => {
    if (isAuthenticated && user?.isAdmin) {
      setLocation("/admin");
    }
  }, [isAuthenticated, user?.isAdmin, setLocation]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || !password) {
      toast({
        title: "Error",
        description: "Please enter email/phone and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: phone, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.isAdmin !== true && data.isAdmin !== "true") {
        toast({
          title: "Access Denied",
          description: "This login is for administrators only",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      login(data);
      toast({
        title: "Welcome Admin!",
        description: "Redirecting to dashboard..."
      });
      setLocation("/admin");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Admin Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-2xl mb-4">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">AtoZDukaan Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Management Dashboard | Contact: 9999878381</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-white text-lg">Administrator Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">Email / Username</Label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="Enter admin email"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white/10 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                  data-testid="admin-input-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 pr-10"
                    data-testid="admin-input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-6"
                data-testid="admin-btn-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Login to Dashboard
                  </>
                )}
              </Button>
              <p className="text-center text-slate-400 text-xs mt-3">
                Password bhool gaye? Settings mein jaake change karein ya developer se contact karein.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}
