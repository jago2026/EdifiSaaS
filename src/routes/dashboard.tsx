import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
  head: () => ({ meta: [{ title: 'Dashboard - CondominioSaaS' }] }),
})

function Dashboard() {
  const navigate = useNavigate()

  // TODO: Obtener el usuario autenticado
  const userId = "user123" as any

  // Cargar datos del dashboard
  const { data: buildings } = useSuspenseQuery(
    convexQuery(api.buildings.list, { ownerId: userId })
  )

  // Usar el primer edificio si hay uno
  const selectedBuildingId = buildings.length > 0 ? buildings[0]._id : null

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">C</span>
              </div>
              <span className="font-bold text-xl text-gray-800 hidden sm:block">CondominioSaaS</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-4">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition">Dashboard</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition">Movimientos</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition">Balance</a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition">Alertas</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-600 hover:text-blue-600 transition relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">JP</span>
              </div>
              <span className="text-gray-700 hidden sm:block">Juan Pérez</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">
              Resumen general del estado financiero de tu edificio
            </p>
          </div>
          
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sincronizar ahora
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar reporte
            </button>
          </div>
        </div>

        {/* Building Selector */}
        {buildings.length > 0 && (
          <div className="bg-white rounded-xl p-4 mb-8 border">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar edificio
            </label>
            <select 
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {buildings.map((building) => (
                <option key={building._id} value={building._id}>
                  {building.name} - {building.address}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Empty State */}
        {buildings.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🏢</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No tienes edificios registrados
            </h2>
            <p className="text-gray-600 mb-6">
              Registra tu primer edificio para comenzar a gestionarlo
            </p>
            <button 
              onClick={() => navigate({ to: '/register' })}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Registrar edificio
            </button>
          </div>
        )}

        {/* Dashboard Content (when building is selected) */}
        {selectedBuildingId && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Saldo actual"
                value="$125,840"
                change="+2.5%"
                positive
                icon="💰"
              />
              <StatCard
                title="Ingresos del mes"
                value="$45,230"
                change="+5.2%"
                positive
                icon="📈"
              />
              <StatCard
                title="Egresos del mes"
                value="$32,150"
                change="-1.8%"
                positive
                icon="📉"
              />
              <StatCard
                title="Alertas activas"
                value="3"
                change="-2"
                positive={false}
                icon="🔔"
              />
            </div>

            {/* New Movements Section */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Nuevos movimientos detectados
                </h2>
                <button className="text-blue-600 hover:underline text-sm">
                  Ver todos
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { type: 'receipt', description: 'Recibo recibido - Apt 5-A', amount: '$450.00', date: 'Hace 2 horas' },
                  { type: 'expense', description: 'Pago a Electricidad de Venezuela', amount: '$1,200.00', date: 'Hace 5 horas' },
                  { type: 'expense', description: 'Mantenimiento de ascensor', amount: '$850.00', date: 'Hace 1 día' },
                ].map((movement, index) => (
                  <MovementItem key={index} {...movement} />
                ))}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Alertas recientes
                </h2>
                <button className="text-blue-600 hover:underline text-sm">
                  Ver todas
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { severity: 'warning', title: 'Gasto significativo', message: 'Se registró un gasto de $1,200.00, superior al promedio', time: 'Hace 2 horas' },
                  { severity: 'info', title: 'Nuevo balance', message: 'El balance del edificio se ha actualizado', time: 'Hace 5 horas' },
                  { severity: 'warning', title: 'Variación en egresos', message: 'Los egresos han aumentado un 15% respecto al mes anterior', time: 'Hace 1 día' },
                ].map((alert, index) => (
                  <AlertItem key={index} {...alert} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function StatCard({ title, value, change, positive, icon }: { title: string; value: string; change: string; positive: boolean; icon: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border hover:shadow-lg transition">
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl">{icon}</div>
        <span className={`text-sm font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {positive ? '↑' : '↓'} {change}
        </span>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function MovementItem({ type, description, amount, date }: { type: string; description: string; amount: string; date: string }) {
  const isReceipt = type === 'receipt'
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isReceipt ? 'bg-green-100' : 'bg-red-100'}`}>
          <span className={isReceipt ? 'text-green-600' : 'text-red-600'}>
            {isReceipt ? '📥' : '📤'}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">{description}</p>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
      </div>
      <span className={`font-semibold ${isReceipt ? 'text-green-600' : 'text-red-600'}`}>
        {isReceipt ? '+' : '-'}{amount}
      </span>
    </div>
  )
}

function AlertItem({ severity, title, message, time }: { severity: string; title: string; message: string; time: string }) {
  const severityColors = {
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
    critical: 'bg-red-100 border-red-300',
  }

  const severityIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  }

  return (
    <div className={`p-4 rounded-lg border ${severityColors[severity as keyof typeof severityColors]}`}>
      <div className="flex items-start gap-3">
        <div className="text-xl">{severityIcons[severity as keyof typeof severityIcons]}</div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
    </div>
  )
}
