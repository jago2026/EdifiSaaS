"use node";
import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";

// ============================================
// MUTACIONES INTERNAS
// ============================================

/**
 * Registrar historial de sincronización
 */
export const registerSyncHistory = internalMutation({
  args: {
    buildingId: v.id("buildings"),
    timestamp: v.number(),
    status: v.union(v.literal("success"), v.literal("error"), v.literal("partial")),
    receiptsNew: v.number(),
    receiptsTotal: v.number(),
    expensesNew: v.number(),
    expensesTotal: v.number(),
    commonExpensesNew: v.number(),
    commonExpensesTotal: v.number(),
    balanceNew: v.boolean(),
    durationSeconds: v.number(),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("syncHistory", {
      buildingId: args.buildingId,
      timestamp: args.timestamp,
      status: args.status,
      receiptsNew: args.receiptsNew,
      receiptsTotal: args.receiptsTotal,
      expensesNew: args.expensesNew,
      expensesTotal: args.expensesTotal,
      commonExpensesNew: args.commonExpensesNew,
      commonExpensesTotal: args.commonExpensesTotal,
      balanceNew: args.balanceNew,
      durationSeconds: args.durationSeconds,
      errorMessage: args.errorMessage,
    });
    return null;
  },
});

// ============================================
// ACTIONS (PARA REALIZAR LLAMADAS HTTP)
// ============================================

/**
 * Sincronizar datos de un edificio con su administradora
 * Esta es la función principal que se ejecuta diariamente
 */
