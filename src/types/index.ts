export type UserRole = 'ADMIN' | 'CLIENTE';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type ItemType = 'FRUTA_FRESCA' | 'FRUTA_DESHIDRATADA' | 'MATERIAL_EMPAQUE' | 'KIT_FINAL';

export interface FruitItem {
  id: string;
  code: string;
  name: string;
  variety: string;
  origin: string;
  typicalBrix: number;
  expectedShrinkagePct: number; // e.g. 85.5%
  currentStockKg: number;
  averageCostPerKgCop: number; // Weighted average cost
  active: boolean;
  colorHex?: string;
}

export interface DehydratedFruitItem {
  id: string;
  fruitId: string;
  name: string;
  variety: string;
  currentStockKg: number;
  averageCostPerKgCop: number; // Cost per kg dried
  costPerGramCop: number; // Cost per gram
  active: boolean;
}

export interface KitRecipeIngredient {
  id: string;
  dehydratedFruitId: string;
  dehydratedFruitName: string;
  gramsNeeded: number;
}

export interface ProductKit {
  id: string;
  code: string;
  name: string;
  presentation: string; // e.g. "Bolsa Kraft Doy-pack 80g"
  category: 'Infusiones' | 'Coctelería' | 'Snacks';
  description: string;
  netWeightGrams: number;
  pvpCop: number; // Official retail price
  currentStockUnits: number;
  minStockAlert: number;
  recipe: KitRecipeIngredient[];
  imageUrl: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IndirectCostConfig {
  doypackBagCop: number;
  frontBackLabelCop: number;
  assemblyLaborCop: number;
  packagingBaseCop: number; // Sum of the above
}

export type BatchStatus = 'EN_SECADO' | 'COMPLETADO' | 'CANCELADO';
export type TunnelId = 'Túnel 1' | 'Túnel 2' | 'Túnel 3';

export interface DehydrationBatch {
  id: string;
  batchCode: string; // e.g. "#LT-2024-10-89"
  date: string;
  tunnelId: TunnelId;
  fruitId: string;
  fruitName: string;
  variety: string;
  origin: string;
  freshKgUsed: number;
  freshFruitUnitCostCop: number;
  totalFreshFruitCostCop: number;
  energyTunnelCostCop: number;
  dryKgObtained: number;
  yieldPercentage: number; // (dryKg / freshKg) * 100
  shrinkagePercentage: number; // 100 - yieldPercentage
  costPerDryKgCop: number; // Total cost / dryKgObtained
  costPerDryGramCop: number;
  temperatureC: number;
  dryingDurationHours: number;
  status: BatchStatus;
  notes: string;
  operatorName: string;
  createdAt: string;
}

export interface FruitPurchase {
  id: string;
  purchaseCode: string; // e.g. "COM-2024-041"
  date: string; // Fecha de compra
  plazaMercado: string; // Plaza de mercado / puesto
  fruitId: string;
  fruitName: string;
  quantityKg: number;
  totalCostCop: number;
  unitCostPerKgCop: number; // totalCostCop / quantityKg
  invoiceRef?: string;
  notes?: string;
  receivedBy: string;
  createdAt: string;
}

export interface KitAssemblyRecord {
  id: string;
  assemblyCode: string; // e.g. "ENS-2024-023"
  date: string;
  kitId: string;
  kitName: string;
  presentation: string;
  quantityProduced: number;
  unitCostCop: number;
  totalCostCop: number;
  ingredientsConsumed: {
    dehydratedFruitId: string;
    fruitName: string;
    totalGramsConsumed: number;
    costCop: number;
  }[];
  packagingCostCop: number;
  notes: string;
  operatorName: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  taxId: string; // NIT or CC
  email: string;
  phone: string;
  city: string;
  address: string;
  active: boolean;
  ordersCount: number;
  totalSpentCop: number;
  createdAt: string;
}

export interface SaleOrderItem {
  kitId: string;
  kitCode: string;
  kitName: string;
  presentation: string;
  unitPriceCop: number; // Historical frozen price
  unitCostCop: number; // Historical frozen cost
  quantity: number;
  subtotalCop: number;
  totalCostCop: number;
}

export type PaymentMethod = 'Efectivo' | 'Transferencia Bancolombia' | 'Nequi' | 'Daviplata' | 'Tarjeta Débito/Crédito';

export interface SaleOrder {
  id: string;
  invoiceNumber: string; // e.g. "FD-VENTA-00104"
  date: string;
  customerId: string;
  customerName: string;
  customerTaxId: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  customerCity: string;
  items: SaleOrderItem[];
  subtotalCop: number;
  discountCop: number;
  totalCop: number;
  totalCogsCop: number;
  grossProfitCop: number;
  grossMarginPct: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'PAGADO' | 'PENDIENTE';
  cashierName: string;
  notes?: string;
  createdAt: string;
}

export type MovementType = 
  | 'COMPRA' 
  | 'PRODUCCION_SALIDA' 
  | 'PRODUCCION_ENTRADA' 
  | 'ENSAMBLE_SALIDA' 
  | 'ENSAMBLE_ENTRADA' 
  | 'VENTA' 
  | 'AJUSTE_POSITIVO' 
  | 'AJUSTE_NEGATIVO';

export interface InventoryMovement {
  id: string;
  timestamp: string;
  itemType: ItemType;
  itemId: string;
  itemName: string;
  movementType: MovementType;
  quantityChange: number; // Can be positive or negative
  unit: 'kg' | 'g' | 'und';
  previousStock: number;
  newStock: number;
  unitCostCop: number;
  totalCostCop: number;
  referenceDocument: string; // e.g. "COM-2024-041", "#LT-2024-10-89", "FD-VENTA-00104"
  reason: string;
  responsibleUser: string;
}
