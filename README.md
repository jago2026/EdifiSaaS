# CondominioSaaS - Sistema de Gestión Financiera para Condominios

Sistema SaaS completo para la gestión financiera automatizada de condominios, con integración a administradoras externas.

## 🚀 Características Principales

- **Sincronización Automática**: Descarga automática de datos financieros desde la administradora
- **Detección Inteligente de Movimientos**: Sistema mejorado que detecta movimientos nuevos usando hashing (no requiere comparación de históricos)
- **Alertas en Tiempo Real**: Notificaciones sobre variaciones inusuales, gastos significativos y eventos importantes
- **Dashboards Interactivos**: Visualización del estado financiero con gráficos y métricas
- **Multi-Edificio**: Gestión de múltiples edificios desde una sola cuenta
- **Prueba Gratuita**: 30 días de prueba sin compromiso

## 🏗️ Arquitectura del Sistema

### Backend (Convex)

**Base de datos y esquema:**
- `users`: Usuarios y suscripciones
- `buildings`: Edificios y su configuración
- `receipts`: Recibos (ingresos)
- `expenses`: Egresos
- `commonExpenses`: Gastos comunes
- `balance`: Balance financiero
- `syncHistory`: Historial de sincronizaciones
- `alerts`: Alertas generadas
- `dailyControl`: Control diario para dashboards

**Módulos principales:**

1. **`buildings.ts`**: Gestión de edificios
   - Crear, actualizar y desactivar edificios
   - Configuración de integración con administradora
   - Configuración de alertas personalizadas

2. **`movements.ts`**: Sistema de detección de movimientos
   - **Innovación clave**: Uso de hashes SHA-256 para detectar movimientos nuevos
   - Cada movimiento tiene un hash único basado en sus datos (fecha, descripción, monto, etc.)
   - No requiere comparación de históricos - simplemente verifica si el hash existe
   - Marca automáticamente movimientos como "nuevos" para revisión

3. **`sync.ts`**: Sincronización con administradora
   - Login automático en la plataforma de la administradora
   - Descarga de recibos, egresos, gastos y balance
   - Procesamiento con detección de movimientos nuevos
   - Registro de historial de sincronizaciones

4. **`alerts.ts`**: Sistema de alertas
   - Alertas por nuevos movimientos
   - Alertas por variaciones significativas en saldos
   - Alertas por errores de sincronización
   - Gestión de lectura de alertas

5. **`balance.ts`**: Balance y control diario
   - Obtener balance actual e histórico
   - Calcular y registrar control diario
   - Comparaciones con periodos anteriores

### Frontend (React + TanStack Start + Tailwind CSS)

**Páginas:**

1. **`/` (Landing)**: Página principal con
   - Hero section con CTA
   - Características del producto
   - Cómo funciona
   - Planes y precios
   - Sección de prueba gratuita

2. **`/register`**: Registro en 3 pasos
   - Paso 1: Datos personales
   - Paso 2: Datos del edificio
   - Paso 3: Configuración de integración con administradora

3. **`/login`**: Inicio de sesión

4. **`/dashboard`**: Panel principal con
   - Selector de edificio
   - Métricas principales (saldo, ingresos, egresos, alertas)
   - Lista de movimientos nuevos
   - Alertas recientes
   - Acciones rápidas (sincronizar, exportar)

5. **`/demo`**: Demo interactiva del sistema

## 🔧 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de Convex (backend)

### Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd condominio-saas

# Instalar dependencias
npm install

# Iniciar backend de Convex (en una terminal)
npm run dev