export const syncBuilding = internalAction({
  args: {
    buildingId: v.id("buildings"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    console.log(`[SYNC] Iniciando sincronización para edificio: ${args.buildingId}`);

    try {
      // 1. Obtener configuración del edificio
      const adminConfig = await getAdminConfigDirectly(ctx.db, args.buildingId);

      if (!adminConfig) {
        throw new Error("Configuración de administradora no encontrada");
      }

      console.log(`[SYNC] Configuración obtenida para: ${adminConfig.provider}`);

      // 2. Realizar login en la administradora
      const sessionId = await loginToAdmin(adminConfig);
      if (!sessionId) {
        throw new Error("Error al iniciar sesión en la administradora");
      }

      console.log(`[SYNC] Login exitoso`);

      // 3. Descargar datos de todas las secciones
      const [receipts, expenses, commonExpenses, balance] = await Promise.all([
        downloadReceipts(adminConfig, sessionId),
        downloadExpenses(adminConfig, sessionId),
        downloadCommonExpenses(adminConfig, sessionId),
        downloadBalance(adminConfig, sessionId),
      ]);

      console.log(`[SYNC] Datos descargados:`, {
        receipts: receipts.length,
        expenses: expenses.length,
        commonExpenses: commonExpenses.length,
        balance: balance ? 1 : 0,
      });

      // 4. Procesar y guardar datos (con detección de nuevos movimientos)
      const receiptsResult = await ctx.runMutation(
        "movements:upsertReceipts",
        { buildingId: args.buildingId, receipts }
      );

      const expensesResult = await ctx.runMutation(
        "movements:upsertExpenses",
        { buildingId: args.buildingId, expenses }
      );

      const commonExpensesResult = await ctx.runMutation(
        "movements:upsertCommonExpenses",
        { buildingId: args.buildingId, commonExpenses }
      );

      const balanceNew = balance
        ? await ctx.runMutation("movements:upsertBalance", {
            buildingId: args.buildingId,
            balance,
          })
        : false;

      console.log(`[SYNC] Resultado de procesamiento:`, {
        receiptsNew: receiptsResult.new,
        expensesNew: expensesResult.new,
        commonExpensesNew: commonExpensesResult.new,
        balanceNew,
      });

      // 5. Actualizar estado de sincronización
      await updateSyncStatus(ctx.db, args.buildingId, "success", Date.now());

      // 6. Generar alertas si hay nuevos movimientos significativos
      await generateAlertsForSync(ctx, {
        buildingId: args.buildingId,
        receiptsNew: receiptsResult.new,
        expensesNew: expensesResult.new,
        commonExpensesNew: commonExpensesResult.new,
        balanceNew,
      });

      // 7. Registrar historial
      const duration = (Date.now() - startTime) / 1000;
      await ctx.runMutation("sync:registerSyncHistory", {
        buildingId: args.buildingId,
        timestamp: Date.now(),
        status: "success",
        receiptsNew: receiptsResult.new,
        receiptsTotal: receiptsResult.total,
        expensesNew: expensesResult.new,
        expensesTotal: expensesResult.total,
        commonExpensesNew: commonExpensesResult.new,
        commonExpensesTotal: commonExpensesResult.total,
        balanceNew,
        durationSeconds: duration,
      });

      console.log(`[SYNC] Sincronización completada en ${duration.toFixed(2)}s`);

    } catch (error) {
      console.error(`[SYNC] Error en sincronización:`, error);

      // Actualizar estado de sincronización con error
      await updateSyncStatus(ctx.db, args.buildingId, "error", Date.now());

      // Registrar historial con error
      const duration = (Date.now() - startTime) / 1000;
      await ctx.runMutation("sync:registerSyncHistory", {
        buildingId: args.buildingId,
        timestamp: Date.now(),
        status: "error",
        receiptsNew: 0,
        receiptsTotal: 0,
        expensesNew: 0,
        expensesTotal: 0,
        commonExpensesNew: 0,
        commonExpensesTotal: 0,
        balanceNew: false,
        durationSeconds: duration,
        errorMessage: error instanceof Error ? error.message : "Error desconocido",
      });

      // Crear alerta de error de sincronización
      await ctx.runMutation("alerts:create", {
        buildingId: args.buildingId,
        type: "sync_error",
        severity: "error",
        title: "Error de sincronización",
        message: error instanceof Error ? error.message : "Error desconocido",
        read: false,
        createdAt: Date.now(),
      });
    }

    return null;
  },
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Obtener configuración de administradora directamente
 */
async function getAdminConfigDirectly(db: any, buildingId: string) {
  const building = await db.get(buildingId);
  if (!building || !building.adminConfig) {
    return null;
  }
  return building.adminConfig;
}

/**
 * Actualizar estado de sincronización
 */
async function updateSyncStatus(db: any, buildingId: string, status: "success" | "error" | "pending", lastSyncAt: number) {
  await db.patch(buildingId, {
    lastSyncStatus: status,
    lastSyncAt: lastSyncAt,
  });
}

/**
 * Generar alertas después de una sincronización
 */
async function generateAlertsForSync(ctx: any, args: any) {
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
}

/**
 * Realizar login en la administradora
 */
async function loginToAdmin(config: any): Promise<string | null> {
  try {
    const payload = `contrasena=${encodeURIComponent(config.password)}&contrasena11=${encodeURIComponent(config.password)}&B1=Entrar`;
    const response = await fetch(config.urlLogin, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0",
        "Referer": "https://admlaideal.com.ve/indice.htm",
      },
      body: payload,
    });

    const setCookie = response.headers.get("set-cookie");
    if (!setCookie) return null;

    const match = setCookie.match(/PHPSESSID=([^;]+)/);
    return match ? match[1] : null;

  } catch (error) {
    console.error("[LOGIN] Error:", error);
    return null;
  }
}

/**
 * Descargar recibos (ingresos)
 */
async function downloadReceipts(config: any, sessionId: string): Promise<any[]> {
  try {
    const response = await fetch(config.urlRecibos, {
      method: "GET",
      headers: {
        "Cookie": `PHPSESSID=${sessionId}`,
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = await response.text();
    return parseReceiptsFromHTML(html);

  } catch (error) {
    console.error("[RECEIPTS] Error:", error);
    return [];
  }
}

/**
 * Descargar egresos
 */
async function downloadExpenses(config: any, sessionId: string): Promise<any[]> {
  try {
    const response = await fetch(config.urlEgresos, {
      method: "GET",
      headers: {
        "Cookie": `PHPSESSID=${sessionId}`,
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = await response.text();
    return parseExpensesFromHTML(html);

  } catch (error) {
    console.error("[EXPENSES] Error:", error);
    return [];
  }
}

/**
 * Descargar gastos comunes
 */
async function downloadCommonExpenses(config: any, sessionId: string): Promise<any[]> {
  try {
    const response = await fetch(config.urlGastos, {
      method: "GET",
      headers: {
        "Cookie": `PHPSESSID=${sessionId}`,
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = await response.text();
    return parseCommonExpensesFromHTML(html);

  } catch (error) {
    console.error("[COMMON EXPENSES] Error:", error);
    return [];
  }
}

/**
 * Descargar balance
 */
async function downloadBalance(config: any, sessionId: string): Promise<any | null> {
  try {
    const response = await fetch(config.urlBalance, {
      method: "GET",
      headers: {
        "Cookie": `PHPSESSID=${sessionId}`,
        "User-Agent": "Mozilla/5.0",
      },
    });

    const html = await response.text();
    return parseBalanceFromHTML(html);

  } catch (error) {
    console.error("[BALANCE] Error:", error);
    return null;
  }
}

// ============================================
// PARSERS (EXTRAER DATOS DE HTML)
// ============================================

/**
 * Parsear recibos del HTML
 */
function parseReceiptsFromHTML(html: string): any[] {
  // TODO: Implementar parser específico para el HTML de la administradora
  // Este es un placeholder que debería extraer los datos de las tablas HTML
  const receipts: any[] = [];

  // Ejemplo de lo que se debería hacer:
  // 1. Buscar la tabla de recibos
  // 2. Iterar por cada fila
  // 3. Extraer fecha, unidad, propietario, monto, concepto
  // 4. Parsear montos (ej: "Bs. 1.234,56" -> 1234.56)
  // 5. Parsear fechas (ej: "01/01/2026" -> timestamp)

  // Por ahora, retornamos un array vacío
  // En producción, esto debe implementarse correctamente
  
  return receipts;
}

/**
 * Parsear egresos del HTML
 */
function parseExpensesFromHTML(html: string): any[] {
  // TODO: Implementar parser específico
  const expenses: any[] = [];
  return expenses;
}

/**
 * Parsear gastos comunes del HTML
 */
function parseCommonExpensesFromHTML(html: string): any[] {
  // TODO: Implementar parser específico
  const commonExpenses: any[] = [];
  return commonExpenses;
}

/**
 * Parsear balance del HTML
 */
function parseBalanceFromHTML(html: string): any | null {
  // TODO: Implementar parser específico
  return null;
}
