import { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth'; 
import { LandingPage } from '@/pages/LandingPage';
import { GuestPortal } from '@/pages/GuestPortal';
import { FrontDeskDashboard } from '@/pages/FrontDeskDashboard';
import { KitchenDisplay } from '@/pages/KitchenDisplay';
import { ServiceDashboard } from '@/pages/ServiceDashboard';
import { MaintenancePortal } from '@/pages/MaintenancePortal';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { RegistrationPage } from '@/pages/RegistrationPage'; // Standardized Name
import { Button } from '@/components/ui/button';
import { LogOut, User, Loader2 } from 'lucide-react';
import './App.css';

function RoleBasedRoute() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1e3a5f] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-lg font-serif">Loading Azure Horizon...</p>
      </div>
    );
  }

  // Redirect to Landing Page or Registration Page if not logged in
  if (!isAuthenticated || !user) {
    return isRegistering ? (
      <RegistrationPage onBack={() => setIsRegistering(false)} />
    ) : (
      <LandingPage onRegisterClick={() => setIsRegistering(true)} />
    );
  }

  const handleLogout = () => setShowLogoutConfirm(true);
  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };
  const cancelLogout = () => setShowLogoutConfirm(false);

  const renderDashboard = () => {
    switch (user.role as string) {
      case 'guest': return <GuestPortal />;
      case 'front_desk': return <FrontDeskDashboard />;
      case 'chef': return <KitchenDisplay />;
      case 'waitstaff': 
      case 'delivery': return <ServiceDashboard />;
      case 'maintenance': return <MaintenancePortal />;
      case 'admin': return <AdminDashboard />;
      default: return <LandingPage onRegisterClick={() => setIsRegistering(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-serif font-semibold text-[#1e3a5f]">Azure Horizon</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user.name}</span>
                <span className="px-2 py-0.5 bg-[#1e3a5f] text-white text-xs rounded-full capitalize">
                  {user.role?.replace('_', ' ')}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600">
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 shadow-lg w-11/12 max-w-sm">
            <p className="text-lg font-medium text-gray-800 mb-4 text-center">Are you sure you want to log out?</p>
            <div className="flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={cancelLogout}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={confirmLogout}>Log out</Button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">{renderDashboard()}</main>

      <footer className="bg-[#1e3a5f] text-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 Azure Horizon Resort.</p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <RoleBasedRoute />
      </AuthProvider>
    </Router>
  );
}

export default App;