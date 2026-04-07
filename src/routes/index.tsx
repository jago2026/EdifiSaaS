import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
  head: () => ({ meta: [{ title: 'CondominioSaaS - Gestión Inteligente de Condominios' }] }),
})

function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <span className="font-bold text-xl text-gray-800">CondominioSaaS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-gray-600 hover:text-blue-600 transition">Funcionalidades</a>
            <a href="#how-it-works" className="text-gray-600 hover:text-blue-600 transition">Cómo funciona</a>
            <Link to="/login" className="text-gray-600 hover:text-blue-600 transition">Iniciar Sesión</Link>
            <Link to="/register" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
              Prueba Gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            🚀 Nuevo: Prueba gratis por 30 días
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Gestión Inteligente de Condominios
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Automatiza el control financiero de tu edificio. Integra datos de tu administradora,
            detecta movimientos nuevos y mantén tu contabilidad al día sin esfuerzo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl">
              Comenzar Prueba Gratis
            </Link>
            <Link to="/demo" className="bg-white text-gray-800 px-8 py-4 rounded-xl text-lg font-semibold border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 transition">
              Ver Demo
            </Link>
          </div>
          <p className="text-gray-500 mt-4 text-sm">Sin tarjeta de crédito • Cancela cuando quieras</p>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Todo lo que necesitas para gestionar tu condominio
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="📊"
              title="Control Financiero Automatizado"
              description="Sincroniza automáticamente tus recibos, egresos, gastos y balance desde la administradora. Detecta nuevos movimientos al instante."
            />
            <FeatureCard
              icon="🔔"
              title="Alertas Inteligentes"
              description="Recibe alertas sobre variaciones inusuales en saldos, gastos y egresos. Mantén el control total de tus finanzas."
            />
            <FeatureCard
              icon="📈"
              title="Dashboards en Tiempo Real"
              description="Visualiza el estado financiero de tu edificio con gráficos interactivos y reportes detallados."
            />
            <FeatureCard
              icon="🔐"
              title="Seguridad Garantizada"
              description="Tus datos están protegidos con encriptación de extremo a extremo. Solo tú tienes acceso a la información."
            />
            <FeatureCard
              icon="📱"
              title="Acceso desde cualquier lugar"
              description="Gestiona tu condominio desde cualquier dispositivo. Navega, descarga reportes y toma decisiones informadas."
            />
            <FeatureCard
              icon="🔄"
              title="Sincronización Automática"
              description="El sistema se actualiza automáticamente cada día. No te preocupes por olvidar sincronizar tus datos."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            ¿Cómo funciona?
          </h2>
          <div className="space-y-8">
            <StepCard
              step="1"
              title="Registra tu edificio"
              description="Crea una cuenta para tu condominio en menos de 5 minutos. Añade la información básica del edificio y configura las credenciales de acceso a la administradora."
            />
            <StepCard
              step="2"
              title="Configura la integración"
              description="Conecta tu sistema con la plataforma de tu administradora. Nuestro sistema compatible con múltiples proveedores como La Ideal C.A."
            />
            <StepCard
              step="3"
              title="Automatiza el proceso"
              description="El sistema descarga automáticamente los datos financieros diarios, detecta movimientos nuevos y te mantiene informado en tiempo real."
            />
            <StepCard
              step="4"
              title="Toma el control"
              description="Accede a dashboards detallados, recibe alertas y gestiona el control financiero de tu condominio con total facilidad."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Planes flexibles para cada necesidad
          </h2>
          <p className="text-center text-gray-600 mb-12">Elige el plan que mejor se adapte a tu edificio</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              name="Básico"
              price="$9"
              period="/mes"
              features={[
                'Hasta 50 unidades',
                'Control financiero básico',
                'Alertas por email',
                'Historial de 3 meses',
                'Soporte por email'
              ]}
              popular={false}
            />
            <PricingCard
              name="Profesional"
              price="$29"
              period="/mes"
              features={[
                'Hasta 200 unidades',
                'Control financiero avanzado',
                'Alertas por email y SMS',
                'Historial ilimitado',
                'Dashboards personalizados',
                'Soporte prioritario',
                'Exportación de reportes'
              ]}
              popular={true}
            />
            <PricingCard
              name="Empresarial"
              price="Contactar"
              period=""
              features={[
                'Unidades ilimitadas',
                'Todo incluido',
                'Integración personalizada',
                'API access',
                'Soporte dedicado 24/7',
                'Formación in situ'
              ]}
              popular={false}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para transformar la gestión de tu condominio?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a cientos de edificios que ya están ahorrando tiempo y dinero con CondominioSaaS
          </p>
          <Link to="/register" className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-50 transition shadow-lg">
            Comenzar Prueba Gratis de 30 Días
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">C</span>
                </div>
                <span className="font-bold text-xl">CondominioSaaS</span>
              </div>
              <p className="text-gray-400 text-sm">
                La plataforma líder en gestión financiera de condominios
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">Funcionalidades</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">Cómo funciona</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Precios</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Centro de ayuda</a></li>
                <li><a href="#" className="hover:text-white transition">Documentación</a></li>
                <li><a href="#" className="hover:text-white transition">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Términos de servicio</a></li>
                <li><a href="#" className="hover:text-white transition">Política de privacidad</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            © 2026 CondominioSaaS. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </main>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
        {step}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  )
}

function PricingCard({ name, price, period, features, popular }: { name: string; price: string; period: string; features: string[]; popular: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border-2 ${popular ? 'border-blue-600 bg-blue-50 relative' : 'border-gray-200 bg-white'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
          Más popular
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-600">{period}</span>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-gray-600">
            <span className="text-green-500">✓</span>
            {feature}
          </li>
        ))}
      </ul>
      <Link
        to="/register"
        className={`block text-center py-3 rounded-lg font-semibold transition ${
          popular ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }`}
      >
        Comenzar
      </Link>
    </div>
  )
}