# Iniciar servidor de desarrollo (en otra terminal)
npm run dev:web
```

### Configuración

Variables de entorno necesarias:

```bash
# Convex URL (generado automáticamente por Convex dev)
VITE_CONVEX_URL=<tu-convex-url>
```

## 📊 Sistema Mejorado de Detección de Movimientos

### Problema Original (Google Apps Script)

El método original requería:
- Mantener logs históricos de todos los movimientos
- Comparar el día anterior con el día actual
- Analizar diferencias para detectar movimientos nuevos
- Proceso lento y complejo

### Solución Implementada (CondominioSaaS)

**Sistema basado en Hashing:**

1. **Generación de Hash Único:**
   ```typescript
   function generateHash(tipo, fecha, descripcion, monto, camposExtras) {
     const data = `${tipo}|${fecha}|${descripcion}|${monto}|${JSON.stringify(camposExtras)}`;
     return crypto.createHash("sha256").update(data).digest("hex");
   }
   ```

2. **Verificación de Existencia:**
   ```typescript
   const existing = await ctx.db
     .query("receipts")
     .withIndex("by_hash", (q) => q.eq("hash", hash))
     .first();
   ```

3. **Marcado como Nuevo:**
   ```typescript
   if (!existing) {
     await ctx.db.insert("receipts", {
       ...datos,
       hash: hash,
       isNew: true,
       detectedAt: Date.now()
     });
   }
   ```

**Ventajas:**
- ✅ No requiere comparación de históricos
- ✅ Búsqueda instantánea por índice
- ✅ Escalable a millones de registros
- ✅ Detección exacta sin falsos positivos
- ✅ Proceso O(1) vs O(n) del método anterior

## 🔄 Flujo de Sincronización

1. **Programación:**
   - La sincronización se ejecuta automáticamente cada 24 horas
   - Puede activarse manualmente desde el dashboard

2. **Proceso:**
   ```
   Login en administradora
   ↓
   Descargar recibos
   ↓
   Descargar egresos
   ↓
   Descargar gastos
   ↓
   Descargar balance
   ↓
   Procesar y detectar nuevos movimientos (hashing)
   ↓
   Generar alertas
   ↓
   Registrar historial
   ```

3. **Resultado:**
   - Movimientos nuevos marcados para revisión
   - Alertas generadas automáticamente
   - Dashboards actualizados
   - Historial de sincronización registrado

## 🎨 Stack Tecnológico

### Backend
- **Convex**: Base de datos real-time y serverless
- **Convex Auth**: Sistema de autenticación
- **Crypto**: Generación de hashes SHA-256

### Frontend
- **React**: Framework UI
- **TanStack Start**: Framework de routing
- **TanStack Query**: Gestión de queries y caché
- **Tailwind CSS v4**: Estilos
- **Convex React Query**: Integración de Convex con React Query

### Deploy
- **Vercel**: Hosting del frontend
- **Convex**: Backend (automático)

## 📁 Estructura del Proyecto

```
condominio-saas/
├── convex/
│   ├── schema.ts              # Esquema de base de datos
│   ├── buildings.ts           # Gestión de edificios
│   ├── movements.ts           # Sistema de movimientos (hashing)
│   ├── sync.ts                # Sincronización con administradora
│   ├── alerts.ts              # Sistema de alertas
│   └── balance.ts             # Balance y control diario
├── src/
│   ├── routes/
│   │   ├── index.tsx          # Landing page
│   │   ├── register.tsx       # Registro
│   │   ├── login.tsx          # Login
│   │   ├── dashboard.tsx      # Dashboard principal
│   │   └── demo.tsx           # Demo interactiva
│   ├── router.tsx             # Configuración de router
│   └── styles/
│       └── app.css            # Estilos globales
├── public/                    # Assets estáticos
└── package.json               # Dependencias
```

## 🚀 Roadmap de Desarrollo

### Próximas funcionalidades a implementar:

1. **Autenticación Completa**
   - Implementar Convex Auth con email
   - Recuperación de contraseña
   - Multi-factor authentication

2. **Sistema de Pagos**
   - Integración con Stripe
   - Gestión de suscripciones
   - Facturación automática

3. **Módulos Adicionales**
   - Gestión de residentes
   - Comunicaciones (avisos, circulares)
   - Reservas de espacios comunes
   - Gestión de quejas y solicitudes

4. **Reports Avanzados**
   - Reportes personalizados
   - Exportación a PDF/Excel
   - Comparativas entre periodos

5. **Integración con otras Administradoras**
   - Expandir compatibilidad
   - Sistema de plugins

## 📝 Notas Importantes

### Aún por Implementar:

1. **Parsers HTML**: Las funciones `parseReceiptsFromHTML`, `parseExpensesFromHTML`, etc. deben implementarse para extraer los datos específicos de la plataforma de la administradora.

2. **Autenticación Real**: Actualmente el sistema usa placeholders para autenticación. Debe implementarse Convex Auth completo.

3. **Encriptación de Contraseñas**: Las contraseñas de las administradoras deben encriptarse antes de guardarlas en la base de datos.

4. **Sistema de Cron Jobs**: La sincronización automática debe configurarse con Convex cron jobs.

5. **Validaciones Frontend**: Agregar validaciones más robustas en los formularios.

## 🤝 Contribuciones

Este proyecto es un fork del sistema original en Google Apps Script (EdifiSaaS) completamente modernizado para SaaS.

## 📄 Licencia

Copyright 2026 - Todos los derechos reservados

---

**Desarrollado con ❤️ para simplificar la gestión de condominios**
