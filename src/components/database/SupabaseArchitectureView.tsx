import React, { useState } from 'react';
import { Database, ShieldCheck, Copy, Check, Download, Layers, Lock, Cpu, Server } from 'lucide-react';

const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- FRUIT DESERT — SCHEMA POSTGRESQL / SUPABASE CON ROW LEVEL SECURITY (RLS)
-- Arquitectura de Base de Datos para Control Agroindustrial, Costeo y Mermas
-- ==============================================================================

-- 1. EXTENSIONES Y ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'CLIENTE');
  CREATE TYPE item_type AS ENUM ('FRUTA_FRESCA', 'FRUTA_DESHIDRATADA', 'MATERIAL_EMPAQUE', 'KIT_FINAL');
  CREATE TYPE batch_status AS ENUM ('EN_SECADO', 'COMPLETADO', 'CANCELADO');
  CREATE TYPE movement_type AS ENUM (
    'COMPRA', 
    'PRODUCCION_SALIDA', 
    'PRODUCCION_ENTRADA', 
    'ENSAMBLE_SALIDA', 
    'ENSAMBLE_ENTRADA', 
    'VENTA', 
    'AJUSTE_POSITIVO', 
    'AJUSTE_NEGATIVO'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. TABLA DE PERFILES DE USUARIO (Vinculada a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'CLIENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- Funciones de seguridad para evaluar roles en RLS
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((SELECT role = 'ADMIN' FROM public.profiles WHERE id = auth.uid()), false);
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. CATÁLOGO DE MATERIA PRIMA FRESCA
CREATE TABLE IF NOT EXISTS public.frutas_frescas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  variedad VARCHAR(100) NOT NULL,
  origen VARCHAR(150) NOT NULL,
  grados_brix NUMERIC(4, 1) DEFAULT 12.0,
  merma_esperada_pct NUMERIC(5, 2) NOT NULL CHECK (merma_esperada_pct BETWEEN 0 AND 100),
  stock_actual_kg NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (stock_actual_kg >= 0),
  costo_promedio_kg_cop NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (costo_promedio_kg_cop >= 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 4. CATÁLOGO DE FRUTA DESHIDRATADA (A granel)
CREATE TABLE IF NOT EXISTS public.frutas_deshidratadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fruta_fresca_id UUID NOT NULL REFERENCES public.frutas_frescas(id) ON DELETE RESTRICT,
  nombre VARCHAR(100) NOT NULL,
  variedad VARCHAR(100) NOT NULL,
  stock_actual_kg NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (stock_actual_kg >= 0),
  costo_promedio_kg_cop NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (costo_promedio_kg_cop >= 0),
  costo_por_gramo_cop NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (costo_por_gramo_cop >= 0),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 5. CATÁLOGO DE KITS COMERCIALES (Productos finales vendibles)
CREATE TABLE IF NOT EXISTS public.kits_productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo VARCHAR(30) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  presentacion VARCHAR(100) NOT NULL,
  categoria VARCHAR(50) NOT NULL,
  descripcion TEXT,
  peso_neto_gramos NUMERIC(8, 2) NOT NULL CHECK (peso_neto_gramos > 0),
  pvp_oficial_cop NUMERIC(12, 2) NOT NULL CHECK (pvp_oficial_cop >= 0),
  stock_unidades INT NOT NULL DEFAULT 0 CHECK (stock_unidades >= 0),
  alerta_stock_minimo INT NOT NULL DEFAULT 20 CHECK (alerta_stock_minimo >= 0),
  imagen_url TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 6. RECETAS / ESCANDALLO INDUSTRIAL (Bill of Materials - BOM)
CREATE TABLE IF NOT EXISTS public.recetas_kit_ingredientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id UUID NOT NULL REFERENCES public.kits_productos(id) ON DELETE CASCADE,
  fruta_deshidratada_id UUID NOT NULL REFERENCES public.frutas_deshidratadas(id) ON DELETE RESTRICT,
  gramos_requeridos NUMERIC(8, 2) NOT NULL CHECK (gramos_requeridos > 0),
  UNIQUE (kit_id, fruta_deshidratada_id)
);

-- 7. CONFIGURACIÓN DE COSTOS INDIRECTOS DE EMPAQUE
CREATE TABLE IF NOT EXISTS public.configuracion_costos_indirectos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bolsa_kraft_doypack_cop NUMERIC(10, 2) NOT NULL DEFAULT 450,
  etiqueta_adhesiva_cop NUMERIC(10, 2) NOT NULL DEFAULT 150,
  mano_obra_ensamble_cop NUMERIC(10, 2) NOT NULL DEFAULT 250,
  costo_empaque_base_cop NUMERIC(10, 2) GENERATED ALWAYS AS (
    bolsa_kraft_doypack_cop + etiqueta_adhesiva_cop + mano_obra_ensamble_cop
  ) STORED,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 8. COMPRAS DE FRUTA FRESCA (Recepción y cálculo automático de precio/kg)
CREATE TABLE IF NOT EXISTS public.compras_fruta (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_compra VARCHAR(50) NOT NULL UNIQUE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  proveedor_nombre VARCHAR(150) NOT NULL,
  proveedor_nit VARCHAR(50) NOT NULL,
  fruta_id UUID NOT NULL REFERENCES public.frutas_frescas(id) ON DELETE RESTRICT,
  cantidad_kg NUMERIC(10, 2) NOT NULL CHECK (cantidad_kg > 0),
  costo_total_cop NUMERIC(12, 2) NOT NULL CHECK (costo_total_cop > 0),
  costo_unitario_kg_cop NUMERIC(12, 2) NOT NULL CHECK (costo_unitario_kg_cop > 0),
  factura_referencia VARCHAR(100),
  recibido_por UUID REFERENCES auth.users(id),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 9. LOTES DE PRODUCCIÓN Y DESHIDRATACIÓN EN TÚNEL
CREATE TABLE IF NOT EXISTS public.lotes_deshidratacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_lote VARCHAR(50) NOT NULL UNIQUE, -- ej: #LT-2024-10-89
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tunel VARCHAR(50) NOT NULL,
  fruta_id UUID NOT NULL REFERENCES public.frutas_frescas(id) ON DELETE RESTRICT,
  kg_frescos_usados NUMERIC(10, 2) NOT NULL CHECK (kg_frescos_usados > 0),
  costo_fresca_kg_cop NUMERIC(12, 2) NOT NULL,
  costo_total_materia_prima_cop NUMERIC(12, 2) NOT NULL,
  costo_energia_tunel_cop NUMERIC(12, 2) NOT NULL DEFAULT 110000,
  kg_secos_obtenidos NUMERIC(10, 2) CHECK (kg_secos_obtenidos >= 0),
  rendimiento_pct NUMERIC(5, 2) CHECK (rendimiento_pct BETWEEN 0 AND 100),
  merma_pct NUMERIC(5, 2) CHECK (merma_pct BETWEEN 0 AND 100),
  costo_real_kg_seco_cop NUMERIC(12, 2),
  costo_real_gramo_cop NUMERIC(10, 2),
  temperatura_c INT DEFAULT 58,
  duracion_horas INT DEFAULT 36,
  estado batch_status NOT NULL DEFAULT 'EN_SECADO',
  observaciones TEXT,
  responsable_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 10. ÓRDENES DE FABRICACIÓN / ENSAMBLE DE KITS
CREATE TABLE IF NOT EXISTS public.ensambles_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_ensamble VARCHAR(50) NOT NULL UNIQUE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  kit_id UUID NOT NULL REFERENCES public.kits_productos(id) ON DELETE RESTRICT,
  unidades_producidas INT NOT NULL CHECK (unidades_producidas > 0),
  costo_materia_prima_cop NUMERIC(12, 2) NOT NULL,
  costo_empaque_cop NUMERIC(12, 2) NOT NULL,
  costo_total_ensamble_cop NUMERIC(12, 2) NOT NULL,
  costo_unitario_kit_cop NUMERIC(12, 2) NOT NULL,
  observaciones TEXT,
  responsable_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 11. CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nombre VARCHAR(150) NOT NULL,
  documento_nit VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(150) NOT NULL,
  telefono VARCHAR(50) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  direccion TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 12. VENTAS (Cabecera)
CREATE TABLE IF NOT EXISTS public.ventas_cabecera (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consecutivo VARCHAR(50) NOT NULL UNIQUE, -- ej: FD-VENTA-00104
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  subtotal_cop NUMERIC(12, 2) NOT NULL CHECK (subtotal_cop >= 0),
  descuento_cop NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (descuento_cop >= 0),
  total_cop NUMERIC(12, 2) NOT NULL CHECK (total_cop >= 0),
  costo_total_cogs_cop NUMERIC(12, 2) NOT NULL CHECK (costo_total_cogs_cop >= 0),
  utilidad_bruta_cop NUMERIC(12, 2) NOT NULL,
  margen_bruto_pct NUMERIC(5, 2) NOT NULL,
  medio_pago VARCHAR(50) NOT NULL,
  estado_pago VARCHAR(30) NOT NULL DEFAULT 'PAGADO',
  cajero_id UUID REFERENCES auth.users(id),
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now())
);

-- 13. VENTAS (Detalle con precios y costos congelados históricamente)
CREATE TABLE IF NOT EXISTS public.ventas_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venta_id UUID NOT NULL REFERENCES public.ventas_cabecera(id) ON DELETE CASCADE,
  kit_id UUID NOT NULL REFERENCES public.kits_productos(id) ON DELETE RESTRICT,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  precio_unitario_congelado_cop NUMERIC(12, 2) NOT NULL CHECK (precio_unitario_congelado_cop >= 0),
  costo_unitario_congelado_cop NUMERIC(12, 2) NOT NULL CHECK (costo_unitario_congelado_cop >= 0),
  subtotal_cop NUMERIC(12, 2) NOT NULL CHECK (subtotal_cop >= 0),
  costo_total_cogs_cop NUMERIC(12, 2) NOT NULL CHECK (costo_total_cogs_cop >= 0)
);

-- 14. KARDEX INMUTABLE (Auditoría de todos los movimientos de inventario)
CREATE TABLE IF NOT EXISTS public.inventario_kardex (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('America/Bogota', now()),
  tipo_item item_type NOT NULL,
  item_id UUID NOT NULL,
  item_nombre VARCHAR(150) NOT NULL,
  tipo_movimiento movement_type NOT NULL,
  cantidad_delta NUMERIC(12, 2) NOT NULL,
  unidad VARCHAR(10) NOT NULL,
  stock_previo NUMERIC(12, 2) NOT NULL,
  stock_nuevo NUMERIC(12, 2) NOT NULL,
  costo_unitario_cop NUMERIC(12, 2) NOT NULL,
  valor_total_cop NUMERIC(12, 2) NOT NULL,
  documento_referencia VARCHAR(100) NOT NULL,
  motivo_razon TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id)
);

