import {
  FruitItem,
  DehydratedFruitItem,
  ProductKit,
  DehydrationBatch,
  FruitPurchase,
  Customer,
  SaleOrder,
  InventoryMovement,
  IndirectCostConfig,
  UserSession,
  KitAssemblyRecord,
  SaleOrderItem,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_INDIRECT_COST,
  INITIAL_FRUITS,
  INITIAL_DEHYDRATED_FRUITS,
  INITIAL_KITS,
  INITIAL_BATCHES,
  INITIAL_PURCHASES,
  INITIAL_CUSTOMERS,
  INITIAL_SALES,
  INITIAL_MOVEMENTS,
} from './seedData';

const STORAGE_KEY = 'fruit_desert_db_v1';

export interface AppDatabase {
  currentUser: UserSession;
  indirectCost: IndirectCostConfig;
  fruits: FruitItem[];
  dehydratedFruits: DehydratedFruitItem[];
  kits: ProductKit[];
  batches: DehydrationBatch[];
  purchases: FruitPurchase[];
  customers: Customer[];
  sales: SaleOrder[];
  movements: InventoryMovement[];
  assemblies: KitAssemblyRecord[];
}

export const loadDatabase = (): AppDatabase => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading database from localStorage', err);
  }

  const defaultDb: AppDatabase = {
    currentUser: INITIAL_USERS[0], // Carlos Restrepo (Admin)
    indirectCost: INITIAL_INDIRECT_COST,
    fruits: INITIAL_FRUITS,
    dehydratedFruits: INITIAL_DEHYDRATED_FRUITS,
    kits: INITIAL_KITS,
    batches: INITIAL_BATCHES,
    purchases: INITIAL_PURCHASES,
    customers: INITIAL_CUSTOMERS,
    sales: INITIAL_SALES,
    movements: INITIAL_MOVEMENTS,
    assemblies: [],
  };

  saveDatabase(defaultDb);
  return defaultDb;
};

export const saveDatabase = (db: AppDatabase): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('Error saving database to localStorage', err);
  }
};

export const resetDatabaseToDefaults = (): AppDatabase => {
  localStorage.removeItem(STORAGE_KEY);
  return loadDatabase();
};

/**
 * Service providing atomic transactional methods with safety invariants
 */
export class FruitDesertService {
  private db: AppDatabase;
  private listeners: (() => void)[] = [];

  constructor() {
    this.db = loadDatabase();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    saveDatabase(this.db);
    this.listeners.forEach((listener) => listener());
  }

  public getDb(): AppDatabase {
    return this.db;
  }

  public getCurrentUser(): UserSession {
    return this.db.currentUser;
  }

  public setCurrentUser(user: UserSession) {
    this.db.currentUser = user;
    this.notify();
  }

  public switchRole(role: 'ADMIN' | 'CLIENTE') {
    const found = INITIAL_USERS.find((u) => u.role === role) || {
      id: role === 'ADMIN' ? 'usr_admin_1' : 'usr_cliente_1',
      name: role === 'ADMIN' ? 'Carlos Restrepo' : 'Eliana Gallego',
      email: role === 'ADMIN' ? 'carlos.restrepo@fruitdesert.com' : 'eliana.gallego@gmail.com',
      role,
    };
    this.db.currentUser = found;
    this.notify();
  }

  public updateIndirectCost(config: Partial<IndirectCostConfig>) {
    const prev = this.db.indirectCost;
    const doypack = config.doypackBagCop ?? prev.doypackBagCop;
    const label = config.frontBackLabelCop ?? prev.frontBackLabelCop;
    const labor = config.assemblyLaborCop ?? prev.assemblyLaborCop;
    const base = doypack + label + labor;

    this.db.indirectCost = {
      doypackBagCop: doypack,
      frontBackLabelCop: label,
      assemblyLaborCop: labor,
      packagingBaseCop: base,
    };
    this.notify();
  }

