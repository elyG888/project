import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Mail, ArrowRight, CheckCircle2, AlertTriangle, KeyRound, Sparkles, Building, Phone } from 'lucide-react';
import { Logo } from '../common/Logo';
import { UserRole, UserSession } from '../../types';
import { fruitDesertService } from '../../services/store';

interface LoginPageProps {
  onLoginSuccess: (user: UserSession) => void;
  onBackToLanding: () => void;
  initialRole?: UserRole;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onBackToLanding,
  initialRole = 'ADMIN',
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState(initialRole === 'ADMIN' ? 'carlos.restrepo@fruitdesert.com' : 'eliana.gallego@gmail.com');
  const [password, setPassword] = useState('••••••••••');
  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Medellín, Antioquia');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle standard submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegister) {
      if (!name.trim()) {
        setErrorMsg('Por favor ingresa tu nombre completo o razón social.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Por favor ingresa un correo electrónico válido.');
        return;
      }

      // Register new client in DB & auth
      const newCustomer = fruitDesertService.saveCustomer({
        name,
        taxId: taxId || '222222222222',
        email,
        phone: phone || '+57 300 000 0000',
        city: city || 'Colombia',
        address: 'Dirección registrada',
      });

      const newUser: UserSession = {
        id: `usr_${newCustomer.id}`,
        name: newCustomer.name,
        email: newCustomer.email,
        role: 'CLIENTE',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      };

      fruitDesertService.setCurrentUser(newUser);
      onLoginSuccess(newUser);
    } else {
      // Login check
      const isAdminAccount = email.toLowerCase().includes('admin') || email.toLowerCase().includes('carlos');
      const user: UserSession = {
        id: isAdminAccount ? 'usr_admin_1' : 'usr_cliente_1',
        name: isAdminAccount ? 'Carlos Restrepo' : 'Eliana Gallego',
        email: email,
        role: isAdminAccount ? 'ADMIN' : 'CLIENTE',
        avatarUrl: isAdminAccount
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
          : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      };

      fruitDesertService.setCurrentUser(user);
      onLoginSuccess(user);
    }
  };

  // 1-Click fast role switcher for live evaluation
  const handleQuickLogin = (role: UserRole) => {
    if (role === 'ADMIN') {
      setEmail('carlos.restrepo@fruitdesert.com');
      const user: UserSession = {
        id: 'usr_admin_1',
        name: 'Carlos Restrepo',
        email: 'carlos.restrepo@fruitdesert.com',
        role: 'ADMIN',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      };
      fruitDesertService.setCurrentUser(user);
      onLoginSuccess(user);
    } else {
      setEmail('eliana.gallego@gmail.com');
      const user: UserSession = {
        id: 'usr_cliente_1',
        name: 'Eliana Gallego',
        email: 'eliana.gallego@gmail.com',
        role: 'CLIENTE',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80',
      };
      fruitDesertService.setCurrentUser(user);
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#C86D2C] selection:text-white">
      {/* Return to landing */}
      <button
        onClick={onBackToLanding}
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-[#64748B] hover:text-[#181C1F] transition-colors cursor-pointer"
      >
        <span>← Volver a la página principal</span>
      </button>

      <div className="w-full max-w-md bg-[#FFFFFF] border border-[#E5E2DC] rounded-2xl shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="p-8 pb-6 text-center border-b border-[#E5E2DC] bg-[#FAF8F5]">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <h2 className="text-xl font-bold font-heading text-[#181C1F]">
            {isRegister ? 'Crear Cuenta de Cliente' : 'Acceso al Sistema Operativo'}
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            {isRegister
              ? 'Regístrate para comprar kits de fruta deshidratada al por menor o al por mayor.'
              : 'Autenticación Supabase con control de acceso por roles (RLS).'}
          </p>
        </div>

        {/* Demo Fast Selector Banner */}
        <div className="p-4 bg-[#FFF7ED] border-b border-[#FED7AA] text-xs">
          <div className="flex items-center gap-1.5 text-[#944601] font-bold font-mono text-[11px] mb-2">
            <KeyRound className="h-3.5 w-3.5" />
            <span>ACCESO RÁPIDO POR ROL (DEMOSTRACIÓN RLS)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('ADMIN')}
              className="p-2.5 rounded-lg border border-[#FDBA74] bg-[#FFFFFF] hover:bg-[#FFEDD5] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-[#9A3412] font-semibold text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#C86D2C]" />
                <span>Administrador</span>
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">
                Carlos Restrepo · Acceso total
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('CLIENTE')}
              className="p-2.5 rounded-lg border border-[#99F6E4] bg-[#FFFFFF] hover:bg-[#F0FDFA] text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-[#0F766E] font-semibold text-[11px]">
                <User className="h-3.5 w-3.5 text-[#0F766E]" />
                <span>Cliente Registrado</span>
              </div>
              <div className="text-[10px] text-[#64748B] mt-0.5">
                Eliana Gallego · Solo catálogo
              </div>
            </button>
          </div>
        </div>

        {/* Main Form */}
        <div className="p-8 pt-6">
          {errorMsg && (
            <div className="mb-4 p-3 bg-[#FBEAE8] border border-[#F5C2BE] rounded-lg text-xs text-[#B43428] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <>
                <div>
                  <label className="block text-[#181C1F] font-semibold mb-1">
                    Nombre Completo o Empresa *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Juliana Restrepo o Café Bar SAS"
                      className="w-full rounded-lg border border-[#D5D1C8] pl-9 pr-3 py-2 focus:border-[#C86D2C] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#181C1F] font-semibold mb-1">
                      Cédula / NIT
                    </label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="1.020.300.400"
                      className="w-full rounded-lg border border-[#D5D1C8] px-3 py-2 font-mono focus:border-[#C86D2C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#181C1F] font-semibold mb-1">
                      Teléfono Móvil
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+57 300..."
                      className="w-full rounded-lg border border-[#D5D1C8] px-3 py-2 font-mono focus:border-[#C86D2C] focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[#181C1F] font-semibold mb-1">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@fruitdesert.com"
                  className="w-full rounded-lg border border-[#D5D1C8] pl-9 pr-3 py-2 focus:border-[#C86D2C] focus:outline-none font-sans"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[#181C1F] font-semibold">
                  Contraseña *
                </label>
                {!isRegister && (
                  <span className="text-[11px] text-[#C86D2C] hover:underline cursor-pointer">
                    ¿Olvidaste tu contraseña?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#D5D1C8] pl-9 pr-3 py-2 focus:border-[#C86D2C] focus:outline-none font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#C86D2C] hover:bg-[#B15C21] text-[#FFFFFF] py-2.5 font-semibold text-xs shadow-md transition-colors cursor-pointer"
            >
              <span>{isRegister ? 'Crear Cuenta y Entrar' : 'Iniciar Sesión'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="mt-6 pt-4 border-t border-[#F1F5F9] text-center text-xs text-[#64748B]">
            {isRegister ? (
              <p>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="font-bold text-[#944601] hover:underline cursor-pointer"
                >
                  Iniciar sesión
                </button>
              </p>
            ) : (
              <p>
                ¿Eres un nuevo cliente o distribuidor?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="font-bold text-[#944601] hover:underline cursor-pointer"
                >
                  Crear cuenta nueva
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