-- ==============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frutas_frescas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frutas_deshidratadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recetas_kit_ingredientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion_costos_indirectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras_fruta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_deshidratacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ensambles_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_cabecera ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_kardex ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES: Usuarios pueden ver su perfil; admins ven todos
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 2. KITS_PRODUCTOS: Clientes ven solo kits activos (nombre, descripción, imagen, PVP)
CREATE POLICY "kits_select_public_active" ON public.kits_productos
  FOR SELECT USING (activo = true OR public.is_admin());

CREATE POLICY "kits_all_admin" ON public.kits_productos
  FOR ALL USING (public.is_admin());

-- 3. TABLAS CONFIDENCIALES DE PRODUCCIÓN Y COSTOS (Solo Administradores)
CREATE POLICY "frutas_frescas_admin_only" ON public.frutas_frescas
  FOR ALL USING (public.is_admin());

CREATE POLICY "frutas_deshidratadas_admin_only" ON public.frutas_deshidratadas
  FOR ALL USING (public.is_admin());

CREATE POLICY "recetas_admin_only" ON public.recetas_kit_ingredientes
  FOR ALL USING (public.is_admin());

CREATE POLICY "costos_indirectos_admin_only" ON public.configuracion_costos_indirectos
  FOR ALL USING (public.is_admin());