  /**
   * Calculate kit cost based on current dehydrated fruit prices & indirect packaging
   */
  public calculateKitCost(kit: ProductKit): {
    fruitCostCop: number;
    packagingCostCop: number;
    totalCostCop: number;
    pvpCop: number;
    grossProfitCop: number;
    grossMarginPct: number;
    recipeDetails: { name: string; grams: number; costPerGram: number; subtotal: number }[];
  } {
    const packagingCostCop = this.db.indirectCost.packagingBaseCop;
    let fruitCostCop = 0;

    const recipeDetails = kit.recipe.map((ing) => {
      const dehidItem = this.db.dehydratedFruits.find((df) => df.id === ing.dehydratedFruitId);
      const costPerGram = dehidItem ? dehidItem.costPerGramCop : 25;
      const subtotal = Math.round(ing.gramsNeeded * costPerGram);
      fruitCostCop += subtotal;
      return {
        name: ing.dehydratedFruitName,
        grams: ing.gramsNeeded,
        costPerGram,
        subtotal,
      };
    });

    const totalCostCop = fruitCostCop + packagingCostCop;
    const pvpCop = kit.pvpCop;
    const grossProfitCop = pvpCop - totalCostCop;
    const grossMarginPct = pvpCop > 0 ? Number(((grossProfitCop / pvpCop) * 100).toFixed(1)) : 0;

    return {
      fruitCostCop,
      packagingCostCop,
      totalCostCop,
      pvpCop,
      grossProfitCop,
      grossMarginPct,
      recipeDetails,
    };
  }

  /**
   * Register a new fruit item dynamically in the catalog (both fresh & dehydrated)
   */
  public registerNewFruit(data: {
    name: string;
    variety?: string;
    origin?: string;
    typicalBrix?: number;
    expectedShrinkagePct?: number;
    initialCostPerKgCop?: number;
  }): FruitItem {
    const trimmed = data.name.trim();
    if (!trimmed) throw new Error('El nombre de la fruta es obligatorio.');

    const exists = this.db.fruits.some((f) => f.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      throw new Error(`La fruta "${trimmed}" ya existe en la lista.`);
    }

    const code = `FRU-${trimmed.slice(0, 3).toUpperCase()}-${String(this.db.fruits.length + 1).padStart(2, '0')}`;
    const fruitId = `fruta_${Date.now()}`;
    const shrinkagePct = data.expectedShrinkagePct ?? 85.0;
    const initialCost = data.initialCostPerKgCop ?? 3000;

    const newFruit: FruitItem = {
      id: fruitId,
      code,
      name: trimmed,
      variety: data.variety?.trim() || 'Estándar',
      origin: data.origin?.trim() || 'Plaza de Mercado',
      typicalBrix: data.typicalBrix ?? 14.0,
      expectedShrinkagePct: shrinkagePct,
      currentStockKg: 0,
      averageCostPerKgCop: initialCost,
      active: true,
      colorHex: '#F59E0B',
    };

    // Calculate dry fruit initial cost based on shrinkage
    const dryYieldFactor = Math.max(0.05, (100 - shrinkagePct) / 100);
    const dryCostKg = Math.round((initialCost / dryYieldFactor) + 2000);

    const newDehydratedFruit: DehydratedFruitItem = {
      id: `deshid_${Date.now()}`,
      fruitId,
      name: `${trimmed} Deshidratado`,
      variety: newFruit.variety,
      currentStockKg: 0,
      averageCostPerKgCop: dryCostKg,
      costPerGramCop: Number((dryCostKg / 1000).toFixed(1)),
      active: true,
    };

    this.db.fruits.push(newFruit);
    this.db.dehydratedFruits.push(newDehydratedFruit);
    this.notify();
    return newFruit;
  }

