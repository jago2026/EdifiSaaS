import { query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// QUERIES PÚBLICAS
// ============================================

/**
 * Obtener balance actual de un edificio
 */
export const getCurrent = query({
  args: { buildingId: v.id("buildings") },
  returns: v.optional(
    v.object({
      _id: v.id("balance"),
      fecha: v.number(),
      saldo: v.number(),
      ingresosMes: v.number(),
      egresosMes: v.number(),
      gastosMes: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const balance = await ctx.db
      .query("balance")
      .withIndex("by_building", (q) => q.eq("buildingId", args.buildingId))
      .order("desc")
      .first();

    if (!balance) return null;

    return {
      _id: balance._id,
      fecha: balance.fecha,
      saldo: balance.saldo,
      ingresosMes: balance.ingresosMes,
      egresosMes: balance.egresosMes,
      gastosMes: balance.gastosMes,
    };
  },
});

/**
 * Obtener historial de balance (últimos 12 meses)
 */
export const getHistory = query({
  args: { buildingId: v.id("buildings") },
  returns: v.array(
    v.object({
      _id: v.id("balance"),
      fecha: v.number(),
      saldo: v.number(),
      ingresosMes: v.number(),
      egresosMes: v.number(),
      gastosMes: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const balances = await ctx.db
      .query("balance")
      .withIndex("by_building", (q) => q.eq("buildingId", args.buildingId))
      .order("desc")
      .take(12);

    return balances.map((b) => ({
      _id: b._id,
      fecha: b.fecha,
      saldo: b.saldo,
      ingresosMes: b.ingresosMes,
      egresosMes: b.egresosMes,
      gastosMes: b.gastosMes,
    }));
  },
});

/**
 * Obtener control diario del mes actual
 */
export const getDailyControl = query({
  args: { 
    buildingId: v.id("buildings"),
    year: v.number(),
    month: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("dailyControl"),
      fecha: v.number(),
      saldo: v.number(),
      ingresosDia: v.number(),
      ingresosMes: v.number(),
      egresosDia: v.number(),
      egresosMes: v.number(),
      gastosDia: v.number(),
      gastosMes: v.number(),
      numeroRecibos: v.number(),
      numeroEgresos: v.number(),
      numeroGastos: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const startDate = new Date(args.year, args.month - 1, 1).getTime();
    const endDate = new Date(args.year, args.month, 0).getTime();

    const dailyControls = await ctx.db
      .query("dailyControl")
      .withIndex("by_building_fecha", (q) =>
        q
          .eq("buildingId", args.buildingId)
          .gte("fecha", startDate)
          .lte("fecha", endDate)
      )
      .collect();

    return dailyControls.map((dc) => ({
      _id: dc._id,
      fecha: dc.fecha,
      saldo: dc.saldo,
      ingresosDia: dc.ingresosDia,
      ingresosMes: dc.ingresosMes,
      egresosDia: dc.egresosDia,
      egresosMes: dc.egresosMes,
      gastosDia: dc.gastosDia,
      gastosMes: dc.gastosMes,
      numeroRecibos: dc.numeroRecibos,
      numeroEgresos: dc.numeroEgresos,
      numeroGastos: dc.numeroGastos,
    }));
  },
});

// ============================================
// QUERIES INTERNAS
// ============================================

/**
 * Obtener balance del mes anterior
 */
export const getPreviousMonth = internalQuery({
  args: { buildingId: v.id("buildings") },
  returns: v.optional(
    v.object({
      _id: v.id("balance"),
      fecha: v.number(),
      saldo: v.number(),
      ingresosMes: v.number(),
      egresosMes: v.number(),
      gastosMes: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const now = new Date();
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    const balances = await ctx.db
      .query("balance")
      .withIndex("by_building", (q) => q.eq("buildingId", args.buildingId))
      .order("desc")
      .collect();

    // Encontrar el balance del mes anterior
    for (const balance of balances) {
      const balanceDate = new Date(balance.fecha);
      if (balanceDate.getMonth() === previousMonthDate.getMonth() &&
          balanceDate.getFullYear() === previousMonthDate.getFullYear()) {
        return {
          _id: balance._id,
          fecha: balance.fecha,
          saldo: balance.saldo,
          ingresosMes: balance.ingresosMes,
          egresosMes: balance.egresosMes,
          gastosMes: balance.gastosMes,
        };
      }
    }

    return null;
  },
});

// ============================================
// MUTACIONES INTERNAS
// ============================================

/**
 * Calcular y registrar el control diario
 */
export const calculateAndRegisterDailyControl = internalMutation({
  args: {
    buildingId: v.id("buildings"),
    date: v.number(), // Date en milisegundos
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const buildingId = args.buildingId;
    const dateStart = new Date(args.date);
    const dateEnd = new Date(args.date);
    dateEnd.setHours(23, 59, 59, 999);

    // Obtener el balance más reciente
    const balance = await ctx.db
      .query("balance")
      .withIndex("by_building", (q) => q.eq("buildingId", buildingId))
      .order("desc")
      .first();

    if (!balance) return null;

    // Calcular ingresos del día
    const receiptsToday = await ctx.db
      .query("receipts")
      .withIndex("by_building_fecha", (q) =>
        q
          .eq("buildingId", buildingId)
          .gte("fecha", dateStart.getTime())
          .lte("fecha", dateEnd.getTime())
      )
      .collect();

    const ingresosDia = receiptsToday.reduce((sum, r) => sum + r.monto, 0);
    const numeroRecibos = receiptsToday.length;

    // Calcular egresos del día
    const expensesToday = await ctx.db
      .query("expenses")
      .withIndex("by_building_fecha", (q) =>
        q
          .eq("buildingId", buildingId)
          .gte("fecha", dateStart.getTime())
          .lte("fecha", dateEnd.getTime())
      )
      .collect();

    const egresosDia = expensesToday.reduce((sum, e) => sum + e.monto, 0);
    const numeroEgresos = expensesToday.length;

    // Calcular gastos comunes del día
    const commonExpensesToday = await ctx.db
      .query("commonExpenses")
      .withIndex("by_building_fecha", (q) =>
        q
          .eq("buildingId", buildingId)
          .gte("fecha", dateStart.getTime())
          .lte("fecha", dateEnd.getTime())
      )
      .collect();

    const gastosDia = commonExpensesToday.reduce((sum, ce) => sum + ce.monto, 0);
    const numeroGastos = commonExpensesToday.length;

    // Calcular totales del mes
    const monthStart = new Date(dateStart.getFullYear(), dateStart.getMonth(), 1);
    
    const receiptsMonth = await ctx.db
      .query("receipts")
      .withIndex("by_building_fecha", (q) =>
        q
          .eq("buildingId", buildingId)
          .gte("fecha", monthStart.getTime())
          .lte("fecha", dateEnd.getTime())
      )
      .collect();

    const ingresosMes = receiptsMonth.reduce((sum, r) => sum + r.monto, 0);

    const expensesMonth = await ctx.db
      .query("expenses")
      .withIndex("by_building_fecha", (q) =>
        q
          .eq("buildingId", buildingId)
          .gte("fecha", monthStart.getTime())
          .lte("fecha", dateEnd.getTime())
      )
      .collect();

    const egresosMes = expensesMonth.reduce((sum, e) => sum + e.monto, 0);

    const commonExpensesMonth = await ctx.db
      .query("commonExpenses")
      .withIndex("by_building_fecha", (q) =>
        q
          .eq("buildingId", buildingId)
          .gte("fecha", monthStart.getTime())
          .lte("fecha", dateEnd.getTime())
      )
      .collect();

    const gastosMes = commonExpensesMonth.reduce((sum, ce) => sum + ce.monto, 0);

    // Verificar si ya existe un control diario para esta fecha
    const existing = await ctx.db
      .query("dailyControl")
      .withIndex("by_building_fecha", (q) =>
        q
          .eq("buildingId", buildingId)
          .eq("fecha", dateStart.getTime())
      )
      .first();

    if (existing) {
      // Actualizar control diario existente
      await ctx.db.patch(existing._id, {
        saldo: balance.saldo,
        ingresosDia,
        ingresosMes,
        egresosDia,
        egresosMes,
        gastosDia,
        gastosMes,
        numeroRecibos,
        numeroEgresos,
        numeroGastos,
      });
    } else {
      // Crear nuevo control diario
      await ctx.db.insert("dailyControl", {
        buildingId,
        fecha: dateStart.getTime(),
        saldo: balance.saldo,
        ingresosDia,
        ingresosMes,
        egresosDia,
        egresosMes,
        gastosDia,
        gastosMes,
        numeroRecibos,
        numeroEgresos,
        numeroGastos,
      });
    }

    return null;
  },
});