CREATE POLICY "compras_admin_only" ON public.compras_fruta
  FOR ALL USING (public.is_admin());

CREATE POLICY "lotes_produccion_admin_only" ON public.lotes_deshidratacion
  FOR ALL USING (public.is_admin());

CREATE POLICY "ensambles_admin_only" ON public.ensambles_kits
  FOR ALL USING (public.is_admin());

CREATE POLICY "kardex_admin_only" ON public.inventario_kardex
  FOR ALL USING (public.is_admin());

-- 4. VENTAS: Clientes ven ÚNICAMENTE sus propias órdenes; admins ven todas
CREATE POLICY "ventas_select_client_own_or_admin" ON public.ventas_cabecera
  FOR SELECT USING (
    public.is_admin() OR 
    cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
  );

CREATE POLICY "ventas_insert_authorized" ON public.ventas_cabecera
  FOR INSERT WITH CHECK (
    public.is_admin() OR 
    cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
  );

CREATE POLICY "ventas_admin_manage" ON public.ventas_cabecera
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "ventas_detalle_select" ON public.ventas_detalle
  FOR SELECT USING (
    public.is_admin() OR 
    venta_id IN (
      SELECT id FROM public.ventas_cabecera 
      WHERE cliente_id IN (SELECT id FROM public.clientes WHERE user_id = auth.uid())
    )
  );