  /**
   * Register a new Fresh Fruit Purchase at the Plaza de Mercado
   * Invariant: Updates fresh inventory and recalculates weighted average cost (PMP)
   */
  public registerPurchase(data: {
    date?: string;
    plazaMercado: string;
    fruitId: string;
    quantityKg: number;
    totalCostCop: number;
    invoiceRef?: string;
    notes?: string;
  }): FruitPurchase {
    if (data.quantityKg <= 0) {
      throw new Error('La cantidad comprada debe ser mayor a 0 kg.');
    }
    if (data.totalCostCop <= 0) {
      throw new Error('El costo total debe ser mayor a $0 COP.');
    }

    const fruit = this.db.fruits.find((f) => f.id === data.fruitId);
    if (!fruit) {
      throw new Error('La fruta seleccionada no existe en el catálogo.');
    }

    const unitCostPerKgCop = Math.round(data.totalCostCop / data.quantityKg);
    const purchaseCode = `COM-${new Date().getFullYear()}-${String(this.db.purchases.length + 42).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();
    const purchaseDate = data.date ? data.date : nowIso.split('T')[0];

    const newPurchase: FruitPurchase = {
      id: `compra_${Date.now()}`,
      purchaseCode,
      date: purchaseDate,
      plazaMercado: data.plazaMercado || 'Plaza Mayorista',
      fruitId: fruit.id,
      fruitName: fruit.name,
      quantityKg: data.quantityKg,
      totalCostCop: data.totalCostCop,
      unitCostPerKgCop,
      invoiceRef: data.invoiceRef || 'S/N',
      notes: data.notes || '',
      receivedBy: this.db.currentUser.name,
      createdAt: nowIso,
    };

    // Recalculate Weighted Average Cost (PMP)
    const prevStock = fruit.currentStockKg;
    const prevCost = fruit.averageCostPerKgCop;
    const newStock = prevStock + data.quantityKg;
    const newAvgCost = Math.round((prevStock * prevCost + data.totalCostCop) / newStock);

    fruit.currentStockKg = Number(newStock.toFixed(2));
    fruit.averageCostPerKgCop = newAvgCost;

    // Log Kardex
    const movement: InventoryMovement = {
      id: `mov_${Date.now()}`,
      timestamp: nowIso,
      itemType: 'FRUTA_FRESCA',
      itemId: fruit.id,
      itemName: fruit.name,
      movementType: 'COMPRA',
      quantityChange: data.quantityKg,
      unit: 'kg',
      previousStock: prevStock,
      newStock: fruit.currentStockKg,
      unitCostCop: unitCostPerKgCop,
      totalCostCop: data.totalCostCop,
      referenceDocument: purchaseCode,
      reason: `Compra en ${data.plazaMercado || 'Plaza de Mercado'} (${data.invoiceRef || 'Recibo simple'})`,
      responsibleUser: this.db.currentUser.name,
    };

    this.db.purchases.unshift(newPurchase);
    this.db.movements.unshift(movement);
    this.notify();
    return newPurchase;
  }

  /**
   * Register a Dehydration Batch
   * Invariant: Validates sufficient fresh fruit stock.
   * Decreases fresh stock and, if completed, increases dehydrated fruit stock and updates dry fruit PMP.
   */
  public registerBatch(data: {
    tunnelId: 'Túnel 1' | 'Túnel 2' | 'Túnel 3';
    fruitId: string;
    freshKgUsed: number;
    dryKgObtained?: number;
    energyTunnelCostCop?: number;
    temperatureC?: number;
    dryingDurationHours?: number;
    status: 'EN_SECADO' | 'COMPLETADO';
    notes?: string;
  }): DehydrationBatch {
    if (data.freshKgUsed <= 0) {
      throw new Error('La fruta fresca ingresada debe ser mayor a 0 kg.');
    }

    const fruit = this.db.fruits.find((f) => f.id === data.fruitId);
    if (!fruit) {
      throw new Error('Fruta no encontrada.');
    }

    if (fruit.currentStockKg < data.freshKgUsed) {
      throw new Error(
        `Inventario insuficiente de fruta fresca. Se requieren ${data.freshKgUsed} kg de ${fruit.name}, pero solo hay ${fruit.currentStockKg} kg disponibles.`
      );
    }

    const dehidFruit = this.db.dehydratedFruits.find((df) => df.fruitId === fruit.id);
    if (!dehidFruit) {
      throw new Error(`No se encontró el registro de fruta deshidratada asociado a ${fruit.name}.`);
    }

    const nowIso = new Date().toISOString();
    const batchCode = `#LT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(this.db.batches.length + 90).padStart(2, '0')}`;

    const freshUnitCost = fruit.averageCostPerKgCop;
    const totalFreshCost = Math.round(data.freshKgUsed * freshUnitCost);
    const energyCost = data.energyTunnelCostCop ?? 110000;

    // Deduct fresh fruit stock
    const prevFreshStock = fruit.currentStockKg;
    fruit.currentStockKg = Number((fruit.currentStockKg - data.freshKgUsed).toFixed(2));

    // Kardex: Fresh fruit consumption
    const freshOutMovement: InventoryMovement = {
      id: `mov_out_${Date.now()}`,
      timestamp: nowIso,
      itemType: 'FRUTA_FRESCA',
      itemId: fruit.id,
      itemName: fruit.name,
      movementType: 'PRODUCCION_SALIDA',
      quantityChange: -data.freshKgUsed,
      unit: 'kg',
      previousStock: prevFreshStock,
      newStock: fruit.currentStockKg,
      unitCostCop: freshUnitCost,
      totalCostCop: totalFreshCost,
      referenceDocument: batchCode,
      reason: `Carga a ${data.tunnelId} para proceso de secado`,
      responsibleUser: this.db.currentUser.name,
    };
    this.db.movements.unshift(freshOutMovement);

    const isCompleted = data.status === 'COMPLETADO' && (data.dryKgObtained ?? 0) > 0;
    const dryKg = isCompleted ? (data.dryKgObtained as number) : Number(((data.freshKgUsed * (100 - fruit.expectedShrinkagePct)) / 100).toFixed(1));
    const yieldPct = Number(((dryKg / data.freshKgUsed) * 100).toFixed(1));
    const shrinkagePct = Number((100 - yieldPct).toFixed(1));

    const totalBatchCost = totalFreshCost + energyCost;
    const costPerDryKgCop = dryKg > 0 ? Math.round(totalBatchCost / dryKg) : 0;
    const costPerDryGramCop = Number((costPerDryKgCop / 1000).toFixed(1));

    if (isCompleted) {
      // Add dehydrated fruit to warehouse
      const prevDryStock = dehidFruit.currentStockKg;
      const prevDryCost = dehidFruit.averageCostPerKgCop;
      const newDryStock = Number((prevDryStock + dryKg).toFixed(2));
      const newWeightedDryCost = Math.round((prevDryStock * prevDryCost + totalBatchCost) / newDryStock);

      dehidFruit.currentStockKg = newDryStock;
      dehidFruit.averageCostPerKgCop = newWeightedDryCost;
      dehidFruit.costPerGramCop = Number((newWeightedDryCost / 1000).toFixed(1));

      // Kardex: Dehydrated fruit entrance
      const dryInMovement: InventoryMovement = {
        id: `mov_in_${Date.now()}`,
        timestamp: nowIso,
        itemType: 'FRUTA_DESHIDRATADA',
        itemId: dehidFruit.id,
        itemName: dehidFruit.name,
        movementType: 'PRODUCCION_ENTRADA',
        quantityChange: dryKg,
        unit: 'kg',
        previousStock: prevDryStock,
        newStock: newDryStock,
        unitCostCop: costPerDryKgCop,
        totalCostCop: totalBatchCost,
        referenceDocument: batchCode,
        reason: `Salida de deshidratador ${data.tunnelId} finalizada con éxito`,
        responsibleUser: this.db.currentUser.name,
      };
      this.db.movements.unshift(dryInMovement);
    }

    const newBatch: DehydrationBatch = {
      id: `batch_${Date.now()}`,
      batchCode,
      date: nowIso.split('T')[0],
      tunnelId: data.tunnelId,
      fruitId: fruit.id,
      fruitName: fruit.name,
      variety: fruit.variety,
      origin: fruit.origin,
      freshKgUsed: data.freshKgUsed,
      freshFruitUnitCostCop: freshUnitCost,
      totalFreshFruitCostCop: totalFreshCost,
      energyTunnelCostCop: energyCost,
      dryKgObtained: dryKg,
      yieldPercentage: yieldPct,
      shrinkagePercentage: shrinkagePct,
      costPerDryKgCop,
      costPerDryGramCop,
      temperatureC: data.temperatureC ?? 58,
      dryingDurationHours: data.dryingDurationHours ?? 36,
      status: data.status,
      notes: data.notes || '',
      operatorName: this.db.currentUser.name,
      createdAt: nowIso,
    };

    this.db.batches.unshift(newBatch);
    this.notify();
    return newBatch;
  }

