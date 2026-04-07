import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // USUARIOS Y AUTENTICACIÓN
  // ============================================
  users: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.optional(v.number()),
    image: v.optional(v.string()),
    // Datos de suscripción
    subscription: v.optional(v.object({
      plan: v.union(v.literal("free"), v.literal("basic"), v.literal("professional"), v.literal("enterprise")),
      status: v.union(v.literal("active"), v.literal("trial"), v.literal("cancelled"), v.literal("expired")),
      trialEndsAt: v.optional(v.number()),
      currentPeriodEnd: v.optional(v.number()),
      units: v.number(), // Número de unidades permitidas
    })),
  }).index("by_email", ["email"]),

  // ============================================
  // EDIFICIOS / CONDOMINIOS
  // ============================================
  buildings: defineTable({
    name: v.string(),
    address: v.string(),
    units: v.number(), // Total de unidades/apartamentos
    ownerId: v.id("users"), // Usuario principal
    // Configuración de la administradora
    adminConfig: v.optional(v.object({
      provider: v.string(), // "laideal", "otra"
      username: v.string(),
      password: v.string(), // Encriptada
      urlLogin: v.string(),
      urlRecibos: v.string(),
      urlEgresos: v.string(),
      urlGastos: v.string(),
      urlBalance: v.string(),
    })),
    // Configuración de alertas
    alertConfig: v.optional(v.object({
      variationSaldo: v.number(), // Porcentaje
      variationGastos: v.number(),
      variationEgresos: v.number(),
      variationRecibos: v.number(),
      enableEmailAlerts: v.boolean(),
      enableSMSAlerts: v.boolean(),
    })),
    // Sincronización
    lastSyncAt: v.optional(v.number()),
    lastSyncStatus: v.union(v.literal("success"), v.literal("error"), v.literal("pending")),
    createdAt: v.number(),
    active: v.boolean(),
  }).index("by_owner", ["ownerId"])
   .index("by_active", ["active"]),

  // ============================================
  // RECIBOS (INGRESOS)
  // ============================================
  receipts: defineTable({
    buildingId: v.id("buildings"),
    // Datos del movimiento
    fecha: v.number(), // Timestamp
    unidad: v.string(),
    propietario: v.string(),
    monto: v.number(),
    concepto: v.string(),
    periodo: v.string(), // "enero-2026"
    // Sistema de detección de movimientos nuevos
    hash: v.string(), // Hash único para deduplicación
    isNew: v.boolean(), // Marca como nuevo movimiento detectado
    detectedAt: v.optional(v.number()), // Cuándo se detectó como nuevo
    // Metadatos
    syncedAt: v.number(), // Cuándo se sincronizó por primera vez
    externalId: v.optional(v.string()), // ID en el sistema externo
  }).index("by_building", ["buildingId"])
   .index("by_building_fecha", ["buildingId", "fecha"])
   .index("by_hash", ["hash"])
   .index("by_is_new", ["isNew"]),

  // ============================================
  // EGRESOS
  // ============================================
  expenses: defineTable({
    buildingId: v.id("buildings"),
    // Datos del movimiento
    fecha: v.number(),
    descripcion: v.string(),
    monto: v.number(),
    categoria: v.string(),
    proveedor: v.optional(v.string()),
    numeroFactura: v.optional(v.string()),
    // Sistema de detección de movimientos nuevos
    hash: v.string(),
    isNew: v.boolean(),
    detectedAt: v.optional(v.number()),
    // Metadatos
    syncedAt: v.number(),
    externalId: v.optional(v.string()),
  }).index("by_building", ["buildingId"])
   .index("by_building_fecha", ["buildingId", "fecha"])
   .index("by_hash", ["hash"])
   .index("by_is_new", ["isNew"]),

  // ============================================
  // GASTOS COMUNES
  // ============================================
  commonExpenses: defineTable({
    buildingId: v.id("buildings"),
    // Datos del movimiento
    fecha: v.number(),
    descripcion: v.string(),
    monto: v.number(),
    tipo: v.string(), // "mantenimiento", "reparacion", "servicios", etc.
    // Sistema de detección de movimientos nuevos
    hash: v.string(),
    isNew: v.boolean(),
    detectedAt: v.optional(v.number()),
    // Metadatos
    syncedAt: v.number(),
    externalId: v.optional(v.string()),
  }).index("by_building", ["buildingId"])
   .index("by_building_fecha", ["buildingId", "fecha"])
   .index("by_hash", ["hash"])
   .index("by_is_new", ["isNew"]),

  // ============================================
  // BALANCE FINANCIERO
  // ============================================
  balance: defineTable({
    buildingId: v.id("buildings"),
    // Datos del balance
    fecha: v.number(),
    saldo: v.number(),
    ingresosMes: v.number(),
    egresosMes: v.number(),
    gastosMes: v.number(),
    // Sistema de detección de movimientos nuevos
    hash: v.string(),
    isNew: v.boolean(),
    detectedAt: v.optional(v.number()),
    // Metadatos
    syncedAt: v.number(),
  }).index("by_building", ["buildingId"])
   .index("by_building_fecha", ["buildingId", "fecha"])
   .index("by_hash", ["hash"])
   .index("by_is_new", ["isNew"]),

  // ============================================
  // HISTORIAL DE Sincronización
  // ============================================
  syncHistory: defineTable({
    buildingId: v.id("buildings"),
    timestamp: v.number(),
    status: v.union(v.literal("success"), v.literal("error"), v.literal("partial")),
    // Resultados de la sincronización
    receiptsNew: v.number(),
    receiptsTotal: v.number(),
    expensesNew: v.number(),
    expensesTotal: v.number(),
    commonExpensesNew: v.number(),
    commonExpensesTotal: v.number(),
    balanceNew: v.boolean(),
    durationSeconds: v.number(),
    errorMessage: v.optional(v.string()),
  }).index("by_building", ["buildingId"])
   .index("by_building_timestamp", ["buildingId", "timestamp"]),

  // ============================================
  // ALERTAS GENERADAS
  // ============================================
  alerts: defineTable({
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
    data: v.optional(v.any()), // Datos adicionales del evento
    read: v.boolean(),
    createdAt: v.number(),
  }).index("by_building", ["buildingId"])
   .index("by_building_read", ["buildingId", "read"])
   .index("by_building_created", ["buildingId", "createdAt"]),

  // ============================================
  // CONTROL DIARIO (para dashboards)
  // ============================================
  dailyControl: defineTable({
    buildingId: v.id("buildings"),
    fecha: v.number(), // Date (YYYY-MM-DD)
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
  }).index("by_building", ["buildingId"])
   .index("by_building_fecha", ["buildingId", "fecha"]),

  // ============================================
  // CONFIGURACIÓN GLOBAL DEL SISTEMA
  // ============================================
  systemConfig: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});
