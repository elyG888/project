import React from 'react';
import { Search, Bell, ShieldCheck, UserCheck, Flame, Globe, LogOut } from 'lucide-react';
import { UserSession } from '../../types';

interface HeaderProps {
  currentUser: UserSession;
  onSwitchRole: (role: 'ADMIN' | 'CLIENTE') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeBatchCode?: string;
  onNavigateToProduction?: () => void;
  onGoToLanding?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchRole,
  searchQuery,
  onSearchChange,
  activeBatchCode = '#LT-2024-10-89',
  onNavigateToProduction,
  onGoToLanding,
  onLogout,
}) => {
  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E5E2DC] bg-[#FFFFFF] px-6 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Active production ticker (as seen in Image 1 top bar) */}
      <div className="flex items-center gap-3">
        {activeBatchCode && (
          <button
            onClick={onNavigateToProduction}
            className="flex items-center gap-2 rounded-md bg-[#FFF7ED] px-2.5 py-1 text-xs font-semibold text-[#944601] border border-[#FED7AA] hover:bg-[#FFEDD5] transition-colors cursor-pointer"
            title="Ver lote de secado activo en túnel"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EA580C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C86D2C]"></span>
            </span>
            <span className="uppercase tracking-wider font-mono text-[11px]">PRODUCCIÓN ACTIVA</span>
            <span className="text-[#9A3412]">|</span>
            <span className="font-mono text-[#7C2D12]">{activeBatchCode}</span>
          </button>
        )}
      </div>

      {/* Center Search bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar lote (#LT-...), fruta o factura (FD-VENTA-...)..."
            className="w-full rounded-md border border-[#E5E2DC] bg-[#F8F7F4] py-1.5 pl-9 pr-3 text-xs placeholder-[#94A3B8] focus:border-[#C86D2C] focus:bg-[#FFFFFF] focus:outline-none transition-all font-sans"
          />
        </div>
      </div>

      {/* Right controls: Role switcher, Landing link & profile badge */}
      <div className="flex items-center gap-3">
        {/* Link to public Landing Page */}
        {onGoToLanding && (
          <button
            onClick={onGoToLanding}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] hover:text-[#181C1F] border border-[#E2E8F0] transition-colors cursor-pointer"
            title="Ver la landing page comercial para clientes"
          >
            <Globe className="h-3.5 w-3.5 text-[#C86D2C]" />
            <span className="hidden sm:inline">Sitio Web</span>
          </button>
        )}

        {/* Role toggle simulation */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0]">
          <button
            onClick={() => onSwitchRole('ADMIN')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
              isAdmin
                ? 'bg-[#FFFFFF] text-[#944601] shadow-xs font-semibold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
            title="Acceso total a recetas, costos, producción, inventario y compras"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => onSwitchRole('CLIENTE')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${
              !isAdmin
                ? 'bg-[#FFFFFF] text-[#0F766E] shadow-xs font-semibold'
                : 'text-[#64748B] hover:text-[#1E293B]'
            }`}
            title="Vista cliente protegida por RLS: solo catálogo comercial sin costos internos"
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Cliente</span>
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 border-l border-[#E2E8F0] pl-3">
          <img
            src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
            alt={currentUser.name}
            className="h-8 w-8 rounded-full object-cover ring-1 ring-[#CBD5E1]"
          />
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-[#1E293B] leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[11px] font-mono text-[#64748B] leading-tight">
              {isAdmin ? 'Administrador General' : 'Cliente Registrado'}
            </div>
          </div>
        </div>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </header>
  );
};

