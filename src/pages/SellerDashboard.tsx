import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { Store, Plus, Package, LogOut, Edit2, Trash2, Eye, EyeOff } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  images?: string[] | null;
  category: string;
  unit: string;
  stock: number;
  isActive: string;
  sellerId: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
}

export default function SellerDashboard() {
  const [_, setLocation] = useLocation();
  const { user, logout } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    originalPrice: "",
    image: "",
    images: [] as string[],
    category: "",
    unit: "1 kg",
    stock: "100",
  });

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/seller/products", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/seller/products?sellerId=${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
  });

  const allProductCategories = categories.filter(c => c.type === "product");
  const productCategories = user?.allowedCategories && user.allowedCategories.length > 0
    ? allProductCategories.filter(c => user.allowedCategories!.includes(c.slug))
    : allProductCategories;

  const addProductMutation = useMutation({
    mutationFn: async (product: any) => {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...product,
          sellerId: user?.id,
          sellerShopName: user?.shopName,
        }),
      });
      if (!res.ok) throw new Error("Failed to add product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
      setShowAddProduct(false);
      setNewProduct({ name: "", price: "", originalPrice: "", image: "", images: [], category: "", unit: "1 kg", stock: "100" });
      toast({ title: "Product Added!", description: "Your product has been added successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add product", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/seller/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
      setEditingProduct(null);
      toast({ title: "Product Updated!", description: "Product updated successfully." });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/seller/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seller/products"] });
      toast({ title: "Product Deleted", description: "Product has been removed." });
    },
  });

  const handleLogout = () => {
    logout();
    setLocation("/seller-auth");
  };

  const handleAddProduct = () => {
    const mainImage = newProduct.images.length > 0 ? newProduct.images[0] : newProduct.image;
    if (!newProduct.name || !newProduct.price || !mainImage || !newProduct.category) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    addProductMutation.mutate({
      name: newProduct.name,
      price: parseInt(newProduct.price),
      originalPrice: parseInt(newProduct.originalPrice) || parseInt(newProduct.price),
      image: mainImage,
      images: newProduct.images.length > 0 ? newProduct.images : (newProduct.image ? [newProduct.image] : []),
      category: newProduct.category,
      unit: newProduct.unit,
      stock: parseInt(newProduct.stock) || 100,
    });
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;
    const editImages = editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : [editingProduct.image];
    updateProductMutation.mutate({
      id: editingProduct.id,
      data: {
        name: editingProduct.name,
        price: editingProduct.price,
        originalPrice: editingProduct.originalPrice,
        image: editImages[0] || editingProduct.image,
        images: editImages,
        category: editingProduct.category,
        unit: editingProduct.unit,
        stock: editingProduct.stock,
        isActive: editingProduct.isActive,
        sellerId: user?.id,
      },
    });
  };

  const toggleProductActive = (product: Product) => {
    updateProductMutation.mutate({
      id: product.id,
      data: { isActive: product.isActive === "true" ? "false" : "true" },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-orange-600 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="h-6 w-6" />
            <div>
              <h1 className="font-bold">{user?.shopName || "My Shop"}</h1>
              <p className="text-xs text-orange-100">Seller Dashboard</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white hover:bg-orange-700"
            onClick={handleLogout}
            data-testid="btn-seller-logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">My Products</h2>
            <p className="text-sm text-muted-foreground">{products.length} products listed</p>
          </div>
          <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700" data-testid="btn-add-product">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Enter product name"
                    data-testid="input-product-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Price (₹) *</Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="Selling price"
                      data-testid="input-product-price"
                    />
                  </div>
                  <div>
                    <Label>Original Price (₹)</Label>
                    <Input
                      type="number"
                      value={newProduct.originalPrice}
                      onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                      placeholder="MRP"
                      data-testid="input-product-original-price"
                    />
                  </div>
                </div>
                <div>
                  <Label>Image Links * (Max 3)</Label>
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
                  <p className="text-[10px] text-gray-400 mt-1">Pehli image main image hogi</p>
                </div>
                <div>
                  <Label>Category *</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger data-testid="select-product-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {productCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Unit</Label>
                    <Input
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                      placeholder="1 kg"
                      data-testid="input-product-unit"
                    />
                  </div>
                  <div>
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      placeholder="100"
                      data-testid="input-product-stock"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  onClick={handleAddProduct}
                  disabled={addProductMutation.isPending}
                  data-testid="btn-submit-product"
                >
                  {addProductMutation.isPending ? "Adding..." : "Add Product"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Loading products...</div>
        ) : products.length === 0 ? (
          <Card className="text-center py-10">
            <CardContent>
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No Products Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add your first product to start selling</p>
              <Button onClick={() => setShowAddProduct(true)} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <Card key={product.id} className={product.isActive === "false" ? "opacity-60" : ""} data-testid={`product-card-${product.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.category} • {product.unit}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleProductActive(product)}
                            data-testid={`toggle-product-${product.id}`}
                          >
                            {product.isActive === "true" ? (
                              <Eye className="h-4 w-4 text-green-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingProduct(product)}
                            data-testid={`edit-product-${product.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm("Delete this product?")) {
                                deleteProductMutation.mutate(product.id);
                              }
                            }}
                            data-testid={`delete-product-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="font-bold text-orange-600">₹{product.price}</span>
                        {product.originalPrice > product.price && (
                          <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">Stock: {product.stock}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 pt-4">
              <div>
                <Label>Product Name</Label>
                <Input
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Original Price (₹)</Label>
                  <Input
                    type="number"
                    value={editingProduct.originalPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Image Links (Max 3)</Label>
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
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={editingProduct.category}
                  onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unit</Label>
                  <Input
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={handleUpdateProduct}
                disabled={updateProductMutation.isPending}
              >
                {updateProductMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
