import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// QUERIES PÚBLICAS
// ============================================

/**
 * Obtener alertas de un edificio
 */
export const list = query({
  args: {
    buildingId: v.id("buildings"),
    unreadOnly: v.optional(v.boolean()),
  },
  returns: v.array(
    v.object({
      _id: v.id("alerts"),
      type: v.union(
        v.literal("saldo_variation"),
        v.literal("gastos_variation"),
        v.literal("egresos_variation"),
        v.literal("recibos_variation"),
        v.literal("new_expense"),
        v.literal("sync_error")
      ),
      severity: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("critical")),
      title: v.string(),
      message: v.string(),
      data: v.optional(v.any()),
      read: v.boolean(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("alerts")
      .withIndex("by_building", (q) => q.eq("buildingId", args.buildingId));

    if (args.unreadOnly) {
      query = query.filter((q) => q.eq(q.field("read"), false));
    }

    const alerts = await query.order("desc").take(50);
    return alerts;
  },
});

/**
 * Obtener conteo de alertas no leídas
 */
export const getUnreadCount = query({
  args: { buildingId: v.id("buildings") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_building", (q) => 
        q.eq("buildingId", args.buildingId)
      )
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    return alerts.length;
  },
});

// ============================================
// MUTACIONES PÚBLICAS
// ============================================

/**
 * Marcar alerta como leída
 */
export const markAsRead = mutation({
  args: { alertId: v.id("alerts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { read: true });
    return null;
  },
});

/**
 * Marcar todas las alertas como leídas
 */
export const markAllAsRead = mutation({
  args: { buildingId: v.id("buildings") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_building", (q) => q.eq("buildingId", args.buildingId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    for (const alert of alerts) {
      await ctx.db.patch(alert._id, { read: true });
    }

    return null;
  },
});

/**
 * Eliminar alerta
 */
export const remove = mutation({
  args: { alertId: v.id("alerts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.alertId);
    return null;
  },
});

// ============================================
// MUTACIONES INTERNAS
// ============================================

/**
 * Crear una alerta
 */
export const create = internalMutation({
  args: {
    buildingId: v.id("buildings"),
    type: v.union(
      v.literal("saldo_variation"),
      v.literal("gastos_variation"),
      v.literal("egresos_variation"),
      v.literal("recibos_variation"),
      v.literal("new_expense"),
      v.literal("sync_error")
    ),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("critical")),
    title: v.string(),
    message: v.string(),
    data: v.optional(v.any()),
    read: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("alerts", {
      buildingId: args.buildingId,
      type: args.type,
      severity: args.severity,
      title: args.title,
      message: args.message,
      data: args.data,
      read: args.read ?? false,
      createdAt: args.createdAt ?? Date.now(),
    });
    return null;
  },
});

/**
 * Generar alertas después de una sincronización
 */
export const generateAlertsForSync = internalAction({
  args: {
    buildingId: v.id("buildings"),
    receiptsNew: v.number(),
    expensesNew: v.number(),
    commonExpensesNew: v.number(),
    balanceNew: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();

    // 1. Alerta si hay nuevos recibos
    if (args.receiptsNew > 0) {
      await ctx.runMutation("alerts:create", {
        buildingId: args.buildingId,
        type: "recibos_variation",
        severity: args.receiptsNew > 10 ? "warning" : "info",
        title: "Nuevos recibos detectados",
        message: `Se detectaron ${args.receiptsNew} nuevo(s) recibo(s) en la última sincronización.`,
        data: { count: args.receiptsNew },
        read: false,
        createdAt: now,
      });
    }

    // 2. Alerta si hay nuevos egresos
    if (args.expensesNew > 0) {
      await ctx.runMutation("alerts:create", {
        buildingId: args.buildingId,
        type: "egresos_variation",
        severity: args.expensesNew > 5 ? "warning" : "info",
        title: "Nuevos egresos detectados",
        message: `Se detectaron ${args.expensesNew} nuevo(s) egreso(s) en la última sincronización.`,
        data: { count: args.expensesNew },
        read: false,
        createdAt: now,
      });
    }

    // 3. Alerta si hay nuevos gastos comunes
    if (args.commonExpensesNew > 0) {
      await ctx.runMutation("alerts:create", {
        buildingId: args.buildingId,
        type: "gastos_variation",
        severity: args.commonExpensesNew > 5 ? "warning" : "info",
        title: "Nuevos gastos comunes detectados",
        message: `Se detectaron ${args.commonExpensesNew} nuevo(s) gasto(s) común(es) en la última sincronización.`,
        data: { count: args.commonExpensesNew },
        read: false,
        createdAt: now,
      });
    }

    // 4. Alerta si hay nuevo balance
    if (args.balanceNew) {
      await ctx.runMutation("alerts:create", {
        buildingId: args.buildingId,
        type: "saldo_variation",
        severity: "info",
        title: "Balance actualizado",
        message: "El balance del edificio se ha actualizado con datos recientes.",
        read: false,
        createdAt: now,
      });
    }

    return null;
  },
});

/**
 * Generar alertas de variación de saldos (comparación con periodo anterior)
 */
export const generateBalanceVariationAlerts = internalAction({
  args: {
    buildingId: v.id("buildings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const building = await ctx.runQuery("buildings:getAdminConfig", {
      buildingId: args.buildingId,
    });
    
    if (!building) return null;

    // Obtener configuración de alertas del edificio
    // TODO: Implementar lógica para obtener configuración de alertas
    const threshold = 25; // Por defecto 25%

    // Obtener balance actual y del mes anterior
    const currentBalance = await ctx.runQuery(
      "balance:getCurrent",
      { buildingId: args.buildingId }
    );
    
    const previousBalance = await ctx.runQuery(
      "balance:getPreviousMonth",
      { buildingId: args.buildingId }
    );

    if (!currentBalance || !previousBalance) return null;

    // Calcular variación porcentual
    const variation = ((currentBalance.saldo - previousBalance.saldo) / Math.abs(previousBalance.saldo)) * 100;

    // Generar alerta si la variación supera el umbral
    if (Math.abs(variation) > threshold) {
      await ctx.runMutation("alerts:create", {
        buildingId: args.buildingId,
        type: "saldo_variation",
        severity: Math.abs(variation) > threshold * 2 ? "critical" : "warning",
        title: "Variación significativa en el saldo",
        message: `El saldo del edificio ha variado un ${variation.toFixed(2)}% respecto al mes anterior.`,
        data: {
          current: currentBalance.saldo,
          previous: previousBalance.saldo,
          variation: variation,
        },
        read: false,
        createdAt: Date.now(),
      });
    }

    return null;
  },
});
