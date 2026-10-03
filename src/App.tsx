import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { AgroIndustrialDashboard } from './components/dashboard/AgroIndustrialDashboard';
import { ProductionModule } from './components/production/ProductionModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { PurchasesModule } from './components/purchases/PurchasesModule';
import { SalesModule } from './components/sales/SalesModule';
import { CustomersModule } from './components/customers/CustomersModule';
import { KitAssemblyModule } from './components/assemblies/KitAssemblyModule';
import { ClientPortalView } from './components/catalog/ClientPortalView';
import { SupabaseArchitectureView } from './components/database/SupabaseArchitectureView';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { fruitDesertService, resetDatabaseToDefaults } from './services/store';

export type AppViewMode = 'landing' | 'login' | 'erp';

export default function App() {
  const [db, setDb] = useState(() => fruitDesertService.getDb());
  const [currentView, setCurrentView] = useState<AppViewMode>('landing');
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [preselectedKitId, setPreselectedKitId] = useState<string | undefined>(undefined);

  // Subscribe to reactive store changes
  useEffect(() => {
    const unsubscribe = fruitDesertService.subscribe(() => {
      setDb({ ...fruitDesertService.getDb() });
    });
    return () => unsubscribe();
  }, []);

  const currentUser = db.currentUser;
  const isAdmin = currentUser.role === 'ADMIN';

  // Handle role switching
  const handleSwitchRole = (role: 'ADMIN' | 'CLIENTE') => {
    fruitDesertService.switchRole(role);
    if (role === 'CLIENTE') {
      setCurrentTab('client_portal');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleResetData = () => {
    const freshDb = resetDatabaseToDefaults();
    setDb({ ...freshDb });
    setCurrentTab('dashboard');
  };

  const handleNavigateToProduction = () => {
    setCurrentTab('production');
  };

  const handleNavigateToAssemblies = (kitId?: string) => {
    if (kitId) setPreselectedKitId(kitId);
    setCurrentTab('assemblies');
  };

  const handleNavigateToSales = () => {
    setCurrentTab('sales');
  };

  const handleLoginSuccess = (user: typeof currentUser) => {
    if (user.role === 'CLIENTE') {
      setCurrentTab('client_portal');
    } else {
      setCurrentTab('dashboard');
    }
    setCurrentView('erp');
  };

  const handleLogout = () => {
    setCurrentView('landing');
  };

  // 1. Landing Page View
  if (currentView === 'landing') {
    return (
      <LandingPage
        kits={db.kits}
        onGoToLogin={() => setCurrentView('login')}
        onGoToErp={() => setCurrentView('erp')}
      />
    );
  }

  // 2. Login View
  if (currentView === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToLanding={() => setCurrentView('landing')}
        initialRole={currentUser.role}
      />
    );
  }

  // 3. Operations ERP View
  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col md:flex-row antialiased text-[#181C1F]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setPreselectedKitId(undefined);
          setCurrentTab(tab);
        }}
        userRole={currentUser.role}
        onResetData={handleResetData}
        onGoToLanding={() => setCurrentView('landing')}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeBatchCode="#LT-2024-10-89"
          onNavigateToProduction={handleNavigateToProduction}
          onGoToLanding={() => setCurrentView('landing')}
          onLogout={handleLogout}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* If role is CLIENTE, always restrict to Client Portal to demonstrate RLS enforcement */}
          {!isAdmin ? (
            <ClientPortalView
              db={db}
              onSwitchToAdmin={() => handleSwitchRole('ADMIN')}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <AgroIndustrialDashboard
                  db={db}
                  onNavigateToProduction={handleNavigateToProduction}
                  onNavigateToAssemblies={handleNavigateToAssemblies}
                  onNavigateToSales={handleNavigateToSales}
                />
              )}

              {currentTab === 'production' && (
                <ProductionModule db={db} />
              )}

              {currentTab === 'inventory' && (
                <InventoryModule db={db} />
              )}

              {currentTab === 'assemblies' && (
                <KitAssemblyModule
                  db={db}
                  initialKitId={preselectedKitId}
                />
              )}

              {currentTab === 'purchases' && (
                <PurchasesModule db={db} />
              )}

              {currentTab === 'sales' && (
                <SalesModule db={db} />
              )}

              {currentTab === 'customers' && (
                <CustomersModule db={db} />
              )}

              {currentTab === 'database' && (
                <SupabaseArchitectureView />
              )}

              {currentTab === 'client_portal' && (
                <ClientPortalView
                  db={db}
                  onSwitchToAdmin={() => setCurrentTab('dashboard')}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

