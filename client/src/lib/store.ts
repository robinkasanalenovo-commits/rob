import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  images?: string[] | null;
  category: string;
  unit: string;
  sortOrder?: number;
  hasVariants?: boolean;
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  originalPrice: number;
}

export interface CartItem extends Product {
  quantity: number;
  variantId?: number;
  variantName?: string;
}

interface User {
  id?: number | string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  mainAreaId?: number;
  mainAreaName?: string;
  subAreaId?: number;
  subAreaName?: string;
  referralCode?: string;
  referralBalance?: number;
  isApproved: boolean;
  isAdmin: boolean;
  isSeller?: string;
  shopName?: string;
  sellerStatus?: string;
  allowedCategories?: string[];
  approvalStatus?: string;
  isStaff?: string;
  staffStatus?: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  cart: CartItem[];
  login: (userData: any) => void;
  signup: (data: any) => void;
  logout: () => void;
  addToCart: (product: Product, variant?: ProductVariant) => void;
  removeFromCart: (productId: number, variantId?: number) => void;
  updateQuantity: (productId: number, delta: number, variantId?: number) => void;
  clearCart: () => void;
}

const emptyStorage = {
  getItem: (_name: string) => null,
  setItem: (_name: string, _value: string) => {},
  removeItem: (_name: string) => {},
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      cart: [],

      login: (userData) => {
        set({
          user: {
            id: userData?.id,
            name: userData?.name || userData?.username?.split("@")[0] || "User",
            email: userData?.username || userData?.email || "",
            phone: userData?.phone || "",
            address: userData?.address || "",
            mainAreaId: userData?.mainAreaId || undefined,
            mainAreaName: userData?.mainAreaName || "",
            subAreaId: userData?.subAreaId || undefined,
            subAreaName: userData?.subAreaName || "",
            referralCode: userData?.referralCode || "",
            referralBalance: userData?.referralBalance || 0,
            isApproved: true,
            isAdmin: userData?.isAdmin === "true" || userData?.isAdmin === true,
            isSeller: userData?.isSeller || "false",
            shopName: userData?.shopName || "",
            sellerStatus: userData?.sellerStatus || "pending",
            allowedCategories: userData?.allowedCategories || [],
            approvalStatus: userData?.approvalStatus || "pending",
            isStaff: userData?.isStaff || "false",
            staffStatus: userData?.staffStatus || "pending",
          },
          isAuthenticated: true,
        });
      },

      signup: (data) => {
        set({
          user: {
            id: data?.id,
            name: data?.name || "User",
            email: data?.email || "",
            phone: data?.phone || "",
            address: data?.address || "",
            mainAreaId: data?.mainAreaId || undefined,
            mainAreaName: data?.mainAreaName || "",
            subAreaId: data?.subAreaId || undefined,
            subAreaName: data?.subAreaName || "",
            referralCode: data?.referralCode || "",
            referralBalance: data?.referralBalance || 0,
            isApproved: true,
            isAdmin: false,
            isSeller: "false",
            shopName: "",
            sellerStatus: "pending",
            allowedCategories: [],
            approvalStatus: "pending",
            isStaff: "false",
            staffStatus: "pending",
          },
          isAuthenticated: true,
        });
      },

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          cart: [],
        }),

      addToCart: (product, variant) =>
        set((state) => {
          const matchKey = variant
            ? (item: CartItem) => item.id === product.id && item.variantId === variant.id
            : (item: CartItem) => item.id === product.id && item.variantId === undefined;

          const existing = state.cart.find(matchKey);

          if (existing) {
            return {
              cart: state.cart.map((item) =>
                matchKey(item) ? { ...item, quantity: item.quantity + 1 } : item
              ),
            };
          }

          const cartItem: CartItem = variant
            ? {
                ...product,
                price: variant.price,
                originalPrice: variant.originalPrice,
                unit: variant.name,
                variantId: variant.id,
                variantName: variant.name,
                quantity: 1,
              }
            : {
                ...product,
                quantity: 1,
              };

          return {
            cart: [...state.cart, cartItem],
          };
        }),

      removeFromCart: (productId, variantId) =>
        set((state) => ({
          cart: state.cart.filter(
            (item) => !(item.id === productId && item.variantId === variantId)
          ),
        })),

      updateQuantity: (productId, delta, variantId) =>
        set((state) => ({
          cart: state.cart
            .map((item) => {
              const matches =
                variantId !== undefined
                  ? item.id === productId && item.variantId === variantId
                  : item.id === productId && item.variantId === undefined;

              if (!matches) return item;

              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            })
            .filter((item): item is CartItem => item !== null),
        })),

      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "atozstore-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : emptyStorage
      ),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        cart: state.cart,
      }),
    }
  )
);