  /**
   * Finalize an in-progress dehydration batch
   */
  public finalizeBatch(batchId: string, dryKgObtained: number, notes?: string): DehydrationBatch {
    const batch = this.db.batches.find((b) => b.id === batchId);
    if (!batch) throw new Error('Lote no encontrado.');
    if (batch.status === 'COMPLETADO') throw new Error('El lote ya se encuentra completado.');
    if (dryKgObtained <= 0) throw new Error('Los kg deshidratados deben ser mayores a 0.');

    const dehidFruit = this.db.dehydratedFruits.find((df) => df.fruitId === batch.fruitId);
    if (!dehidFruit) throw new Error('Registro de fruta deshidratada no encontrado.');

    const nowIso = new Date().toISOString();
    const yieldPct = Number(((dryKgObtained / batch.freshKgUsed) * 100).toFixed(1));
    const shrinkagePct = Number((100 - yieldPct).toFixed(1));
    const totalBatchCost = batch.totalFreshFruitCostCop + batch.energyTunnelCostCop;
    const costPerDryKgCop = Math.round(totalBatchCost / dryKgObtained);
    const costPerDryGramCop = Number((costPerDryKgCop / 1000).toFixed(1));

    // Update Dehydrated fruit stock & PMP
    const prevDryStock = dehidFruit.currentStockKg;
    const newDryStock = Number((prevDryStock + dryKgObtained).toFixed(2));
    const newWeightedDryCost = Math.round((prevDryStock * dehidFruit.averageCostPerKgCop + totalBatchCost) / newDryStock);

    dehidFruit.currentStockKg = newDryStock;
    dehidFruit.averageCostPerKgCop = newWeightedDryCost;
    dehidFruit.costPerGramCop = Number((newWeightedDryCost / 1000).toFixed(1));

    // Kardex
    const dryInMovement: InventoryMovement = {
      id: `mov_in_${Date.now()}`,
      timestamp: nowIso,
      itemType: 'FRUTA_DESHIDRATADA',
      itemId: dehidFruit.id,
      itemName: dehidFruit.name,
      movementType: 'PRODUCCION_ENTRADA',
      quantityChange: dryKgObtained,
      unit: 'kg',
      previousStock: prevDryStock,
      newStock: newDryStock,
      unitCostCop: costPerDryKgCop,
      totalCostCop: totalBatchCost,
      referenceDocument: batch.batchCode,
      reason: `Pesaje final de lote en ${batch.tunnelId}`,
      responsibleUser: this.db.currentUser.name,
    };
    this.db.movements.unshift(dryInMovement);

    batch.dryKgObtained = dryKgObtained;
    batch.yieldPercentage = yieldPct;
    batch.shrinkagePercentage = shrinkagePct;
    batch.costPerDryKgCop = costPerDryKgCop;
    batch.costPerDryGramCop = costPerDryGramCop;
    batch.status = 'COMPLETADO';
    if (notes) batch.notes = `${batch.notes} | ${notes}`;

    this.notify();
    return batch;
  }

