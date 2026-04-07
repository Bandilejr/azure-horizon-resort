import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { listenForGuestBooking } from '@/services/firebase-services';
import { BookingEngine } from '@/components/guest/BookingEngine';
import { RoomService } from '@/components/guest/RoomService';
import { Restaurant } from '@/components/guest/Restaurant';
import { GuestExperience } from '@/components/guest/GuestExperience';
import { BillingView } from '@/components/guest/BillingView';
import { MyReservations } from '@/components/guest/MyReservations';
import { MyOrders } from '@/components/guest/MyOrders';
import { MyTableReservations } from '@/components/guest/MyTableReservations';
import { RoomGallery } from '@/components/guest/RoomGallery';
import { AlertModal } from '@/components/ui/AlertModal';
import type { Booking, User as AppUser } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Home, 
  UtensilsCrossed, 
  MessageSquare, 
  User,
  Clock,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Lock,
  ShieldCheck,
  Info,
  ClipboardList,
  Package,
  BedDouble
} from 'lucide-react';

type GuestView = 'overview' | 'booking' | 'room-service' | 'restaurant' | 'experience' | 'billing' | 'reservations' | 'my-orders' | 'my-tables' | 'room-gallery';

type AuthUserBridge = AppUser & { uid?: string };

export function GuestPortal() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<GuestView>('overview');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const currentUser = user as AuthUserBridge;
  const currentUserId = currentUser?.id || currentUser?.uid;

  const isResident = currentUser?.status === 'resident';
  const isElevatedGuest = currentUser?.status === 'visitor' || currentUser?.status === 'resident';

  // Alert modal state
  const [bookingAlert, setBookingAlert] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    
    const unsubscribe = listenForGuestBooking(currentUserId, (booking) => {
      if (isMounted) {
        setActiveBooking(booking);
        setIsLoading(false);
      }
    });

    const timeoutId = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [currentUserId]);

  const handleActionClick = (viewId: GuestView) => {
    // Only allow booking for registered users (have email) OR residents
    if (viewId === 'booking') {
      const isRegisteredUser = currentUser?.email && currentUser.email !== '';
      
      if (!isRegisteredUser && !isResident) {
        setBookingAlert({
          open: true,
          title: "🔒 Registration Required",
          message: "Room booking is only available for registered members.\n\nPlease click 'Create Member Account' on the login page to register, then log in to book your stay.",
          type: "warning"
        });
        return;
      }
    }
    
    // Existing restrictions
    if (viewId === 'room-service' || viewId === 'experience' || viewId === 'billing') {
      if (!isResident) {
        setBookingAlert({
          open: true,
          title: "⛔ Access Restricted",
          message: "This feature is exclusively for guests currently checked into a room.\n\nPlease check in at the front desk to access room service, concierge, and billing.",
          type: "warning"
        });
        return;
      }
    }
    setCurrentView(viewId);
  };

  const renderView = () => {
    switch (currentView) {
      case 'booking': return <BookingEngine onBack={() => setCurrentView('overview')} />;
      case 'room-service': return <RoomService onBack={() => setCurrentView('overview')} />;
      case 'restaurant': return <Restaurant onBack={() => setCurrentView('overview')} />;
      case 'experience': return <GuestExperience onBack={() => setCurrentView('overview')} />;
      case 'billing': return <BillingView onBack={() => setCurrentView('overview')} />;
      case 'reservations': return <MyReservations onBack={() => setCurrentView('overview')} />;
      case 'my-orders': return <MyOrders onBack={() => setCurrentView('overview')} />;
      case 'my-tables': return <MyTableReservations onBack={() => setCurrentView('overview')} />;
      case 'room-gallery': return <RoomGallery onBack={() => setCurrentView('overview')} />;
      default: return null;
    }
  };

  if (currentView !== 'overview') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
        <Button
          variant="ghost"
          onClick={() => setCurrentView('overview')}
          className="mb-4 text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
        {renderView()}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Alert Modal */}
      <AlertModal
        open={bookingAlert.open}
        onClose={() => setBookingAlert(prev => ({ ...prev, open: false }))}
        title={bookingAlert.title}
        message={bookingAlert.message}
        type={bookingAlert.type}
      />

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1e3a5f]">
            Welcome, {currentUser?.name || 'Guest'}!
          </h1>
          <p className="text-gray-600 mt-1 italic">Azure Horizon Resort Management Portal</p>
        </div>
        <div className="flex items-center gap-2">
          {isResident ? (
            <Badge className="bg-green-600 text-white border-none px-3 py-1 flex items-center gap-1 shadow-sm">
              <ShieldCheck className="h-3 w-3" /> Verified Resident
            </Badge>
          ) : isElevatedGuest ? (
            <Badge className="bg-[#1e3a5f] text-white border-none px-3 py-1 flex items-center gap-1 shadow-sm">
              <User className="h-3 w-3" /> Registered Member
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 px-3 py-1 flex items-center gap-1">
              <Info className="h-3 w-3" /> Visitor Mode
            </Badge>
          )}
        </div>
      </div>

      {isLoading ? (
        <Card className="mb-8 border-none shadow-sm bg-gray-50">
          <CardContent className="p-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#1e3a5f]" />
          </CardContent>
        </Card>
      ) : activeBooking ? (
        <Card className="mb-8 bg-gradient-to-r from-[#1e3a5f] to-[#2c5282] text-white border-0 shadow-xl overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-[#c9a227] text-white border-none">Active Reservation</Badge>
                  <span className="text-white/80 text-sm font-medium">
                    Room {currentUser?.roomNumber || activeBooking.roomNumber}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold">{activeBooking.roomName}</h2>
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-[#c9a227]" />
                    <span>{activeBooking.checkInDate} — {activeBooking.checkOutDate}</span>
                  </div>
                </div>
              </div>
              <Button 
                variant="secondary" 
                className="bg-white/10 text-white hover:bg-white/20 border-white/20 backdrop-blur-sm"
                onClick={() => setCurrentView('booking')}
              >
                Manage Booking
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 border-dashed border-2 border-gray-200 bg-gray-50/50">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">
              {currentUser?.status === 'visitor' 
                ? "You are logged in as a visitor. Ready to book your retreat?" 
                : "You are currently browsing. Sign up to book a room!"}
            </p>
            <Button className="bg-[#1e3a5f]" onClick={() => handleActionClick('booking')}>
              View Available Suites
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
        {[
          { id: 'booking', title: 'Suites & Villas', sub: activeBooking ? 'View Stay' : 'Book a Room', icon: Calendar, color: 'text-[#1e3a5f]', bg: 'bg-[#1e3a5f]/10', locked: false },
          { id: 'room-gallery', title: 'Room Gallery', sub: 'View All Rooms', icon: BedDouble, color: 'text-rose-600', bg: 'bg-rose-50', locked: false },
          { id: 'reservations', title: 'My Reservations', sub: 'View & Cancel Bookings', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50', locked: false },
          { id: 'my-orders', title: 'My Orders', sub: 'Track & Download', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', locked: false },
          { id: 'my-tables', title: 'My Tables', sub: 'View Reservations', icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-50', locked: false },
          { id: 'room-service', title: 'Room Service', sub: 'Housekeeping & Repairs', icon: Home, color: 'text-[#e07a5f]', bg: 'bg-[#e07a5f]/10', locked: !isResident },
          { id: 'restaurant', title: 'Restaurant', sub: 'Dine-in & Takeaway', icon: UtensilsCrossed, color: 'text-[#4a7c9b]', bg: 'bg-[#4a7c9b]/10', locked: false },
          { id: 'experience', title: 'Guest Concierge', sub: 'Live Chat Support', icon: MessageSquare, color: 'text-[#c9a227]', bg: 'bg-[#c9a227]/10', locked: !isResident },
          { id: 'billing', title: 'My Bill', sub: 'Slips & Balance', icon: ClipboardList, color: 'text-green-600', bg: 'bg-green-50', locked: !isResident }
        ].map((action) => (
          <Card 
            key={action.id}
            className={`group cursor-pointer hover:shadow-xl transition-all duration-300 border-none shadow-sm ring-1 ring-gray-100 relative ${action.locked ? 'opacity-70 grayscale-[0.5]' : ''}`}
            onClick={() => handleActionClick(action.id as GuestView)}
          >
            <CardContent className="p-6">
              {action.locked && (
                <div className="absolute top-4 right-4 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${action.bg} ${action.color}`}>
                <action.icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-[#c9a227] transition-colors flex items-center gap-2">
                {action.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{action.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <MapPin className="h-6 w-6 text-[#1e3a5f] mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">Resort Location</h3>
            <p className="text-xs text-gray-500">123 Paradise Drive, Coastal Bay</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <Clock className="h-6 w-6 text-[#1e3a5f] mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">Check-in / Out</h3>
            <p className="text-xs text-gray-500">In: 3:00 PM | Out: 11:00 AM</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <UtensilsCrossed className="h-6 w-6 text-[#1e3a5f] mb-4" />
            <h3 className="font-semibold text-gray-900 mb-1">Public Dining</h3>
            <p className="text-xs text-gray-500">Open to visitors: 08:00 — 22:00</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}