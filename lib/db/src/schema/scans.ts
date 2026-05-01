import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scansTable = pgTable("scans", {
  id: serial("id").primaryKey(),
  target: text("target").notNull(),
  scanType: text("scan_type").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  result: jsonb("result").notNull(),
});

export const insertScanSchema = createInsertSchema(scansTable).omit({ id: true, timestamp: true });
export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scansTable.$inferSelect;