  /**
   * Kit Assembly (Fabricación de Kits)
   * Validates available dehydrated fruit stock before deducting.
   */
  public assembleKits(kitId: string, quantityUnits: number, notes?: string): KitAssemblyRecord {
    if (quantityUnits <= 0) {
      throw new Error('La cantidad de kits a armar debe ser al menos 1 unidad.');
    }

    const kit = this.db.kits.find((k) => k.id === kitId);
    if (!kit) throw new Error('Kit no encontrado.');

    // Pre-flight check: ensure enough dehydrated fruit exists for all BOM ingredients
    for (const ingredient of kit.recipe) {
      const dehidItem = this.db.dehydratedFruits.find((df) => df.id === ingredient.dehydratedFruitId);
      if (!dehidItem) {
        throw new Error(`Ingrediente ${ingredient.dehydratedFruitName} no encontrado.`);
      }

      const totalGramsNeeded = ingredient.gramsNeeded * quantityUnits;
      const totalKgNeeded = totalGramsNeeded / 1000;

      if (dehidItem.currentStockKg < totalKgNeeded) {
        throw new Error(
          `Inventario insuficiente para ${dehidItem.name}. Se requieren ${totalGramsNeeded} g (${totalKgNeeded.toFixed(2)} kg) para fabricar ${quantityUnits} kits de ${kit.name}, pero solo hay ${dehidItem.currentStockKg} kg disponibles.`
        );
      }
    }

    const nowIso = new Date().toISOString();
    const assemblyCode = `ENS-${new Date().getFullYear()}-${String(this.db.assemblies.length + 24).padStart(3, '0')}`;
    let totalFruitCostCop = 0;
    const ingredientsConsumed = [];

    // Deduct each ingredient
    for (const ingredient of kit.recipe) {
      const dehidItem = this.db.dehydratedFruits.find((df) => df.id === ingredient.dehydratedFruitId)!;
      const totalGramsNeeded = ingredient.gramsNeeded * quantityUnits;
      const totalKgNeeded = totalGramsNeeded / 1000;
      const costCop = Math.round(totalGramsNeeded * dehidItem.costPerGramCop);
      totalFruitCostCop += costCop;

      const prevStock = dehidItem.currentStockKg;
      dehidItem.currentStockKg = Number((dehidItem.currentStockKg - totalKgNeeded).toFixed(2));

      // Kardex: ingredient consumption
      const mov: InventoryMovement = {
        id: `mov_ing_${Date.now()}_${ingredient.id}`,
        timestamp: nowIso,
        itemType: 'FRUTA_DESHIDRATADA',
        itemId: dehidItem.id,
        itemName: dehidItem.name,
        movementType: 'ENSAMBLE_SALIDA',
        quantityChange: -totalKgNeeded,
        unit: 'kg',
        previousStock: prevStock,
        newStock: dehidItem.currentStockKg,
        unitCostCop: dehidItem.averageCostPerKgCop,
        totalCostCop: costCop,
        referenceDocument: assemblyCode,
        reason: `Consumo para ensamble de ${quantityUnits} kits de ${kit.name}`,
        responsibleUser: this.db.currentUser.name,
      };
      this.db.movements.unshift(mov);

      ingredientsConsumed.push({
        dehydratedFruitId: dehidItem.id,
        fruitName: dehidItem.name,
        totalGramsConsumed: totalGramsNeeded,
        costCop,
      });
    }

    // Packaging and Assembly Labor cost
    const packagingCostCop = this.db.indirectCost.packagingBaseCop * quantityUnits;
    const totalAssemblyCostCop = totalFruitCostCop + packagingCostCop;
    const unitCostCop = Math.round(totalAssemblyCostCop / quantityUnits);

    // Increase kit stock
    const prevKitStock = kit.currentStockUnits;
    kit.currentStockUnits += quantityUnits;

    // Kardex: Finished kit entrance
    const kitInMovement: InventoryMovement = {
      id: `mov_kit_${Date.now()}`,
      timestamp: nowIso,
      itemType: 'KIT_FINAL',
      itemId: kit.id,
      itemName: kit.name,
      movementType: 'ENSAMBLE_ENTRADA',
      quantityChange: quantityUnits,
      unit: 'und',
      previousStock: prevKitStock,
      newStock: kit.currentStockUnits,
      unitCostCop,
      totalCostCop: totalAssemblyCostCop,
      referenceDocument: assemblyCode,
      reason: `Ensamble de ${quantityUnits} unidades de ${kit.presentation}`,
      responsibleUser: this.db.currentUser.name,
    };
    this.db.movements.unshift(kitInMovement);

    const assemblyRecord: KitAssemblyRecord = {
      id: `ens_${Date.now()}`,
      assemblyCode,
      date: nowIso.split('T')[0],
      kitId: kit.id,
      kitName: kit.name,
      presentation: kit.presentation,
      quantityProduced: quantityUnits,
      unitCostCop,
      totalCostCop: totalAssemblyCostCop,
      ingredientsConsumed,
      packagingCostCop,
      notes: notes || 'Ensamble en mesa de empaque con termosellado.',
      operatorName: this.db.currentUser.name,
      createdAt: nowIso,
    };

    this.db.assemblies.unshift(assemblyRecord);
    this.notify();
    return assemblyRecord;
  }

