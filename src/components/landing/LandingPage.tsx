import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Scale,
  ShoppingBag,
  Wine,
  Coffee,
  Apple,
  ExternalLink,
  ChevronDown,
  Layers,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { ProductKit } from '../../types';
import { formatSimpleCOP, formatGrams } from '../../utils/format';

interface LandingPageProps {
  kits: ProductKit[];
  onGoToLogin: () => void;
  onGoToErp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  kits,
  onGoToLogin,
  onGoToErp,
}) => {
  const [cart, setCart] = useState<{ [kitId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSent, setOrderSent] = useState(false);
  const [b2bName, setB2bName] = useState('');
  const [b2bEmail, setB2bEmail] = useState('');
  const [b2bPhone, setB2bPhone] = useState('');
  const [b2bMessage, setB2bMessage] = useState('');
  const [b2bSuccess, setB2bSuccess] = useState(false);

  const totalCartItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalCartCOP = Object.entries(cart).reduce((acc, [kitId, qty]) => {
    const kit = kits.find((k) => k.id === kitId);
    return acc + (kit ? kit.pvpCop * qty : 0);
  }, 0);

  const handleAddToCart = (kitId: string) => {
    setCart((prev) => ({
      ...prev,
      [kitId]: (prev[kitId] || 0) + 1,
    }));
    setIsCartOpen(true);
  };

  const handleB2bSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setB2bSuccess(true);
    setTimeout(() => {
      setB2bSuccess(false);
      setB2bName('');
      setB2bEmail('');
      setB2bPhone('');
      setB2bMessage('');
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#181C1F] flex flex-col font-sans selection:bg-[#C86D2C] selection:text-white">
      {/* Top Notification Bar */}
      <div className="bg-[#181C1F] text-[#F8F7F4] py-1.5 px-4 text-center text-xs font-medium tracking-wide flex items-center justify-center gap-3">
        <span className="flex h-2 w-2 rounded-full bg-[#EA580C]"></span>
        <span>
          Envíos a toda Colombia · Deshidratación artesanal controlada en Medellín · 100% Fruta Natural
        </span>
        <button
          onClick={onGoToErp}
          className="underline hover:text-[#C86D2C] font-mono text-[11px] cursor-pointer ml-2 hidden sm:inline"
        >
          [Acceso a Planta ERP]
        </button>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5E2DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <Logo size="md" />

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-[#475569]">
            <a href="#kits" className="hover:text-[#C86D2C] transition-colors">
              Nuestros Kits
            </a>
            <a href="#proceso" className="hover:text-[#C86D2C] transition-colors">
              Proceso & Mermas
            </a>
            <a href="#aplicaciones" className="hover:text-[#C86D2C] transition-colors">
              Coctelería & Infusiones
            </a>
            <a href="#mayoristas" className="hover:text-[#C86D2C] transition-colors">
              Mayoristas (B2B)
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 rounded-lg border border-[#E5E2DC] hover:bg-[#FAF8F5] text-[#181C1F] transition-colors cursor-pointer"
              title="Ver pedido"
            >
              <ShoppingBag className="h-4 w-4" />
              {totalCartItems > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#C86D2C] text-[#FFFFFF] text-[10px] font-mono font-bold flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </button>

            {/* Login CTA */}
            <button
              onClick={onGoToLogin}
              className="px-3.5 py-1.5 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] hover:bg-[#F8FAFC] text-xs font-semibold text-[#181C1F] transition-colors cursor-pointer"
            >
              Iniciar Sesión
            </button>

            {/* Direct ERP Access */}
            <button
              onClick={onGoToErp}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#944601] hover:bg-[#783801] text-[#FFFFFF] text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Entrar al Sistema</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-[#E5E2DC] bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF7E6] border border-[#FED7AA] text-xs font-semibold text-[#9A3412]">
                <Sparkles className="h-3.5 w-3.5 text-[#C86D2C]" />
                <span>FRUTA DESHIDRATADA ARTESANAL CON IDENTIDAD DE ORIGEN</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading text-[#181C1F] tracking-tight leading-[1.1]">
                Concentramos la esencia natural de la fruta colombiana.
              </h1>

              <p className="text-sm sm:text-base text-[#64748B] leading-relaxed max-w-xl">
                Kits botánicos premium dosificados para <strong>infusiones aromáticas</strong>, <strong>coctelería de autor</strong> y <strong>snacks crujientes</strong>. Deshidratamos a baja temperatura y flujo laminar controlado para preservar el 100% de los nutrientes, aromas y azúcares propios de la cosecha.
              </p>

              {/* Value Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="p-3 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg text-center">
                  <span className="block font-bold text-[#181C1F]">100% Natural</span>
                  <span className="text-[11px] text-[#64748B]">Sin azúcar ni conservantes</span>
                </div>
                <div className="p-3 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg text-center">
                  <span className="block font-bold text-[#181C1F]">Origen Tolima & Santander</span>
                  <span className="text-[11px] text-[#64748B]">Cosechas directas de campo</span>
                </div>
                <div className="p-3 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg text-center">
                  <span className="block font-bold text-[#181C1F]">Deshidratación Lenta</span>
                  <span className="text-[11px] text-[#64748B]">Túnel a 55°C por 36h</span>
                </div>
                <div className="p-3 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg text-center">
                  <span className="block font-bold text-[#181C1F]">Doypack Kraft</span>
                  <span className="text-[11px] text-[#64748B]">Cierre hermético ziplock</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-3">
                <a
                  href="#kits"
                  className="px-6 py-3 rounded-lg bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] text-xs font-bold uppercase tracking-wider shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Conocer Nuestros Kits</span>
                </a>

                <button
                  onClick={onGoToErp}
                  className="px-5 py-3 rounded-lg bg-[#FFFFFF] border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#1E293B] text-xs font-semibold shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Flame className="h-4 w-4 text-[#C86D2C]" />
                  <span>Plataforma de Control Interno (ERP)</span>
                </button>
              </div>
            </div>

            {/* Visual Hero Art Column */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#FFFFFF] aspect-4/3 sm:aspect-square bg-[#E5E2DC]">
                <img
                  src="https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=1000&q=80"
                  alt="Kits de frutas deshidratadas Fruit Desert"
                  className="w-full h-full object-cover"
                />

                {/* Floating linocut logo stamp */}
                <div className="absolute top-4 left-4 p-3 bg-[#FFFFFF]/90 backdrop-blur-md rounded-xl border border-[#E5E2DC] shadow-md flex items-center gap-3">
                  <Logo size="sm" showSubtitle={false} />
                  <div>
                    <div className="text-[11px] font-bold text-[#181C1F]">FRUIT DESERT</div>
                    <div className="text-[9px] font-mono text-[#944601]">infusions • cocktails • snacks</div>
                  </div>
                </div>

                {/* Floating Quality Callout */}
                <div className="absolute bottom-4 right-4 p-3.5 bg-[#181C1F]/95 backdrop-blur-md text-[#FFFFFF] rounded-xl border border-[#333] shadow-lg max-w-[210px]">
                  <div className="text-[10px] font-mono uppercase text-[#FDE68A] font-bold">
                    CÁLCULO DE MERMA EXACTA
                  </div>
                  <div className="text-sm font-bold font-mono mt-0.5">
                    10 kg fresca → 1.36 kg seca
                  </div>
                  <div className="text-[10px] text-[#CBD5E1] mt-1">
                    Cero desperdicio, máxima concentración botánica.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Kits Section */}
      <section id="kits" className="py-16 md:py-24 border-b border-[#E5E2DC] bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#944601] font-bold">
              CATÁLOGO DE PRESENTACIONES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-[#181C1F]">
              Kits Formulados con Escandallo Industrial
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Cada kit cuenta con una receta exacta en gramos para garantizar equilibrio en taza, copa o merienda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kits.map((kit) => (
              <div
                key={kit.id}
                className="bg-[#FFFFFF] rounded-xl border border-[#E5E2DC] overflow-hidden shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-4/3 bg-[#F1F5F9] overflow-hidden">
                    <img
                      src={kit.imageUrl}
                      alt={kit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-[#181C1F]/80 backdrop-blur-xs text-[#FFFFFF] text-[10px] font-mono font-bold">
                      {kit.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-heading font-bold text-base text-[#181C1F]">
                        {kit.name}
                      </h3>
                      <span className="font-mono text-xs text-[#64748B]">
                        {formatGrams(kit.netWeightGrams)}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-[#944601] font-semibold mb-2">
                      {kit.presentation}
                    </p>

                    <p className="text-xs text-[#64748B] line-clamp-3 mb-3 leading-relaxed">
                      {kit.description}
                    </p>

                    {/* BOM ingredients tag */}
                    <div className="p-2 bg-[#FAF8F5] rounded border border-[#E5E2DC] text-[11px] font-mono space-y-0.5 mb-2">
                      <span className="text-[10px] uppercase font-bold text-[#78716C] block">
                        RECETA EXACTA (BOM):
                      </span>
                      {kit.recipe.map((r) => (
                        <div key={r.id} className="text-[#475569]">
                          • {r.dehydratedFruitName.replace(' Deshidratado', '').replace(' Deshidratada', '')}: <strong>{r.gramsNeeded}g</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-[#F1F5F9] flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-[10px] font-mono text-[#64748B] block uppercase">
                      PRECIO OFICIAL
                    </span>
                    <span className="font-mono font-bold text-lg text-[#181C1F]">
                      {formatSimpleCOP(kit.pvpCop)} COP
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(kit.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Drying & Merma Process Section */}
      <section id="proceso" className="py-16 md:py-24 border-b border-[#E5E2DC] bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#944601] font-bold">
              INGENIERÍA & AGROINDUSTRIA
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-[#181C1F]">
              El Proceso de Deshidratación y Control de Mermas
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Trazabilidad transparente desde el árbol hasta el empaque al vacío en bolsas kraft doypack.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs space-y-3">
              <div className="h-9 w-9 rounded-lg bg-[#FEF7E6] text-[#944601] font-mono font-bold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="font-heading font-bold text-sm text-[#181C1F]">
                Cosecha de Origen Seleccionada
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Compramos directamente a productores en Tolima (Mango Tommy 14° Brix), Santander (Piña Gold MD2), Facatativá (Fresas) y Urabá (Banano).
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs space-y-3">
              <div className="h-9 w-9 rounded-lg bg-[#FEF7E6] text-[#944601] font-mono font-bold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="font-heading font-bold text-sm text-[#181C1F]">
                Corte Calibrado a 4 mm
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Lavado, sanitización e higienización. Laminado con grosor milimétrico uniforme para garantizar secado parejo en bandejas de acero quirúrgico.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs space-y-3">
              <div className="h-9 w-9 rounded-lg bg-[#FEF7E6] text-[#944601] font-mono font-bold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="font-heading font-bold text-sm text-[#181C1F]">
                Túnel de Secado a 58°C
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Secado térmico por convección forzada continua entre 36 y 48 horas. Se evacúa la merma hídrica (76% a 91%) conservando pectina y aroma.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl shadow-2xs space-y-3">
              <div className="h-9 w-9 rounded-lg bg-[#FEF7E6] text-[#944601] font-mono font-bold flex items-center justify-center text-sm">
                04
              </div>
              <h3 className="font-heading font-bold text-sm text-[#181C1F]">
                Escandallo & Sellado Doypack
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Pesaje en báscula digital según la receta BOM del kit, adición de absorbente de humedad apto para alimentos y sellado hermético con termoselladora.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Applications Section */}
      <section id="aplicaciones" className="py-16 md:py-24 border-b border-[#E5E2DC] bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#944601] font-bold">
              VERSATILIDAD BOTÁNICA
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading text-[#181C1F]">
              Tres Líneas de Experiencia Sensorial
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-[#FAF8F5] border border-[#E5E2DC] rounded-2xl space-y-4">
              <div className="p-3 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl inline-block text-[#944601]">
                <Coffee className="h-6 w-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#181C1F]">
                Infusiones Botánicas & Tés
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Vierte agua caliente a 85°C sobre los kits <em>Berry & Sweet</em> o <em>Detox Green</em>. Las rodajas deshidratadas liberan notas frutales y coloración natural en minutos.
              </p>
            </div>

            <div className="p-8 bg-[#FAF8F5] border border-[#E5E2DC] rounded-2xl space-y-4">
              <div className="p-3 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl inline-block text-[#944601]">
                <Wine className="h-6 w-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#181C1F]">
                Coctelería de Autor & Gin Tonics
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Diseñado para mixólogos en hoteles y bares. Las rodajas de piña gold, mango tolimense y manzana aportan aroma balsámico sin aguar el cóctel ni descomponerse rápidamente.
              </p>
            </div>

            <div className="p-8 bg-[#FAF8F5] border border-[#E5E2DC] rounded-2xl space-y-4">
              <div className="p-3 bg-[#FFFFFF] border border-[#E5E2DC] rounded-xl inline-block text-[#944601]">
                <Apple className="h-6 w-6" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#181C1F]">
                Snacks Saludables On-The-Go
              </h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Listos para comer directo de la bolsa kraft. Gran fuente de fibra dietética, minerales y antioxidantes para deportistas, senderismo o la oficina.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* B2B Wholesale Contact Section */}
      <section id="mayoristas" className="py-16 md:py-24 border-b border-[#E5E2DC] bg-[#FAF8F5]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FFFFFF] border border-[#E5E2DC] rounded-2xl p-8 sm:p-12 shadow-md">
            <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#944601] font-bold">
                CANAL MAYORISTA & MARCAS PRIVADAS
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading text-[#181C1F]">
                ¿Tienes un Bar, Tienda Saludable o Marca de Alimentos?
              </h2>
              <p className="text-xs text-[#64748B]">
                Ofrecemos precios mayoristas por volumen, maquila de deshidratación en nuestros túneles y formulación de recetas a la medida.
              </p>
            </div>

            {b2bSuccess && (
              <div className="mb-6 p-4 bg-[#EAF5EB] border border-[#CDE6CF] rounded-xl text-xs text-[#2E6930] flex items-center gap-3 font-medium">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>¡Mensaje recibido! Nuestro departamento comercial de Medellín te contactará hoy mismo.</span>
              </div>
            )}

            <form onSubmit={handleB2bSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Nombre o Empresa *
                  </label>
                  <input
                    type="text"
                    value={b2bName}
                    onChange={(e) => setB2bName(e.target.value)}
                    placeholder="Ej: Café & Botanics Bar"
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-2 focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    value={b2bEmail}
                    onChange={(e) => setB2bEmail(e.target.value)}
                    placeholder="compras@tuempresa.com"
                    className="w-full rounded-lg border border-[#D5D1C8] px-3 py-2 focus:border-[#C86D2C] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="text"
                  value={b2bPhone}
                  onChange={(e) => setB2bPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                  className="w-full rounded-lg border border-[#D5D1C8] px-3 py-2 font-mono focus:border-[#C86D2C] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[#181C1F] font-semibold mb-1">
                  ¿Qué volumen o tipo de kits requieres?
                </label>
                <textarea
                  rows={3}
                  value={b2bMessage}
                  onChange={(e) => setB2bMessage(e.target.value)}
                  placeholder="Detalla si buscas kits al por mayor (50+ unidades), fruta deshidratada a granel (kg) o servicio de deshidratación..."
                  className="w-full rounded-lg border border-[#D5D1C8] px-3 py-2 focus:border-[#C86D2C] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-[#944601] hover:bg-[#783801] text-[#FFFFFF] font-bold text-xs shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" />
                <span>Solicitar Cotización Mayorista</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#181C1F]/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FFFFFF] h-full shadow-2xl flex flex-col justify-between p-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E2DC]">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-[#C86D2C]" />
                  <h3 className="font-heading font-bold text-base text-[#181C1F]">
                    Tu Pedido Fruit Desert
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#181C1F]"
                >
                  Cerrar
                </button>
              </div>

              {totalCartItems === 0 ? (
                <div className="p-12 text-center text-xs text-[#64748B]">
                  No has agregado kits a tu pedido aún.
                </div>
              ) : (
                <div className="divide-y divide-[#F1F5F9] my-4 max-h-[60vh] overflow-y-auto">
                  {Object.entries(cart).map(([kitId, qty]) => {
                    const kit = kits.find((k) => k.id === kitId);
                    if (!kit || qty <= 0) return null;

                    return (
                      <div key={kitId} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="font-bold text-[#181C1F]">{kit.name}</div>
                          <div className="text-[11px] text-[#64748B]">{kit.presentation}</div>
                          <div className="font-mono text-[#944601] font-semibold mt-0.5">
                            {formatSimpleCOP(kit.pvpCop)} COP c/u
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCart((prev) => ({ ...prev, [kitId]: Math.max(0, qty - 1) }))}
                            className="h-6 w-6 rounded bg-[#F1F5F9] text-[#181C1F] font-bold flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold w-6 text-center">{qty}</span>
                          <button
                            onClick={() => setCart((prev) => ({ ...prev, [kitId]: qty + 1 }))}
                            className="h-6 w-6 rounded bg-[#F1F5F9] text-[#181C1F] font-bold flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {totalCartItems > 0 && (
              <div className="border-t border-[#E5E2DC] pt-4 space-y-3 font-mono">
                <div className="flex justify-between text-xs text-[#64748B]">
                  <span>Total Unidades:</span>
                  <span>{totalCartItems} kits</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#181C1F]">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-[#944601]">{formatSimpleCOP(totalCartCOP)} COP</span>
                </div>

                {orderSent ? (
                  <div className="p-3 bg-[#EAF5EB] rounded-lg text-xs font-sans text-[#2E6930] text-center font-medium">
                    ¡Pedido recibido con éxito! Te contactaremos al WhatsApp para coordinar el despacho.
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setOrderSent(true);
                      setTimeout(() => {
                        setOrderSent(false);
                        setCart({});
                        setIsCartOpen(false);
                      }, 3000);
                    }}
                    className="w-full py-2.5 rounded-lg bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] text-xs font-bold transition-colors cursor-pointer"
                  >
                    Confirmar Pedido por WhatsApp / Web
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#181C1F] text-[#F8F7F4] pt-12 pb-8 border-t border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#2D3134] text-xs">
            {/* Col 1 */}
            <div className="space-y-3">
              <div className="invert">
                <Logo size="md" />
              </div>
              <p className="text-[#94A3B8] leading-relaxed">
                Fruit Desert S.A.S. — Agroindustria botánica, deshidratación controlada, infusiones, coctelería y snacks saludables con origen colombiano.
              </p>
              <div className="text-[11px] font-mono text-[#CBD5E1]">
                NIT: 901.765.432-1
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <h4 className="font-heading font-bold text-sm text-[#F8F7F4] uppercase tracking-wider">
                Colección
              </h4>
              <ul className="space-y-1.5 text-[#94A3B8]">
                <li><a href="#kits" className="hover:text-[#FFFFFF]">Tropical Mix (80g)</a></li>
                <li><a href="#kits" className="hover:text-[#FFFFFF]">Berry & Sweet (70g)</a></li>
                <li><a href="#kits" className="hover:text-[#FFFFFF]">Digestivo & Citrus (90g)</a></li>
                <li><a href="#kits" className="hover:text-[#FFFFFF]">Detox Green Energy (60g)</a></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <h4 className="font-heading font-bold text-sm text-[#F8F7F4] uppercase tracking-wider">
                Contacto Planta
              </h4>
              <ul className="space-y-2 text-[#94A3B8]">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#C86D2C]" />
                  <span>Cra 43A # 18 Sur - 45, El Poblado, Medellín</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#C86D2C]" />
                  <span>+57 312 845 9012</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#C86D2C]" />
                  <span>contacto@fruitdesert.com</span>
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3">
              <h4 className="font-heading font-bold text-sm text-[#F8F7F4] uppercase tracking-wider">
                Acceso Operativo
              </h4>
              <p className="text-[#94A3B8]">
                Plataforma de planta para registro de pesaje en báscula, túneles de secado y costeo de escandallo.
              </p>
              <button
                onClick={onGoToErp}
                className="w-full py-2 rounded-lg bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] font-bold text-xs transition-colors cursor-pointer"
              >
                Ingresar al ERP Agroindustrial
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#64748B] gap-2">
            <div>
              © 2024 Fruit Desert S.A.S. Todos los derechos reservados. Medellín, Colombia.
            </div>
            <div className="flex items-center gap-4">
              <span>Régimen Simple de Tributación</span>
              <span>·</span>
              <button onClick={onGoToLogin} className="hover:text-[#FFFFFF] cursor-pointer">
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
