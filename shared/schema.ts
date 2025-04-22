import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("user"),
  created_at: timestamp("created_at").defaultNow(),
});

// Farms table
export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  area: decimal("area").notNull(),
  cultivated_area: decimal("cultivated_area"),
  crops: text("crops").array(),
  employees: integer("employees"),
  status: text("status").default("active"),
  image: text("image"),
  user_id: integer("user_id").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// Sectors table
export const sectors = pgTable("sectors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  farm_id: integer("farm_id").references(() => farms.id).notNull(),
  area: decimal("area").notNull(),
  current_crop: text("current_crop"),
  status: text("status").default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

// Lots table
export const lots = pgTable("lots", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sector_id: integer("sector_id").references(() => sectors.id).notNull(),
  area: decimal("area").notNull(),
  current_crop: text("current_crop"),
  planting_date: timestamp("planting_date"),
  expected_harvest_date: timestamp("expected_harvest_date"),
  status: text("status").default("active"),
  created_at: timestamp("created_at").defaultNow(),
});

// Crops table
export const crops = pgTable("crops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  variety: text("variety"),
  cycle_days: integer("cycle_days"),
  yield_per_hectare: decimal("yield_per_hectare"),
  planting_season_start: text("planting_season_start"),
  planting_season_end: text("planting_season_end"),
  created_at: timestamp("created_at").defaultNow(),
});

// Agricultural inputs table
export const inputs = pgTable("inputs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  unit: text("unit").notNull(),
  stock: decimal("stock").default("0"),
  price_per_unit: decimal("price_per_unit"),
  supplier: text("supplier"),
  last_purchase_date: timestamp("last_purchase_date"),
  created_at: timestamp("created_at").defaultNow(),
});

// Irrigation records table
export const irrigations = pgTable("irrigations", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  farm_id: integer("farm_id").references(() => farms.id).notNull(),
  sector_id: integer("sector_id").references(() => sectors.id),
  lot_id: integer("lot_id").references(() => lots.id),
  volume: decimal("volume").notNull(),
  duration: integer("duration"),
  responsible: text("responsible"),
  notes: text("notes"),
  created_at: timestamp("created_at").defaultNow(),
});

// Pest records table
export const pests = pgTable("pests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  affected_crops: text("affected_crops").array(),
  detection_date: timestamp("detection_date").notNull(),
  status: text("status").default("active"),
  severity: text("severity"),
  treatment: text("treatment"),
  farm_id: integer("farm_id").references(() => farms.id).notNull(),
  sector_id: integer("sector_id").references(() => sectors.id),
  created_at: timestamp("created_at").defaultNow(),
});

// Financial transactions table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // income or expense
  category: text("category").notNull(),
  amount: decimal("amount").notNull(),
  description: text("description"),
  farm_id: integer("farm_id").references(() => farms.id),
  payment_method: text("payment_method"),
  created_at: timestamp("created_at").defaultNow(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  activity: text("activity").notNull(),
  farm_id: integer("farm_id").references(() => farms.id).notNull(),
  sector_id: integer("sector_id").references(() => sectors.id),
  lot_id: integer("lot_id").references(() => lots.id),
  responsible: text("responsible"),
  status: text("status").default("Em andamento"),
  created_at: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export const insertFarmSchema = createInsertSchema(farms).omit({
  id: true,
  created_at: true,
});

export const insertSectorSchema = createInsertSchema(sectors).omit({
  id: true,
  created_at: true,
});

export const insertLotSchema = createInsertSchema(lots).omit({
  id: true,
  created_at: true,
});

export const insertCropSchema = createInsertSchema(crops).omit({
  id: true,
  created_at: true,
});

export const insertInputSchema = createInsertSchema(inputs).omit({
  id: true,
  created_at: true,
});

export const insertIrrigationSchema = createInsertSchema(irrigations).omit({
  id: true,
  created_at: true,
});

export const insertPestSchema = createInsertSchema(pests).omit({
  id: true,
  created_at: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  created_at: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  created_at: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFarm = z.infer<typeof insertFarmSchema>;
export type Farm = typeof farms.$inferSelect;

export type InsertSector = z.infer<typeof insertSectorSchema>;
export type Sector = typeof sectors.$inferSelect;

export type InsertLot = z.infer<typeof insertLotSchema>;
export type Lot = typeof lots.$inferSelect;

export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof crops.$inferSelect;

export type InsertInput = z.infer<typeof insertInputSchema>;
export type Input = typeof inputs.$inferSelect;

export type InsertIrrigation = z.infer<typeof insertIrrigationSchema>;
export type Irrigation = typeof irrigations.$inferSelect;

export type InsertPest = z.infer<typeof insertPestSchema>;
export type Pest = typeof pests.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