  /**
   * Process a Sale Order
   * Validates available kit inventory.
   * Freezes historical price and cost in the order lines so future price edits don't tamper history.
   */
  public registerSale(data: {
    customerId: string;
    items: { kitId: string; quantity: number }[];
    paymentMethod: 'Efectivo' | 'Transferencia Bancolombia' | 'Nequi' | 'Daviplata' | 'Tarjeta Débito/Crédito';
    notes?: string;
  }): SaleOrder {
    if (!data.items || data.items.length === 0) {
      throw new Error('Debe agregar al menos un producto a la venta.');
    }

    const customer = this.db.customers.find((c) => c.id === data.customerId);
    if (!customer) throw new Error('Cliente no seleccionado o inexistente.');

    // Pre-flight check: stock availability
    for (const item of data.items) {
      if (item.quantity <= 0) throw new Error('La cantidad debe ser mayor a 0.');
      const kit = this.db.kits.find((k) => k.id === item.kitId);
      if (!kit) throw new Error('Producto no encontrado.');

      if (kit.currentStockUnits < item.quantity) {
        throw new Error(
          `Inventario insuficiente para "${kit.name}". Se solicitaron ${item.quantity} unidades, pero solo hay ${kit.currentStockUnits} en stock.`
        );
      }
    }

    const nowIso = new Date().toISOString();
    const invoiceNumber = `FD-VENTA-${String(this.db.sales.length + 105).padStart(5, '0')}`;

    let subtotalCop = 0;
    let totalCogsCop = 0;
    const saleOrderItems: SaleOrderItem[] = [];

    // Process line items with frozen historical values
    for (const item of data.items) {
      const kit = this.db.kits.find((k) => k.id === item.kitId)!;
      const kitCostInfo = this.calculateKitCost(kit);

      const unitPriceCop = kit.pvpCop;
      const unitCostCop = kitCostInfo.totalCostCop;
      const itemSubtotal = unitPriceCop * item.quantity;
      const itemCostTotal = unitCostCop * item.quantity;

      subtotalCop += itemSubtotal;
      totalCogsCop += itemCostTotal;

      // Deduct kit stock
      const prevStock = kit.currentStockUnits;
      kit.currentStockUnits -= item.quantity;

      // Kardex: kit sale deduction
      const mov: InventoryMovement = {
        id: `mov_sale_${Date.now()}_${kit.id}`,
        timestamp: nowIso,
        itemType: 'KIT_FINAL',
        itemId: kit.id,
        itemName: kit.name,
        movementType: 'VENTA',
        quantityChange: -item.quantity,
        unit: 'und',
        previousStock: prevStock,
        newStock: kit.currentStockUnits,
        unitCostCop,
        totalCostCop: itemCostTotal,
        referenceDocument: invoiceNumber,
        reason: `Venta a ${customer.name} (${invoiceNumber})`,
        responsibleUser: this.db.currentUser.name,
      };
      this.db.movements.unshift(mov);

      saleOrderItems.push({
        kitId: kit.id,
        kitCode: kit.code,
        kitName: kit.name,
        presentation: kit.presentation,
        unitPriceCop,
        unitCostCop,
        quantity: item.quantity,
        subtotalCop: itemSubtotal,
        totalCostCop: itemCostTotal,
      });
    }

    const discountCop = 0;
    const totalCop = subtotalCop - discountCop;
    const grossProfitCop = totalCop - totalCogsCop;
    const grossMarginPct = totalCop > 0 ? Number(((grossProfitCop / totalCop) * 100).toFixed(1)) : 0;

    // Update customer stats
    customer.ordersCount += 1;
    customer.totalSpentCop += totalCop;

    const newSale: SaleOrder = {
      id: `sale_${Date.now()}`,
      invoiceNumber,
      date: nowIso.split('T')[0],
      customerId: customer.id,
      customerName: customer.name,
      customerTaxId: customer.taxId,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerAddress: customer.address,
      customerCity: customer.city,
      items: saleOrderItems,
      subtotalCop,
      discountCop,
      totalCop,
      totalCogsCop,
      grossProfitCop,
      grossMarginPct,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'PAGADO',
      cashierName: this.db.currentUser.name,
      notes: data.notes || '',
      createdAt: nowIso,
    };

    this.db.sales.unshift(newSale);
    this.notify();
    return newSale;
  }

