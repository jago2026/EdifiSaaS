import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

// ============================================
// UTILIDADES
// ============================================

/**
 * Genera un hash único para un movimiento basado en sus datos
 * Esto permite detectar movimientos duplicados sin necesidad de comparar históricos
 */
function generateHash(
  tipo: string,
  fecha: number,
  descripcion: string,
  monto: number,
  camposExtras: Record<string, any> = {}
): string {
  const data = `${tipo}|${fecha}|${descripcion}|${monto}|${JSON.stringify(camposExtras)}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Verifica si un movimiento ya existe en la base de datos
 */
async function movementExists(
  ctx: any,
  tipo: string,
  hash: string
): Promise<boolean> {
  if (tipo === "receipt") {
    const existing = await ctx.db
      .query("receipts")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .first();
    return existing !== null;
  } else if (tipo === "expense") {
    const existing = await ctx.db
      .query("expenses")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .first();
    return existing !== null;
  } else if (tipo === "commonExpense") {
    const existing = await ctx.db
      .query("commonExpenses")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .first();
    return existing !== null;
  } else if (tipo === "balance") {
    const existing = await ctx.db
      .query("balance")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .first();
    return existing !== null;
  }
  return false;
}

// ============================================
// MUTACIONES PÚBLICAS
// ============================================

/**
 * Obtener todos los movimientos nuevos de un edificio
 */
export const listNewMovements = query({
  args: { buildingId: v.id("buildings") },
  returns: v.object({
    receipts: v.array(v.object({
      _id: v.id("receipts"),
      fecha: v.number(),
      unidad: v.string(),
      propietario: v.string(),
      monto: v.number(),
      concepto: v.string(),
      detectedAt: v.number(),
    })),
    expenses: v.array(v.object({
      _id: v.id("expenses"),
      fecha: v.number(),
      descripcion: v.string(),
      monto: v.number(),
      categoria: v.string(),
      detectedAt: v.number(),
    })),
    commonExpenses: v.array(v.object({
      _id: v.id("commonExpenses"),
      fecha: v.number(),
      descripcion: v.string(),
      monto: v.number(),
      tipo: v.string(),
      detectedAt: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    const [receipts, expenses, commonExpenses] = await Promise.all([
      ctx.db
        .query("receipts")
        .withIndex("by_is_new", (q) => q.eq("isNew", true))
        .collect(),
      ctx.db
        .query("expenses")
        .withIndex("by_is_new", (q) => q.eq("isNew", true))
        .collect(),
      ctx.db
        .query("commonExpenses")
        .withIndex("by_is_new", (q) => q.eq("isNew", true))
        .collect(),
    ]);

    // Filtrar por edificio
    return {
      receipts: receipts
        .filter((r) => r.buildingId === args.buildingId)
        .map((r) => ({
          _id: r._id,
          fecha: r.fecha,
          unidad: r.unidad,
          propietario: r.propietario,
          monto: r.monto,
          concepto: r.concepto,
          detectedAt: r.detectedAt!,
        })),
      expenses: expenses
        .filter((e) => e.buildingId === args.buildingId)
        .map((e) => ({
          _id: e._id,
          fecha: e.fecha,
          descripcion: e.descripcion,
          monto: e.monto,
          categoria: e.categoria,
          detectedAt: e.detectedAt!,
        })),
      commonExpenses: commonExpenses
        .filter((ce) => ce.buildingId === args.buildingId)
        .map((ce) => ({
          _id: ce._id,
          fecha: ce.fecha,
          descripcion: ce.descripcion,
          monto: ce.monto,
          tipo: ce.tipo,
          detectedAt: ce.detectedAt!,
        })),
    };
  },
});

/**
 * Marcar movimientos como revisados
 */
export const markAsReviewed = mutation({
  args: {
    buildingId: v.id("buildings"),
    receiptIds: v.optional(v.array(v.id("receipts"))),
    expenseIds: v.optional(v.array(v.id("expenses"))),
    commonExpenseIds: v.optional(v.array(v.id("commonExpenses"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Marcar recibos como revisados
    if (args.receiptIds) {
      for (const receiptId of args.receiptIds) {
        const receipt = await ctx.db.get(receiptId);
        if (receipt && receipt.buildingId === args.buildingId) {
          await ctx.db.patch(receiptId, { isNew: false });
        }
      }
    }

    // Marcar egresos como revisados
    if (args.expenseIds) {
      for (const expenseId of args.expenseIds) {
        const expense = await ctx.db.get(expenseId);
        if (expense && expense.buildingId === args.buildingId) {
          await ctx.db.patch(expenseId, { isNew: false });
        }
      }
    }

    // Marcar gastos comunes como revisados
    if (args.commonExpenseIds) {
      for (const commonExpenseId of args.commonExpenseIds) {
        const commonExpense = await ctx.db.get(commonExpenseId);
        if (commonExpense && commonExpense.buildingId === args.buildingId) {
          await ctx.db.patch(commonExpenseId, { isNew: false });
        }
      }
    }

    return null;
  },
});

// ============================================
// MUTACIONES INTERNAS
// ============================================

/**
 * Insertar o actualizar recibos con detección de nuevos movimientos
 */
export const upsertReceipts = internalMutation({
  args: {
    buildingId: v.id("buildings"),
    receipts: v.array(v.object({
      fecha: v.number(),
      unidad: v.string(),
      propietario: v.string(),
      monto: v.number(),
      concepto: v.string(),
      periodo: v.string(),
      externalId: v.optional(v.string()),
    })),
  },
  returns: v.object({
    total: v.number(),
    new: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let newCount = 0;

    for (const receipt of args.receipts) {
      // Generar hash único
      const hash = generateHash(
        "receipt",
        receipt.fecha,
        receipt.concepto,
        receipt.monto,
        { unidad: receipt.unidad, propietario: receipt.propietario }
      );

      // Verificar si ya existe
      const existing = await ctx.db
        .query("receipts")
        .withIndex("by_hash", (q) => q.eq("hash", hash))
        .first();

      if (!existing) {
        // Nuevo movimiento detectado
        await ctx.db.insert("receipts", {
          buildingId: args.buildingId,
          fecha: receipt.fecha,
          unidad: receipt.unidad,
          propietario: receipt.propietario,
          monto: receipt.monto,
          concepto: receipt.concepto,
          periodo: receipt.periodo,
          hash: hash,
          isNew: true,
          detectedAt: now,
          syncedAt: now,
          externalId: receipt.externalId,
        });
        newCount++;
      } else {
        // Ya existe, actualizar solo si el externalId cambió
        if (receipt.externalId && existing.externalId !== receipt.externalId) {
          await ctx.db.patch(existing._id, { externalId: receipt.externalId });
        }
      }
    }

    return {
      total: args.receipts.length,
      new: newCount,
    };
  },
});

/**
 * Insertar o actualizar egresos con detección de nuevos movimientos
 */
export const upsertExpenses = internalMutation({
  args: {
    buildingId: v.id("buildings"),
    expenses: v.array(v.object({
      fecha: v.number(),
      descripcion: v.string(),
      monto: v.number(),
      categoria: v.string(),
      proveedor: v.optional(v.string()),
      numeroFactura: v.optional(v.string()),
      externalId: v.optional(v.string()),
    })),
  },
  returns: v.object({
    total: v.number(),
    new: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let newCount = 0;

    for (const expense of args.expenses) {
      // Generar hash único
      const hash = generateHash(
        "expense",
        expense.fecha,
        expense.descripcion,
        expense.monto,
        { categoria: expense.categoria, proveedor: expense.proveedor }
      );

      // Verificar si ya existe
      const existing = await ctx.db
        .query("expenses")
        .withIndex("by_hash", (q) => q.eq("hash", hash))
        .first();

      if (!existing) {
        // Nuevo movimiento detectado
        await ctx.db.insert("expenses", {
          buildingId: args.buildingId,
          fecha: expense.fecha,
          descripcion: expense.descripcion,
          monto: expense.monto,
          categoria: expense.categoria,
          proveedor: expense.proveedor,
          numeroFactura: expense.numeroFactura,
          hash: hash,
          isNew: true,
          detectedAt: now,
          syncedAt: now,
          externalId: expense.externalId,
        });
        newCount++;
      } else {
        // Ya existe
        if (expense.externalId && existing.externalId !== expense.externalId) {
          await ctx.db.patch(existing._id, { externalId: expense.externalId });
        }
      }
    }

    return {
      total: args.expenses.length,
      new: newCount,
    };
  },
});

/**
 * Insertar o actualizar gastos comunes con detección de nuevos movimientos
 */
export const upsertCommonExpenses = internalMutation({
  args: {
    buildingId: v.id("buildings"),
    commonExpenses: v.array(v.object({
      fecha: v.number(),
      descripcion: v.string(),
      monto: v.number(),
      tipo: v.string(),
      externalId: v.optional(v.string()),
    })),
  },
  returns: v.object({
    total: v.number(),
    new: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    let newCount = 0;

    for (const commonExpense of args.commonExpenses) {
      // Generar hash único
      const hash = generateHash(
        "commonExpense",
        commonExpense.fecha,
        commonExpense.descripcion,
        commonExpense.monto,
        { tipo: commonExpense.tipo }
      );

      // Verificar si ya existe
      const existing = await ctx.db
        .query("commonExpenses")
        .withIndex("by_hash", (q) => q.eq("hash", hash))
        .first();

      if (!existing) {
        // Nuevo movimiento detectado
        await ctx.db.insert("commonExpenses", {
          buildingId: args.buildingId,
          fecha: commonExpense.fecha,
          descripcion: commonExpense.descripcion,
          monto: commonExpense.monto,
          tipo: commonExpense.tipo,
          hash: hash,
          isNew: true,
          detectedAt: now,
          syncedAt: now,
          externalId: commonExpense.externalId,
        });
        newCount++;
      } else {
        // Ya existe
        if (commonExpense.externalId && existing.externalId !== commonExpense.externalId) {
          await ctx.db.patch(existing._id, { externalId: commonExpense.externalId });
        }
      }
    }

    return {
      total: args.commonExpenses.length,
      new: newCount,
    };
  },
});

/**
 * Insertar o actualizar balance con detección de cambios
 */
export const upsertBalance = internalMutation({
  args: {
    buildingId: v.id("buildings"),
    balance: v.object({
      fecha: v.number(),
      saldo: v.number(),
      ingresosMes: v.number(),
      egresosMes: v.number(),
      gastosMes: v.number(),
    }),
  },
  returns: v.boolean, // true si es nuevo balance
  handler: async (ctx, args) => {
    const now = Date.now();

    // Generar hash único
    const hash = generateHash(
      "balance",
      args.balance.fecha,
      "balance",
      args.balance.saldo,
      {
        ingresosMes: args.balance.ingresosMes,
        egresosMes: args.balance.egresosMes,
        gastosMes: args.balance.gastosMes,
      }
    );

    // Verificar si ya existe
    const existing = await ctx.db
      .query("balance")
      .withIndex("by_hash", (q) => q.eq("hash", hash))
      .first();

    if (!existing) {
      // Nuevo balance detectado
      await ctx.db.insert("balance", {
        buildingId: args.buildingId,
        fecha: args.balance.fecha,
        saldo: args.balance.saldo,
        ingresosMes: args.balance.ingresosMes,
        egresosMes: args.balance.egresosMes,
        gastosMes: args.balance.gastosMes,
        hash: hash,
        isNew: true,
        detectedAt: now,
        syncedAt: now,
      });
      return true;
    }

    return false;
  },
});
