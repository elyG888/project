import React from 'react';
import {
  LayoutGrid,
  Flame,
  Boxes,
  Truck,
  ReceiptText,
  Users,
  Database,
  Layers,
  ShoppingBag,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Logo } from './Logo';
import { UserRole } from '../../types';

export type NavTab = 
  | 'dashboard'
  | 'production'
  | 'inventory'
  | 'purchases'
  | 'sales'
  | 'customers'
  | 'assemblies'
  | 'database'
  | 'client_portal';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  onResetData: () => void;
  onGoToLanding?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  onResetData,
  onGoToLanding,
  onLogout,
}) => {
  const isAdmin = userRole === 'ADMIN';

  const adminNavItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Panel Administrativo', icon: LayoutGrid },
    { id: 'production', label: 'Producción & Secado', icon: Flame },
    { id: 'inventory', label: 'Inventario & Kardex', icon: Boxes },
    { id: 'assemblies', label: 'Ensamble de Kits', icon: Layers },
    { id: 'purchases', label: 'Compras Fruta', icon: Truck },
    { id: 'sales', label: 'Ventas & Facturas', icon: ReceiptText },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'database', label: 'Arquitectura SQL / RLS', icon: Database },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#FFFFFF] border-r border-[#E5E2DC] flex flex-col justify-between min-h-screen select-none">
      <div>
        {/* Brand header */}
        <div className="p-5 border-b border-[#E5E2DC] bg-[#FAF8F5]">
          <Logo size="md" />
        </div>

        {/* Section title as in Image 1 */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold">
            {isAdmin ? 'OPERACIONES AGROINDUSTRIA' : 'PORTAL CLIENTE'}
          </span>
        </div>

        {/* Navigation list */}
        <nav className="px-3 space-y-1">
          {isAdmin ? (
            adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#C86D2C] text-[#FFFFFF] font-semibold shadow-xs'
                      : 'text-[#475569] hover:bg-[#F8F7F4] hover:text-[#1E293B]'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#FFFFFF]' : 'text-[#64748B]'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })
          ) : (
            <button
              onClick={() => onSelectTab('client_portal')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-semibold bg-[#0F766E] text-[#FFFFFF] shadow-xs text-left`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Catálogo de Kits</span>
            </button>
          )}

          {/* Customer Portal test button for Admin */}
          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-[#E5E2DC]">
              <button
                onClick={() => onSelectTab('client_portal')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-[#0F766E] hover:bg-[#F0FDFA] transition-colors ${
                  currentTab === 'client_portal' ? 'bg-[#F0FDFA] font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Ver Portal Cliente</span>
                </div>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Footer controls: System status & Reset demo database */}
      <div className="p-4 border-t border-[#E5E2DC] bg-[#FAF8F5] text-xs text-[#64748B]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-[#94A3B8]">Fruit Desert OS v2.4</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#DCFCE7] text-[#166534]">
            En línea
          </span>
        </div>

        {onGoToLanding && (
          <button
            onClick={onGoToLanding}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border border-[#E2E8F0] bg-[#FFFFFF] text-[11px] text-[#475569] hover:text-[#C86D2C] hover:border-[#FED7AA] transition-colors cursor-pointer mb-2 font-medium"
          >
            <span>Ver Sitio Web / Landing</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => {
              if (window.confirm('¿Desea restaurar la base de datos a los valores agroindustriales iniciales?')) {
                onResetData();
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border border-[#E2E8F0] bg-[#FFFFFF] text-[11px] text-[#64748B] hover:text-[#DC2626] hover:border-[#FECACA] transition-colors cursor-pointer mb-2"
            title="Reiniciar datos de prueba a los valores de la imagen de referencia"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Restaurar Datos Semilla</span>
          </button>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[11px] text-[#DC2626] hover:bg-[#FEE2E2] transition-colors cursor-pointer font-medium"
          >
            <span>Cerrar Sesión</span>
          </button>
        )}
      </div>
    </aside>
  );
};