-- ==============================================================================
-- ÍNDICES PARA ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_kardex_timestamp ON public.inventario_kardex(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_kardex_item ON public.inventario_kardex(tipo_item, item_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON public.ventas_cabecera(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON public.ventas_cabecera(cliente_id);
CREATE INDEX IF NOT EXISTS idx_lotes_fecha ON public.lotes_deshidratacion(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_compras_fecha ON public.compras_fruta(fecha DESC);
`;

export const SupabaseArchitectureView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SCHEMA_SQL], { type: 'text/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fruit_desert_supabase_schema.sql';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-[#EAF5EB] text-[#2E6930]">
              <Database className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#2E6930] font-semibold">
              POSTGRESQL & SUPABASE READY
            </span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-[#181C1F]">
            Arquitectura de Base de Datos & Políticas RLS
          </h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Esquema relacional estricto, modelo de costeo multietapa y aislamiento de seguridad a nivel de filas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#CBD5E1] bg-[#FFFFFF] hover:bg-[#F8FAFC] text-xs font-semibold text-[#1E293B] shadow-2xs transition-colors cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#2E6930]" /> : <Copy className="h-3.5 w-3.5 text-[#64748B]" />}
            <span>{copied ? '¡SQL Copiado!' : 'Copiar Script SQL'}</span>
          </button>
          <button
            onClick={handleDownloadSql}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#944601] hover:bg-[#783801] text-xs font-semibold text-[#FFFFFF] shadow-xs transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Descargar .sql</span>
          </button>
        </div>
      </div>

      {/* Architectural Decisions Cards answering user's direct questions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Decision 1: React + Vite justification */}
        <div className="p-4 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-[#944601] font-bold">
            <Cpu className="h-4 w-4" />
            <span>Elección Técnica: React + Vite</span>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Se eligió <strong>React + Vite SPA</strong> sobre Next.js porque Fruit Desert es una <strong>plataforma de control interno y planta</strong>. Las ventajas clave son:
          </p>
          <ul className="list-disc pl-4 text-[#475569] space-y-1">
            <li>Cero sobrecosto de SSR innecesario para un back-office.</li>
            <li>Recálculo instantáneo sub-milisegundo en sliders de mermas y escandallos.</li>
            <li>Generación e impresión de comprobantes PDF en cliente.</li>
            <li>Conexión nativa con Supabase Client + PostgreSQL RLS.</li>
          </ul>
        </div>

        {/* Decision 2: Fresh vs Dehydrated Modeling */}
        <div className="p-4 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-[#2E6930] font-bold">
            <Layers className="h-4 w-4" />
            <span>Entidades: Fresca vs Deshidratada</span>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Se modelan como <strong>artículos distintos (`frutas_frescas` y `frutas_deshidratadas`)</strong> vinculados por lotes de transformación:
          </p>
          <ul className="list-disc pl-4 text-[#475569] space-y-1">
            <li><strong>Unidades disímiles:</strong> Fresca en kilogramos brutos; seca en gramos y kilogramos netos.</li>
            <li><strong>Costeo abismalmente diferente:</strong> $3.200/kg fresca vs $22.069/kg seca tras una merma del 85.5%.</li>
            <li><strong>Trazabilidad de Kardex:</strong> Salida de materia prima y entrada auditada de producto seco.</li>
          </ul>
        </div>

        {/* Decision 3: Costing Strategy (PMP + Batch) */}
        <div className="p-4 bg-[#FFFFFF] border border-[#E5E2DC] rounded-lg shadow-2xs space-y-2">
          <div className="flex items-center gap-2 text-[#0F766E] font-bold">
            <Lock className="h-4 w-4" />
            <span>Estrategia de Costeo: PMP Móvil + Lote</span>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Se implementa <strong>Costo Promedio Ponderado Móvil (PMP)</strong> para almacén combinado con <strong>Costeo Real por Lote</strong> en planta:
          </p>
          <ul className="list-disc pl-4 text-[#475569] space-y-1">
            <li>Amortigua la volatilidad de precios agrícolas por temporada.</li>
            <li>Cada lote conserva su rendimiento, merma y costo real exacto.</li>
            <li>Las ventas congelan el costo y precio histórico en la línea del pedido.</li>
          </ul>
        </div>
      </div>

      {/* SQL Script Viewer */}
      <div className="bg-[#181C1F] border border-[#2D3134] rounded-xl overflow-hidden shadow-md">
        <div className="px-5 py-3 border-b border-[#2D3134] bg-[#24282B] flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-[#CBD5E1]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]"></span>
            <span className="ml-2 text-[#94A3B8]">fruit_desert_supabase_schema.sql</span>
          </div>

          <span className="text-[11px] font-mono text-[#94A3B8]">PostgreSQL 15+ / Supabase</span>
        </div>

        <pre className="p-5 text-[11px] font-mono text-[#E2E8F0] overflow-x-auto max-h-[500px] leading-relaxed">
          <code>{SUPABASE_SCHEMA_SQL}</code>
        </pre>
      </div>
    </div>
  );
};
