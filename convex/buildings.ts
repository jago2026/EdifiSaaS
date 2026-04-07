import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// QUERIES PÚBLICAS
// ============================================

/**
 * Obtener todos los edificios de un usuario
 */
export const list = query({
  args: { ownerId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("buildings"),
      name: v.string(),
      address: v.string(),
      units: v.number(),
      active: v.boolean(),
      lastSyncAt: v.optional(v.number()),
      lastSyncStatus: v.union(v.literal("success"), v.literal("error"), v.literal("pending")),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const buildings = await ctx.db
      .query("buildings")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
      .collect();
    
    return buildings.map((b) => ({
      _id: b._id,
      name: b.name,
      address: b.address,
      units: b.units,
      active: b.active,
      lastSyncAt: b.lastSyncAt,
      lastSyncStatus: b.lastSyncStatus,
      createdAt: b.createdAt,
    }));
  },
});

/**
 * Obtener detalles de un edificio específico
 */
export const getById = query({
  args: { buildingId: v.id("buildings") },
  returns: v.optional(
    v.object({
      _id: v.id("buildings"),
      name: v.string(),
      address: v.string(),
      units: v.number(),
      active: v.boolean(),
      lastSyncAt: v.optional(v.number()),
      lastSyncStatus: v.union(v.literal("success"), v.literal("error"), v.literal("pending")),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const building = await ctx.db.get(args.buildingId);
    if (!building) return null;
    
    return {
      _id: building._id,
      name: building.name,
      address: building.address,
      units: building.units,
      active: building.active,
      lastSyncAt: building.lastSyncAt,
      lastSyncStatus: building.lastSyncStatus,
      createdAt: building.createdAt,
    };
  },
});

// ============================================
// MUTACIONES PÚBLICAS
// ============================================

/**
 * Crear un nuevo edificio
 */
export const create = mutation({
  args: {
    ownerId: v.id("users"),
    name: v.string(),
    address: v.string(),
    units: v.number(),
    adminProvider: v.string(),
    adminUsername: v.string(),
    adminPassword: v.string(),
  },
  returns: v.id("buildings"),
  handler: async (ctx, args) => {
    // Crear el edificio
    const buildingId = await ctx.db.insert("buildings", {
      name: args.name,
      address: args.address,
      units: args.units,
      ownerId: args.ownerId,
      adminConfig: {
        provider: args.adminProvider,
        username: args.adminUsername,
        password: args.adminPassword, // TODO: Encriptar antes de guardar
        urlLogin: "https://admlaideal.com.ve/control.php",
        urlRecibos: "https://admlaideal.com.ve/condlin.php?r=5",
        urlEgresos: "https://admlaideal.com.ve/condlin.php?r=21",
        urlGastos: "https://admlaideal.com.ve/condlin.php?r=3",
        urlBalance: "https://admlaideal.com.ve/condlin.php?r=2",
      },
      alertConfig: {
        variationSaldo: 25,
        variationGastos: 50,
        variationEgresos: 40,
        variationRecibos: 30,
        enableEmailAlerts: true,
        enableSMSAlerts: false,
      },
      lastSyncStatus: "pending",
      createdAt: Date.now(),
      active: true,
    });

    return buildingId;
  },
});

/**
 * Actualizar edificio
 */
export const update = mutation({
  args: {
    buildingId: v.id("buildings"),
    name: v.optional(v.string()),
    address: v.optional(v.string()),
    units: v.optional(v.number()),
    adminConfig: v.optional(v.object({
      provider: v.optional(v.string()),
      username: v.optional(v.string()),
      password: v.optional(v.string()),
    })),
    alertConfig: v.optional(v.object({
      variationSaldo: v.optional(v.number()),
      variationGastos: v.optional(v.number()),
      variationEgresos: v.optional(v.number()),
      variationRecibos: v.optional(v.number()),
      enableEmailAlerts: v.optional(v.boolean()),
      enableSMSAlerts: v.optional(v.boolean()),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { buildingId, ...updates } = args;
    const building = await ctx.db.get(buildingId);
    if (!building) {
      throw new Error("Edificio no encontrado");
    }

    await ctx.db.patch(buildingId, updates);
    return null;
  },
});

/**
 * Desactivar edificio
 */
export const deactivate = mutation({
  args: { buildingId: v.id("buildings") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const building = await ctx.db.get(args.buildingId);
    if (!building) {
      throw new Error("Edificio no encontrado");
    }

    await ctx.db.patch(args.buildingId, { active: false });
    return null;
  },
});

// ============================================
// MUTACIONES INTERNAS
// ============================================

/**
 * Actualizar estado de sincronización
 */
export const updateSyncStatus = internalMutation({
  args: {
    buildingId: v.id("buildings"),
    status: v.union(v.literal("success"), v.literal("error"), v.literal("pending")),
    lastSyncAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.buildingId, {
      lastSyncStatus: args.status,
      lastSyncAt: args.lastSyncAt,
    });
    return null;
  },
});

/**
 * Obtener configuración de administradora (interna)
 */
export const getAdminConfig = internalMutation({
  args: { buildingId: v.id("buildings") },
  returns: v.optional(v.object({
    provider: v.string(),
    username: v.string(),
    password: v.string(),
    urlLogin: v.string(),
    urlRecibos: v.string(),
    urlEgresos: v.string(),
    urlGastos: v.string(),
    urlBalance: v.string(),
  })),
  handler: async (ctx, args) => {
    const building = await ctx.db.get(args.buildingId);
    if (!building || !building.adminConfig) {
      return null;
    }
    return building.adminConfig;
  },
});