  /**
   * Register manual inventory adjustment (audit trail)
   */
  public registerInventoryAdjustment(data: {
    itemType: 'FRUTA_FRESCA' | 'FRUTA_DESHIDRATADA' | 'KIT_FINAL';
    itemId: string;
    newQuantity: number;
    reason: string;
  }): void {
    if (data.newQuantity < 0) {
      throw new Error('El nuevo inventario no puede ser negativo.');
    }
    if (!data.reason.trim()) {
      throw new Error('Debe especificar un motivo formal para el ajuste.');
    }

    const nowIso = new Date().toISOString();
    let itemName = '';
    let prevStock = 0;
    let unit: 'kg' | 'und' = 'kg';
    let unitCostCop = 0;

    if (data.itemType === 'FRUTA_FRESCA') {
      const f = this.db.fruits.find((x) => x.id === data.itemId);
      if (!f) throw new Error('Fruta fresca no encontrada.');
      itemName = f.name;
      prevStock = f.currentStockKg;
      f.currentStockKg = data.newQuantity;
      unit = 'kg';
      unitCostCop = f.averageCostPerKgCop;
    } else if (data.itemType === 'FRUTA_DESHIDRATADA') {
      const df = this.db.dehydratedFruits.find((x) => x.id === data.itemId);
      if (!df) throw new Error('Fruta deshidratada no encontrada.');
      itemName = df.name;
      prevStock = df.currentStockKg;
      df.currentStockKg = data.newQuantity;
      unit = 'kg';
      unitCostCop = df.averageCostPerKgCop;
    } else if (data.itemType === 'KIT_FINAL') {
      const k = this.db.kits.find((x) => x.id === data.itemId);
      if (!k) throw new Error('Kit no encontrado.');
      itemName = k.name;
      prevStock = k.currentStockUnits;
      k.currentStockUnits = Math.round(data.newQuantity);
      unit = 'und';
      unitCostCop = this.calculateKitCost(k).totalCostCop;
    }

    const delta = data.newQuantity - prevStock;
    if (delta === 0) return;

    const movType = delta > 0 ? 'AJUSTE_POSITIVO' : 'AJUSTE_NEGATIVO';
    const totalCostCop = Math.abs(delta) * unitCostCop;

    const mov: InventoryMovement = {
      id: `mov_adj_${Date.now()}`,
      timestamp: nowIso,
      itemType: data.itemType,
      itemId: data.itemId,
      itemName,
      movementType: movType,
      quantityChange: delta,
      unit,
      previousStock: prevStock,
      newStock: data.newQuantity,
      unitCostCop,
      totalCostCop,
      referenceDocument: `AJU-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      reason: data.reason,
      responsibleUser: this.db.currentUser.name,
    };

    this.db.movements.unshift(mov);
    this.notify();
  }

  /**
   * Create or update customer
   */
  public saveCustomer(data: {
    id?: string;
    name: string;
    taxId: string;
    email: string;
    phone: string;
    city: string;
    address: string;
  }): Customer {
    if (!data.name.trim()) throw new Error('El nombre del cliente es obligatorio.');
    if (!data.taxId.trim()) throw new Error('El documento o NIT es obligatorio.');

    if (data.id) {
      const existing = this.db.customers.find((c) => c.id === data.id);
      if (!existing) throw new Error('Cliente no encontrado.');
      existing.name = data.name;
      existing.taxId = data.taxId;
      existing.email = data.email;
      existing.phone = data.phone;
      existing.city = data.city;
      existing.address = data.address;
      this.notify();
      return existing;
    } else {
      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        name: data.name,
        taxId: data.taxId,
        email: data.email,
        phone: data.phone,
        city: data.city,
        address: data.address,
        active: true,
        ordersCount: 0,
        totalSpentCop: 0,
        createdAt: new Date().toISOString(),
      };
      this.db.customers.push(newCust);
      this.notify();
      return newCust;
    }
  }

  /**
   * Update or create product kit
   */
  public saveKit(data: {
    id?: string;
    code: string;
    name: string;
    presentation: string;
    category: 'Infusiones' | 'Coctelería' | 'Snacks';
    description: string;
    netWeightGrams: number;
    pvpCop: number;
    minStockAlert: number;
    imageUrl?: string;
    recipe: { dehydratedFruitId: string; gramsNeeded: number }[];
  }): ProductKit {
    if (!data.name.trim()) throw new Error('El nombre del producto es obligatorio.');
    if (data.pvpCop < 0) throw new Error('El precio de venta no puede ser negativo.');
    if (!data.recipe || data.recipe.length === 0) {
      throw new Error('El kit debe tener al menos un ingrediente en su receta.');
    }

    const recipeWithNames = data.recipe.map((r, idx) => {
      const df = this.db.dehydratedFruits.find((x) => x.id === r.dehydratedFruitId);
      return {
        id: `rec_${Date.now()}_${idx}`,
        dehydratedFruitId: r.dehydratedFruitId,
        dehydratedFruitName: df ? df.name : 'Fruta Deshidratada',
        gramsNeeded: r.gramsNeeded,
      };
    });

    const nowIso = new Date().toISOString();

    if (data.id) {
      const existing = this.db.kits.find((k) => k.id === data.id);
      if (!existing) throw new Error('Kit no encontrado.');
      existing.code = data.code;
      existing.name = data.name;
      existing.presentation = data.presentation;
      existing.category = data.category;
      existing.description = data.description;
      existing.netWeightGrams = data.netWeightGrams;
      existing.pvpCop = data.pvpCop;
      existing.minStockAlert = data.minStockAlert;
      if (data.imageUrl) existing.imageUrl = data.imageUrl;
      existing.recipe = recipeWithNames;
      existing.updatedAt = nowIso;
      this.notify();
      return existing;
    } else {
      const newKit: ProductKit = {
        id: `kit_${Date.now()}`,
        code: data.code,
        name: data.name,
        presentation: data.presentation,
        category: data.category,
        description: data.description,
        netWeightGrams: data.netWeightGrams,
        pvpCop: data.pvpCop,
        currentStockUnits: 0,
        minStockAlert: data.minStockAlert,
        recipe: recipeWithNames,
        imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?auto=format&fit=crop&w=600&q=80',
        active: true,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      this.db.kits.push(newKit);
      this.notify();
      return newKit;
    }
  }
}

export const fruitDesertService = new FruitDesertService();
