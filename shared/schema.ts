import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").default(""),
  phone: text("phone").default(""),
  email: text("email").default(""),
  address: text("address").default(""),
  mainAreaId: integer("main_area_id"),
  mainAreaName: text("main_area_name"),
  subAreaId: integer("sub_area_id"),
  subAreaName: text("sub_area_name"),
  approvalStatus: text("approval_status").default("pending"), // "pending", "approved", "rejected"
  isAdmin: text("is_admin").default("false"),
  isSeller: text("is_seller").default("false"), // "true" if user is a seller
  shopName: text("shop_name"), // seller's shop name
  sellerStatus: text("seller_status").default("pending"), // "pending", "approved", "rejected"
  allowedCategories: text("allowed_categories").array(), // admin-approved category slugs for seller
  referralCode: text("referral_code"),
  referredBy: text("referred_by"),
  referralBalance: integer("referral_balance").default(0),
  isStaff: text("is_staff").default("false"),
  staffStatus: text("staff_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  mainAreaName: text("main_area_name"),
  subAreaName: text("sub_area_name"),
  total: integer("total").notNull(),
  referralDiscount: integer("referral_discount").default(0),
  itemsCount: integer("items_count").notNull(),
  status: text("status").default("Pending"), // "Pending", "Processing", "Delivered", "Cancelled"
  paymentStatus: text("payment_status").default("pending"), // "pending", "cod", "online_paid"
  deliverySlot: text("delivery_slot").default("Morning"),
  deliveryAddress: text("delivery_address"),
  orderNotes: text("order_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  originalPrice: integer("original_price").notNull(),
  image: text("image").notNull(),
  images: text("images").array(),
  category: text("category").notNull(), // "vegetables", "fruits", "dairy"
  unit: text("unit").default("1 kg"),
  stock: integer("stock").default(100),
  isActive: text("is_active").default("true"),
  sortOrder: integer("sort_order").default(0),
  hasVariants: text("has_variants").default("false"), // "true" if product has multiple variants
  sellerId: varchar("seller_id"), // seller who added this product (null = admin added)
  sellerShopName: text("seller_shop_name"), // seller's shop name for display
});

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  name: text("name").notNull(), // "250g", "500g", "1kg", "5kg" etc
  price: integer("price").notNull(),
  originalPrice: integer("original_price").notNull(),
  stock: integer("stock").default(100),
  sortOrder: integer("sort_order").default(0),
  isActive: text("is_active").default("true"),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").default("product"), // "product" or "service"
  iconKey: text("icon_key"), // lucide icon name like "Tv", "Droplets", etc.
  imageUrl: text("image_url"), // for categories with images
  colorStart: text("color_start").default("from-gray-100"), // gradient start
  colorEnd: text("color_end").default("to-gray-200"), // gradient end
  borderColor: text("border_color").default("border-gray-300"),
  textColor: text("text_color").default("text-gray-900"),
  sortOrder: integer("sort_order").default(0),
  isActive: text("is_active").default("true"),
  showOnHome: text("show_on_home").default("true"), // controls if category section shows on home page
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  originalPrice: integer("original_price").notNull(),
  image: text("image").notNull(),
  images: text("images").array(),
  categorySlug: text("category_slug").notNull(), // links to category slug
  unit: text("unit").default("per service"),
  sortOrder: integer("sort_order").default(0),
  isActive: text("is_active").default("true"),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id),
  variantId: integer("variant_id"),
  variantName: text("variant_name"),
  productName: text("product_name").notNull(),
  category: text("category").notNull(), // vegetables, fruits, dairy
  quantity: integer("quantity").notNull(),
  unit: text("unit").default("1 kg"),
  price: integer("price").notNull(),
});

// Delivery Areas - Main areas like Govindpuram, Shastri Nagar
export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").default(0),
  isActive: text("is_active").default("true"),
});

// Sub-areas under main areas - like Balaji Enclave under Govindpuram
export const subAreas = pgTable("sub_areas", {
  id: serial("id").primaryKey(),
  areaId: integer("area_id").references(() => areas.id).notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  sortOrder: integer("sort_order").default(0),
  isActive: text("is_active").default("true"),
});

// Delivery Slots - Morning, Afternoon, Evening
export const deliverySlots = pgTable("delivery_slots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Morning", "Afternoon", "Evening"
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "12:00"
  isActive: text("is_active").default("true"), // Global visibility
  sortOrder: integer("sort_order").default(0),
});

// Area-specific delivery slot visibility
export const areaDeliverySlots = pgTable("area_delivery_slots", {
  id: serial("id").primaryKey(),
  areaId: integer("area_id").references(() => areas.id).notNull(),
  slotId: integer("slot_id").references(() => deliverySlots.id).notNull(),
  isActive: text("is_active").default("true"), // Area-specific visibility
});

// Home page rotating banners
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").default(""),
  subtitle: text("subtitle").default(""),
  description: text("description").default(""),
  imageUrl: text("image_url").notNull(),
  ctaText: text("cta_text").default(""), // Call to action button text
  ctaLink: text("cta_link").default(""), // Link when clicking banner/CTA
  bgColor: text("bg_color").default("from-green-400 to-green-600"), // gradient colors
  textColor: text("text_color").default("white"),
  isActive: text("is_active").default("true"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  phone: true,
  email: true,
  address: true,
  mainAreaId: true,
  mainAreaName: true,
  subAreaId: true,
  subAreaName: true,
  referralCode: true,
  referredBy: true,
  isAdmin: true,
  isSeller: true,
  shopName: true,
  sellerStatus: true,
  allowedCategories: true,
  approvalStatus: true,
});

export const insertAreaSchema = createInsertSchema(areas).omit({
  id: true,
});

export const insertSubAreaSchema = createInsertSchema(subAreas).omit({
  id: true,
});

export const insertDeliverySlotSchema = createInsertSchema(deliverySlots).omit({
  id: true,
});

export const insertAreaDeliverySlotSchema = createInsertSchema(areaDeliverySlots).omit({
  id: true,
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertArea = z.infer<typeof insertAreaSchema>;
export type Area = typeof areas.$inferSelect;
export type InsertSubArea = z.infer<typeof insertSubAreaSchema>;
export type SubArea = typeof subAreas.$inferSelect;
export type InsertDeliverySlot = z.infer<typeof insertDeliverySlotSchema>;
export type DeliverySlot = typeof deliverySlots.$inferSelect;
export type InsertAreaDeliverySlot = z.infer<typeof insertAreaDeliverySlotSchema>;
export type AreaDeliverySlot = typeof areaDeliverySlots.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type Banner = typeof banners.$inferSelect;

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description").default(""),
  itemName: text("item_name"),
  quantity: text("quantity"),
  purchasePrice: integer("purchase_price"),
  billImage: text("bill_image"),
  staffId: varchar("staff_id"),
  staffName: text("staff_name"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const serviceRequests = pgTable("service_requests", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id"),
  serviceName: text("service_name").notNull(),
  servicePrice: integer("service_price"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  preferredDate: text("preferred_date"),
  preferredTime: text("preferred_time"),
  notes: text("notes"),
  requestType: text("request_type").default("booking"),
  status: text("status").default("Pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({ id: true, createdAt: true });
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  image: text("image"),
  discount: text("discount"),
  isActive: text("is_active").default("true"),
  expiryDate: text("expiry_date"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOfferSchema = createInsertSchema(offers).omit({ id: true, createdAt: true });
export type InsertOffer = z.infer<typeof insertOfferSchema>;
export type Offer = typeof offers.$inferSelect;
