import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Edit2, Trash2, RefreshCw, Save, X, ChevronUp, ChevronDown, Package, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from "@/lib/store";

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string | null;
  sortOrder: number | null;
  isActive: string | null;
}

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
  hasVariants: string | null;
}

interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
  stock: number | null;
  sortOrder: number | null;
  isActive: string | null;
}

export default function AdminProducts() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [originalProduct, setOriginalProduct] = useState<Product | null>(null);
  const [syncVariants, setSyncVariants] = useState(true);
  const [variantsProduct, setVariantsProduct] = useState<DbProduct | null>(null);
  const [newVariant, setNewVariant] = useState({ name: "", price: "", originalPrice: "", stock: "100" });
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    originalPrice: "",
    image: "",
    category: "vegetables",
    unit: "",
    stock: "100",
  });

  const { data: dbProductsData, isLoading: productsLoading } = useQuery<DbProduct[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });

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

  const sortedProducts = [...products].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const { data: categoriesData } = useQuery<Category[]>({
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

  const productCategories = categoriesList.filter(c => c.type === "product" || !c.type);

  const { data: variantsData } = useQuery<ProductVariant[]>({
    queryKey: ["/api/products", variantsProduct?.id, "variants"],
    queryFn: async () => {
      if (!variantsProduct) return [];
      const res = await fetch(`/api/products/${variantsProduct.id}/variants`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!variantsProduct,
  });

  const variants = variantsData || [];

  const createVariantMutation = useMutation({
    mutationFn: async (variant: typeof newVariant) => {
      const res = await fetch(`/api/products/${variantsProduct!.id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: variant.name,
          price: parseInt(variant.price),
          originalPrice: parseInt(variant.originalPrice),
          stock: parseInt(variant.stock),
          sortOrder: variants.length + 1,
          isActive: "true",
        }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", variantsProduct?.id, "variants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setNewVariant({ name: "", price: "", originalPrice: "", stock: "100" });
      toast({ title: "✓ Size Added!", description: `${data.name} - ₹${data.price} saved successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to add variant", variant: "destructive" });
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/variants/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", variantsProduct?.id, "variants"] });
      toast({ title: "Deleted!", description: "Variant removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete variant", variant: "destructive" });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (product: typeof newProduct) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          price: parseInt(product.price),
          originalPrice: parseInt(product.originalPrice),
          image: product.image,
          category: product.category,
          unit: product.unit,
          stock: parseInt(product.stock),
          isActive: "true",
          sortOrder: sortedProducts.length + 1,
        }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowAddProduct(false);
      setNewProduct({ name: "", price: "", originalPrice: "", image: "", category: "vegetables", unit: "", stock: "100" });
      toast({ title: "Added!", description: "Product added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add product", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data, sync }: { id: number; data: Partial<Product>; sync?: boolean }) => {
      const payload: any = { ...data };
      if (sync && originalProduct) {
        payload.syncVariants = true;
        payload.oldPrice = originalProduct.price;
        payload.oldOriginalPrice = originalProduct.originalPrice;
        payload.oldStock = (originalProduct as any).stock;
      }
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update product");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      setOriginalProduct(null);
      const syncMsg = data.syncedVariants > 0 ? ` (${data.syncedVariants} variants synced)` : "";
      toast({ title: "Updated!", description: `Product updated successfully${syncMsg}` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Deleted!", description: "Product deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    },
  });

  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleMoveProductUp = async (product: Product) => {
    const categoryProducts = sortedProducts.filter(p => p.category === product.category);
    const currentIndex = categoryProducts.findIndex(p => p.id === product.id);
    if (currentIndex > 0) {
      const prevProduct = categoryProducts[currentIndex - 1];
      // Use unique sortOrder values based on position
      const prevSortOrder = currentIndex - 1;
      const currentSortOrder = currentIndex;
      // Swap: current gets prev's position, prev gets current's position
      await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: prevSortOrder }),
      });
      await fetch(`/api/products/${prevProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: currentSortOrder }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Moved!", description: `${product.name} moved up` });
    }
  };

  const handleMoveProductDown = async (product: Product) => {
    const categoryProducts = sortedProducts.filter(p => p.category === product.category);
    const currentIndex = categoryProducts.findIndex(p => p.id === product.id);
    if (currentIndex < categoryProducts.length - 1) {
      const nextProduct = categoryProducts[currentIndex + 1];
      // Use unique sortOrder values based on position
      const nextSortOrder = currentIndex + 1;
      const currentSortOrder = currentIndex;
      // Swap: current gets next's position, next gets current's position
      await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: nextSortOrder }),
      });
      await fetch(`/api/products/${nextProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: currentSortOrder }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Moved!", description: `${product.name} moved down` });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin")} className="text-white hover:bg-white/20">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Package className="h-6 w-6" />
        <h1 className="text-xl font-bold">Products Management</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Products ({sortedProducts.length})</h2>
          <Button size="sm" onClick={() => setShowAddProduct(true)} className="gap-1" data-testid="add-product-btn">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        {productsLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sortedProducts.length === 0 ? (
          <Card className="border">
            <CardContent className="p-6 text-center text-muted-foreground">
              No products yet. Add your first product!
            </CardContent>
          </Card>
        ) : (
          <>
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

                    <div className="space-y-2 pl-2">
                      {categoryProducts.map(product => {
                        const dbProduct = dbProductsData?.find(p => p.id === product.id);
                        const hasVariants = dbProduct?.hasVariants === "true";
                        return (
                        <Card key={product.id} className="border shadow-sm" data-testid={`product-card-${product.id}`}>
                          <CardContent className="p-3">
                            <div className="flex gap-3">
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="font-medium text-sm truncate">{product.name}</p>
                                  {hasVariants && (
                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Sizes</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground capitalize">{product.unit}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm font-bold text-primary">₹{product.price}</span>
                                  {product.originalPrice > product.price && (
                                    <span className="text-xs text-muted-foreground line-through">₹{product.originalPrice}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-center gap-0.5 mr-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleMoveProductUp(product)}
                                  data-testid={`move-up-product-${product.id}`}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleMoveProductDown(product)}
                                  data-testid={`move-down-product-${product.id}`}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`h-8 w-8 p-0 ${hasVariants ? 'border-blue-500 text-blue-600' : ''}`}
                                  onClick={() => dbProduct && setVariantsProduct(dbProduct)}
                                  data-testid={`variants-product-${product.id}`}
                                  title="Manage sizes/quantities"
                                >
                                  <Layers className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0"
                                  onClick={() => { const ep = dbProduct ? {...product, hasVariants: dbProduct.hasVariants, stock: dbProduct.stock} : product; setEditingProduct(ep); setOriginalProduct({...ep}); setSyncVariants(true); }}
                                  data-testid={`edit-product-${product.id}`}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  disabled={deleteProductMutation.isPending}
                                  data-testid={`delete-product-${product.id}`}
                                >
                                  {deleteProductMutation.isPending ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );})}
                    </div>
                  </div>
                );
              });
            })()}
          </>
        )}
      </div>

      {showAddProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                Add New Product
                <Button variant="ghost" size="sm" onClick={() => setShowAddProduct(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Product name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                data-testid="input-product-name"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Price (₹)"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  data-testid="input-product-price"
                />
                <Input
                  placeholder="Original Price (₹)"
                  type="number"
                  value={newProduct.originalPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                  data-testid="input-product-original-price"
                />
              </div>
              <Input
                placeholder="Image URL"
                value={newProduct.image}
                onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                data-testid="input-product-image"
              />
              <Select
                value={newProduct.category}
                onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
              >
                <SelectTrigger data-testid="select-product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Unit (e.g., 1 kg)"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  data-testid="input-product-unit"
                />
                <Input
                  placeholder="Stock"
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  data-testid="input-product-stock"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createProductMutation.mutate(newProduct)}
                disabled={createProductMutation.isPending || !newProduct.name || !newProduct.price}
                data-testid="save-product-btn"
              >
                {createProductMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Product
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                Edit Product
                <Button variant="ghost" size="sm" onClick={() => setEditingProduct(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Product name"
                defaultValue={editingProduct.name}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                data-testid="input-edit-product-name"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Price (₹)"
                  type="number"
                  defaultValue={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-product-price"
                />
                <Input
                  placeholder="Original Price (₹)"
                  type="number"
                  defaultValue={editingProduct.originalPrice}
                  onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-product-original-price"
                />
              </div>
              <Input
                placeholder="Image URL"
                defaultValue={editingProduct.image}
                onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                data-testid="input-edit-product-image"
              />
              <Select
                value={editingProduct.category}
                onValueChange={(value) => setEditingProduct({ ...editingProduct, category: value as "vegetables" | "fruits" | "dairy" })}
              >
                <SelectTrigger data-testid="select-edit-product-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {productCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Unit (e.g., 1 kg)"
                  defaultValue={editingProduct.unit}
                  onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                  data-testid="input-edit-product-unit"
                />
                <Input
                  placeholder="Stock"
                  type="number"
                  defaultValue={(editingProduct as any).stock ?? 100}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 } as any)}
                  data-testid="input-edit-product-stock"
                />
              </div>
              {(editingProduct as any).hasVariants === "true" && (
                <div
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer"
                  style={{ backgroundColor: syncVariants ? '#f0fdf4' : '#fefce8', borderColor: syncVariants ? '#86efac' : '#fde047' }}
                  onClick={() => setSyncVariants(!syncVariants)}
                  data-testid="toggle-sync-variants"
                >
                  <div className="flex items-center gap-2">
                    <RefreshCw className={`h-4 w-4 ${syncVariants ? 'text-green-600' : 'text-yellow-600'}`} />
                    <div>
                      <p className="text-sm font-medium">{syncVariants ? 'Sync ON' : 'Sync OFF'}</p>
                      <p className="text-xs text-gray-500">
                        {syncVariants
                          ? 'Price/stock changes will update matching variants'
                          : 'Variants will not be affected'}
                      </p>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${syncVariants ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                    <div className="w-4 h-4 bg-white rounded-full shadow" />
                  </div>
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => updateProductMutation.mutate({ id: editingProduct.id, data: editingProduct, sync: syncVariants })}
                disabled={updateProductMutation.isPending}
                data-testid="update-product-btn"
              >
                {updateProductMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Update Product
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {variantsProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  <span>Sizes - {variantsProduct.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setVariantsProduct(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                Add different sizes/quantities with their own prices. Customers will see a dropdown to choose size.
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Add New Size:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Size (e.g., 250g, 1kg)"
                    value={newVariant.name}
                    onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                    data-testid="input-variant-name"
                  />
                  <Input
                    placeholder="Price (₹)"
                    type="number"
                    value={newVariant.price}
                    onChange={(e) => setNewVariant({ ...newVariant, price: e.target.value })}
                    data-testid="input-variant-price"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Original Price (₹)"
                    type="number"
                    value={newVariant.originalPrice}
                    onChange={(e) => setNewVariant({ ...newVariant, originalPrice: e.target.value })}
                    data-testid="input-variant-original-price"
                  />
                  <Input
                    placeholder="Stock"
                    type="number"
                    value={newVariant.stock}
                    onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                    data-testid="input-variant-stock"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => createVariantMutation.mutate(newVariant)}
                  disabled={createVariantMutation.isPending || !newVariant.name || !newVariant.price}
                  data-testid="add-variant-btn"
                >
                  {createVariantMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Size
                </Button>
              </div>

              {variants.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Sizes ({variants.length}):</p>
                  <p className="text-[10px] text-muted-foreground">⬆⬇ buttons se order change karo - #1 size customer ko pehle dikhega</p>
                  {[...variants].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((v, idx) => (
                    <div key={v.id} className={`p-2 rounded-lg ${v.isActive === "true" ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`} data-testid={`variant-item-${v.id}`}>
                      {editingVariant?.id === v.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={editingVariant.name}
                              onChange={(e) => setEditingVariant({...editingVariant, name: e.target.value})}
                              placeholder="Size (250g, 1kg)"
                              className="h-8 text-sm"
                            />
                            <Input
                              type="number"
                              value={editingVariant.price}
                              onChange={(e) => setEditingVariant({...editingVariant, price: parseInt(e.target.value) || 0})}
                              placeholder="Price"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              value={editingVariant.originalPrice}
                              onChange={(e) => setEditingVariant({...editingVariant, originalPrice: parseInt(e.target.value) || 0})}
                              placeholder="Original Price"
                              className="h-8 text-sm"
                            />
                            <Input
                              type="number"
                              value={editingVariant.stock || 0}
                              onChange={(e) => setEditingVariant({...editingVariant, stock: parseInt(e.target.value) || 0})}
                              placeholder="Stock"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editingVariant.isActive === "true"}
                                onChange={(e) => setEditingVariant({...editingVariant, isActive: e.target.checked ? "true" : "false"})}
                              />
                              Active
                            </label>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                className="h-7 text-xs px-3"
                                onClick={async () => {
                                  try {
                                    await fetch(`/api/variants/${editingVariant.id}`, {
                                      method: "PATCH",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        name: editingVariant.name,
                                        price: editingVariant.price,
                                        originalPrice: editingVariant.originalPrice,
                                        stock: editingVariant.stock,
                                        isActive: editingVariant.isActive,
                                      }),
                                    });
                                    queryClient.invalidateQueries({ queryKey: ["/api/products", variantsProduct?.id, "variants"] });
                                    setEditingVariant(null);
                                    toast({ title: "Saved!", description: "Size updated" });
                                  } catch (err) {
                                    toast({ title: "Error", description: "Update failed", variant: "destructive" });
                                  }
                                }}
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs px-3" onClick={() => setEditingVariant(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <div className="flex flex-col gap-0.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0"
                                disabled={idx === 0}
                                onClick={async () => {
                                  const sorted = [...variants].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                                  const prev = sorted[idx - 1];
                                  if (!prev) return;
                                  await fetch(`/api/variants/${v.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: prev.sortOrder || idx - 1 }) });
                                  await fetch(`/api/variants/${prev.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: v.sortOrder || idx }) });
                                  queryClient.invalidateQueries({ queryKey: ["/api/products", variantsProduct?.id, "variants"] });
                                }}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0"
                                disabled={idx === variants.length - 1}
                                onClick={async () => {
                                  const sorted = [...variants].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                                  const next = sorted[idx + 1];
                                  if (!next) return;
                                  await fetch(`/api/variants/${v.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: next.sortOrder || idx + 1 }) });
                                  await fetch(`/api/variants/${next.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sortOrder: v.sortOrder || idx }) });
                                  queryClient.invalidateQueries({ queryKey: ["/api/products", variantsProduct?.id, "variants"] });
                                }}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${idx === 0 ? "bg-primary text-white" : "bg-gray-200"}`}>#{idx + 1}</span>
                                <p className="font-medium text-sm">{v.name}</p>
                                {idx === 0 && <span className="text-[10px] text-primary font-medium">(Default)</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-primary font-bold">₹{v.price}</span>
                                {v.originalPrice > v.price && (
                                  <span className="text-xs text-muted-foreground line-through">₹{v.originalPrice}</span>
                                )}
                                <span className={`text-xs px-1.5 py-0.5 rounded ${v.isActive === "true" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                  {v.isActive === "true" ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditingVariant(v)}
                              data-testid={`edit-variant-${v.id}`}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                              onClick={() => {
                                if (confirm("Delete this size?")) {
                                  deleteVariantMutation.mutate(v.id);
                                }
                              }}
                              disabled={deleteProductMutation.isPending}
                              data-testid={`delete-variant-${v.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
