import React, { useState } from 'react';
import { ShoppingBag, ShieldCheck, Heart, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import { AppDatabase } from '../../services/store';
import { formatSimpleCOP, formatGrams } from '../../utils/format';
import { Logo } from '../common/Logo';

interface ClientPortalViewProps {
  db: AppDatabase;
  onSwitchToAdmin: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ db, onSwitchToAdmin }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [inquirySent, setInquirySent] = useState<string | null>(null);

  const activeKits = db.kits.filter((k) => k.active && (selectedCategory === 'ALL' || k.category === selectedCategory));

  const handleSendOrderInquiry = (kitName: string) => {
    setInquirySent(kitName);
    setTimeout(() => setInquirySent(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Security & RLS Demonstration Banner */}
      <div className="bg-[#F0FDFA] border border-[#CCFBF1] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#CCFBF1] text-[#0F766E] shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-[#134E4A] font-sans">
              Vista Exclusiva para Clientes (Protección Activa Supabase RLS)
            </h4>
            <p className="text-[#0F766E] text-[11px] mt-0.5">
              En este rol, las políticas de Row Level Security (RLS) bloquean estrictamente costos de producción, mermas, recetas internas (BOM), compras a proveedores e inventarios de bodega.
            </p>
          </div>
        </div>

        <button
          onClick={onSwitchToAdmin}
          className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-[#0F766E] hover:bg-[#115E59] text-[#FFFFFF] font-semibold text-xs transition-colors shrink-0 cursor-pointer"
        >
          Volver a Vista Administrador
        </button>
      </div>

      {/* Catalog Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#944601] to-[#C86D2C] text-[#FFFFFF] p-8 sm:p-10 shadow-sm">
        <div className="relative z-10 max-w-xl space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF]/15 backdrop-blur-xs text-xs font-medium tracking-wide">
            <Sparkles className="h-3.5 w-3.5 text-[#FDE68A]" />
            <span>100% Fruta Colombiana sin conservantes</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading leading-tight">
            Kits de Fruta Deshidratada
          </h1>
          <p className="text-sm text-[#FED7AA] font-sans leading-relaxed">
            Concentramos el sabor y las notas aromáticas de frutas seleccionadas del Tolima, Santander, Boyacá y Urabá. Diseñados para infusiones botánicas, coctelería de autor y snacks energéticos.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center justify-between border-b border-[#E5E2DC] pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'Infusiones', 'Coctelería', 'Snacks'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#181C1F] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] text-[#64748B] hover:text-[#181C1F] border border-[#E5E2DC]'
              }`}
            >
              {cat === 'ALL' ? 'Todos los Kits' : cat}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-[#64748B] hidden sm:block">
          {activeKits.length} productos disponibles
        </span>
      </div>

      {inquirySent && (
        <div className="p-3 bg-[#EAF5EB] border border-[#CDE6CF] rounded-lg text-xs text-[#2E6930] flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>¡Solicitud enviada para <strong>{inquirySent}</strong>! Un asesor de Fruit Desert se comunicará contigo.</span>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeKits.map((kit) => (
          <div
            key={kit.id}
            className="bg-[#FFFFFF] rounded-xl border border-[#E5E2DC] overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="relative aspect-4/3 bg-[#F1F5F9] overflow-hidden">
                <img
                  src={kit.imageUrl}
                  alt={kit.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#181C1F]/80 backdrop-blur-xs text-[#FFFFFF] text-[10px] font-mono font-bold">
                  {kit.category}
                </span>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-heading font-bold text-lg text-[#181C1F]">
                    {kit.name}
                  </h3>
                  <span className="font-mono text-xs text-[#64748B]">
                    {formatGrams(kit.netWeightGrams)} netos
                  </span>
                </div>

                <p className="text-xs font-mono text-[#944601] font-semibold mb-2">
                  {kit.presentation}
                </p>

                <p className="text-xs text-[#64748B] leading-relaxed line-clamp-3 mb-4">
                  {kit.description}
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 border-t border-[#F1F5F9] flex items-center justify-between mt-auto">
              <div>
                <span className="text-[10px] font-mono text-[#64748B] block uppercase">
                  PRECIO AL PÚBLICO
                </span>
                <span className="font-mono font-bold text-xl text-[#181C1F]">
                  {formatSimpleCOP(kit.pvpCop)} COP
                </span>
              </div>

              <button
                onClick={() => handleSendOrderInquiry(kit.name)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Pedir Kit</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
