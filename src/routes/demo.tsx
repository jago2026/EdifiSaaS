import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/demo')({
  component: DemoPage,
  head: () => ({ meta: [{ title: 'Demo - CondominioSaaS' }] }),
})

function DemoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="font-bold text-xl text-gray-800">CondominioSaaS</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login" className="text-gray-600 hover:text-blue-600 transition">Iniciar Sesión</Link>
            <Link to="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Registrarse
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Demo Interactiva
            </h1>
            <p className="text-xl text-gray-600">
              Descubre cómo CondominioSaaS puede transformar la gestión de tu condominio
            </p>
          </div>

          {/* Demo Sections */}
          <div className="space-y-12">
            {/* Dashboard Preview */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard General</h2>
                <span className="text-sm text-gray-500">Vista previa</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                  <div className="text-sm opacity-80 mb-2">Saldo actual</div>
                  <div className="text-2xl font-bold mb-1">$125,840</div>
                  <div className="text-sm opacity-80">↑ +2.5% vs mes anterior</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
                  <div className="text-sm opacity-80 mb-2">Ingresos del mes</div>
                  <div className="text-2xl font-bold mb-1">$45,230</div>
                  <div className="text-sm opacity-80">↑ +5.2% vs mes anterior</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
                  <div className="text-sm opacity-80 mb-2">Egresos del mes</div>
                  <div className="text-2xl font-bold mb-1">$32,150</div>
                  <div className="text-sm opacity-80">↓ -1.8% vs mes anterior</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                  <div className="text-sm opacity-80 mb-2">Alertas activas</div>
                  <div className="text-2xl font-bold mb-1">3</div>
                  <div className="text-sm opacity-80">Requieren atención</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Movimientos recientes</h3>
                  <div className="space-y-3">
                    {[
                      { type: 'in', desc: 'Recibo Apt 5-A', amount: '$450.00', date: 'Hace 2h' },
                      { type: 'out', desc: 'Pago Electricidad', amount: '$1,200.00', date: 'Hace 5h' },
                      { type: 'out', desc: 'Mantenimiento ascensor', amount: '$850.00', date: 'Hace 1d' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg ${item.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.type === 'in' ? '📥' : '📤'}
                          </span>
                          <span className="text-sm text-gray-700">{item.desc}</span>
                        </div>
                        <span className={`font-semibold text-sm ${item.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.type === 'in' ? '+' : '-'}{item.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-4">Alertas activas</h3>
                  <div className="space-y-3">
                    {[
                      { severity: 'warning', title: 'Gasto significativo', msg: '$1,200.00 en electricidad' },
                      { severity: 'info', title: 'Nuevo balance', msg: 'Actualizado hace 5h' },
                      { severity: 'warning', title: 'Variación egresos', msg: '+15% vs mes anterior' },
                    ].map((alert, i) => (
                      <div key={i} className={`p-3 rounded-lg border ${
                        alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          <span>{alert.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{alert.title}</div>
                            <div className="text-gray-600 text-xs">{alert.msg}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Features Highlight */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Características destacadas</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { icon: '🔄', title: 'Sincronización automática', desc: 'El sistema descarga automáticamente tus datos financieros diarios desde la administradora.' },
                  { icon: '🔔', title: 'Alertas inteligentes', desc: 'Recibe notificaciones sobre movimientos nuevos, variaciones inusuales y eventos importantes.' },
                  { icon: '📊', title: 'Dashboards en tiempo real', desc: 'Visualiza el estado financiero de tu edificio con gráficos interactivos y métricas detalladas.' },
                  { icon: '🔐', title: 'Seguridad garantizada', desc: 'Tus datos están protegidos con encriptación de extremo a extremo.' },
                  { icon: '📱', title: 'Acceso móvil', desc: 'Gestiona tu condominio desde cualquier dispositivo, en cualquier momento.' },
                  { icon: '📈', title: 'Reportes detallados', desc: 'Genera reportes financieros, exporta datos y compártelos con la junta de condominio.' },
                ].map((feature, i) => (
                  <div key={i} className="p-4 border rounded-xl hover:shadow-lg transition">
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">
                ¿Listo para comenzar?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Únete a cientos de edificios que ya están simplificando su gestión financiera
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition">
                  Comenzar prueba gratuita
                </Link>
                <Link to="/" className="inline-block border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition">
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
