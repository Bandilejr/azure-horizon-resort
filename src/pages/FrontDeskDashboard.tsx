import { useState, useEffect } from 'react';
import { 
  listenForBookings, 
  listenForRooms, 
  updateBookingStatus,
  db
} from '@/services/firebase-services';
import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import type { Booking, Room } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertModal } from '@/components/ui/AlertModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { 
  Search, 
  LogIn, 
  LogOut, 
  CreditCard, 
  Key,
  Loader2,
  BedDouble,
  Users,
  Eye,
  Receipt,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Clock,
  Repeat,
  CalendarPlus,
  Printer,
  CheckCircle,
  Coffee,
  Wrench,
  Plus,
  Trash2,
  Send,
  Edit,
  XCircle
} from 'lucide-react';

interface IncidentalCharge {
  id: string;
  description: string;
  amount: number;
  date: string;
}

interface GuestBilling {
  roomCharges: number;
  incidentalCharges: IncidentalCharge[];
  total: number;
}

type RoomStatus = 'available' | 'occupied' | 'dirty' | 'maintenance';

interface RoomWithStatus extends Room {
  roomStatus: RoomStatus;
}

export function FrontDeskDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<RoomWithStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showGuestDetailsModal, setShowGuestDetailsModal] = useState(false);
  const [showRoomSwapModal, setShowRoomSwapModal] = useState(false);
  const [showExtendStayModal, setShowExtendStayModal] = useState(false);
  const [showRoomStatusModal, setShowRoomStatusModal] = useState(false);
  const [showEmailReceiptModal, setShowEmailReceiptModal] = useState(false);
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [guestBilling, setGuestBilling] = useState<GuestBilling | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [incidentalCharges, setIncidentalCharges] = useState<IncidentalCharge[]>([
    { id: '1', description: 'Mini Bar', amount: 45, date: new Date().toISOString() },
    { id: '2', description: 'Room Service', amount: 78, date: new Date().toISOString() },
  ]);
  const [extendDays, setExtendDays] = useState(1);
  const [keysReturned, setKeysReturned] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [showEarlyCheckoutModal, setShowEarlyCheckoutModal] = useState(false);
  
  // Alert Modal state
  const [alertModal, setAlertModal] = useState({
    open: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Edit booking state
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');

  useEffect(() => {
    const unsubscribeBookings = listenForBookings((updatedBookings) => {
      setBookings(updatedBookings);
    });

    const unsubscribeRooms = listenForRooms((updatedRooms) => {
      const roomsWithStatus: RoomWithStatus[] = updatedRooms.map(room => ({
        ...room,
        roomStatus: room.isAvailable ? 'available' : 'occupied'
      }));
      setRooms(roomsWithStatus);
    });
    
    return () => {
      unsubscribeBookings();
      unsubscribeRooms();
    };
  }, []);

  const getTotalIncidentalCharges = () => {
    return incidentalCharges.reduce((total, charge) => total + (charge.amount || 0), 0);
  };

  const filteredBookings = bookings.filter(booking => 
    booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.roomName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayCheckIns = bookings.filter(b => 
    b.status === 'confirmed' && 
    new Date(b.checkInDate).toDateString() === new Date().toDateString()
  );

  const todayCheckOuts = bookings.filter(b => 
    b.status === 'checked_in' && 
    new Date(b.checkOutDate).toDateString() === new Date().toDateString()
  );

  const getStatusBadge = (status: Booking['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      checked_in: 'bg-green-100 text-green-800',
      checked_out: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <Badge variant="secondary" className={styles[status]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getRoomStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'occupied': return <Users className="h-4 w-4 text-blue-500" />;
      case 'dirty': return <Coffee className="h-4 w-4 text-yellow-500" />;
      case 'maintenance': return <Wrench className="h-4 w-4 text-red-500" />;
      default: return <BedDouble className="h-4 w-4" />;
    }
  };

  const getRoomStatusColor = (status: RoomStatus) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-blue-100 text-blue-800';
      case 'dirty': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100';
    }
  };

  const handleCheckIn = async () => {
    if (!selectedBooking || !selectedRoomId) return;
    
    // Validate check-in date
    const checkInDate = new Date(selectedBooking.checkInDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate > today) {
      setAlertModal({
        open: true,
        title: "Early Check-in Not Allowed",
        message: `Cannot check in guest before their booking date (${selectedBooking.checkInDate}). Please wait until the check-in date.`,
        type: "warning"
      });
      return;
    }

    const checkOutDate = new Date(selectedBooking.checkOutDate);
    if (today > checkOutDate) {
      setAlertModal({
        open: true,
        title: "Booking Expired",
        message: `This booking expired on ${selectedBooking.checkOutDate}. Please create a new booking.`,
        type: "error"
      });
      return;
    }

    // VALIDATION: Check if guest is already checked in
    if (selectedBooking.status === 'checked_in') {
      setAlertModal({
        open: true,
        title: "Already Checked In",
        message: `${selectedBooking.guestName} is already checked in to room ${selectedBooking.roomNumber}.`,
        type: "warning"
      });
      return;
    }

    setIsProcessing(true);
    try {
      await updateBookingStatus(selectedBooking.id, 'checked_in');
      
      const roomRef = doc(db, 'rooms', selectedRoomId);
      await updateDoc(roomRef, { isAvailable: false });
      
      setShowCheckInModal(false);
      setSelectedBooking(null);
      setSelectedRoomId('');
      
      setAlertModal({
        open: true,
        title: "Check-in Successful",
        message: `${selectedBooking.guestName} checked in successfully to room ${selectedRoomId}.`,
        type: "success"
      });
    } catch (error) {
      console.error("Check-in error:", error);
      setAlertModal({
        open: true,
        title: "Check-in Failed",
        message: "Failed to check in guest. Please try again.",
        type: "error"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedBooking) return;
    
    // VALIDATION: Check if guest is actually checked in
    if (selectedBooking.status !== 'checked_in') {
      setAlertModal({
        open: true,
        title: "Not Checked In",
        message: `${selectedBooking.guestName} is not currently checked in.`,
        type: "warning"
      });
      return;
    }
    
    if (!keysReturned) {
      setAlertModal({
        open: true,
        title: "Keys Not Returned",
        message: "Please confirm that guest has returned room keys before checkout.",
        type: "warning"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await updateBookingStatus(selectedBooking.id, 'checked_out');
      
      const roomRef = doc(db, 'rooms', selectedBooking.roomNumber);
      await updateDoc(roomRef, { isAvailable: true });
      
      setShowCheckOutModal(false);
      setSelectedBooking(null);
      setKeysReturned(false);
      
      setEmailAddress(selectedBooking.guestName.includes('@') ? selectedBooking.guestName : `${selectedBooking.guestName.replace(/\s/g, '').toLowerCase()}@example.com`);
      setShowEmailReceiptModal(true);
      
      setAlertModal({
        open: true,
        title: "Check-out Successful",
        message: `${selectedBooking.guestName} has been checked out.`,
        type: "success"
      });
    } catch (error) {
      console.error("Check-out error:", error);
      setAlertModal({
        open: true,
        title: "Check-out Failed",
        message: "Failed to check out guest. Please try again.",
        type: "error"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmailReceipt = async () => {
    if (!emailAddress) {
      alert("Please enter an email address.");
      return;
    }
    
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEmailSent(true);
      
      console.log(`Sending receipt to: ${emailAddress}`);
      
      setTimeout(() => {
        setShowEmailReceiptModal(false);
        setEmailSent(false);
        setEmailAddress('');
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEarlyCheckout = async () => {
    if (!selectedBooking) return;
    
    if (!keysReturned) {
      alert("Please confirm room keys have been returned.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const checkoutDate = new Date(selectedBooking.checkOutDate);
      const today = new Date();
      const remainingDays = Math.ceil((checkoutDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const refundAmount = (selectedBooking.totalAmount / 2) * (remainingDays / 1);
      
      await updateBookingStatus(selectedBooking.id, 'checked_out');
      
      const roomRef = doc(db, 'rooms', selectedBooking.roomNumber);
      await updateDoc(roomRef, { isAvailable: true });
      
      setShowEarlyCheckoutModal(false);
      alert(`Early checkout processed. Refund amount: R${refundAmount.toFixed(2)}`);
      setSelectedBooking(null);
      setKeysReturned(false);
    } catch (error) {
      console.error("Early checkout error:", error);
      alert("Failed to process early checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRoomSwap = async () => {
    if (!selectedBooking || !selectedRoomId) return;
    setIsProcessing(true);
    try {
      const oldRoomRef = doc(db, 'rooms', selectedBooking.roomNumber);
      await updateDoc(oldRoomRef, { isAvailable: true });
      
      const newRoomRef = doc(db, 'rooms', selectedRoomId);
      await updateDoc(newRoomRef, { isAvailable: false });
      
      const bookingRef = doc(db, 'bookings', selectedBooking.id);
      await updateDoc(bookingRef, { 
        roomId: selectedRoomId, 
        roomNumber: selectedRoomId,
        roomName: rooms.find(r => r.id === selectedRoomId)?.name || selectedRoomId
      });
      
      alert(`Guest moved to room ${selectedRoomId}`);
      setShowRoomSwapModal(false);
      setSelectedRoomId('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtendStay = async () => {
    if (!selectedBooking) return;
    setIsProcessing(true);
    try {
      const newCheckoutDate = new Date(selectedBooking.checkOutDate);
      newCheckoutDate.setDate(newCheckoutDate.getDate() + extendDays);
      
      const bookingRef = doc(db, 'bookings', selectedBooking.id);
      await updateDoc(bookingRef, { checkOutDate: newCheckoutDate.toISOString().split('T')[0] });
      
      alert(`Stay extended by ${extendDays} day(s). New checkout date: ${newCheckoutDate.toISOString().split('T')[0]}`);
      setShowExtendStayModal(false);
      setExtendDays(1);
    } catch (error) {
      console.error("Extend stay error:", error);
      alert("Failed to extend stay.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateBooking = async () => {
    if (!selectedBooking) return;
    if (!editCheckIn || !editCheckOut) {
      alert("Please enter both check-in and check-out dates.");
      return;
    }
    
    const newCheckIn = new Date(editCheckIn);
    const newCheckOut = new Date(editCheckOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (newCheckIn < today) {
      alert("Check-in date cannot be in the past.");
      return;
    }
    
    if (newCheckOut <= newCheckIn) {
      alert("Check-out date must be after check-in date.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const bookingRef = doc(db, 'bookings', selectedBooking.id);
      await updateDoc(bookingRef, {
        checkInDate: editCheckIn,
        checkOutDate: editCheckOut
      });
      alert("Booking dates updated successfully!");
      setShowEditBookingModal(false);
      // Refresh the bookings list
      const snapshot = await getDocs(collection(db, 'bookings'));
      const updatedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(updatedBookings);
    } catch (error) {
      console.error("Update booking error:", error);
      alert("Failed to update booking.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    if (selectedBooking.status === 'checked_in') {
      alert("Cannot cancel an active check-in. Please check out first.");
      return;
    }
    if (selectedBooking.status === 'checked_out') {
      alert("Cannot cancel a completed booking.");
      return;
    }
    if (selectedBooking.status === 'cancelled') {
      alert("This booking is already cancelled.");
      return;
    }
    
    if (confirm(`Are you sure you want to cancel the booking for ${selectedBooking.guestName}? This action cannot be undone.`)) {
      setIsProcessing(true);
      try {
        const bookingRef = doc(db, 'bookings', selectedBooking.id);
        await updateDoc(bookingRef, { status: 'cancelled' });
        alert("Booking cancelled successfully.");
        setShowEditBookingModal(false);
        // Refresh the bookings list
        const snapshot = await getDocs(collection(db, 'bookings'));
        const updatedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
        setBookings(updatedBookings);
      } catch (error) {
        console.error("Cancel booking error:", error);
        alert("Failed to cancel booking.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDownloadInvoice = async () => {
    if (!selectedBooking) return;
    
    // Create a temporary div with the invoice HTML
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '800px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '40px';
    
    const invoiceHtml = `
      <div style="font-family: 'Georgia', 'Times New Roman', serif;">
        <div style="text-align: center; border-bottom: 2px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="font-size: 28px; font-weight: bold; color: #1e3a5f;">AZURE HORIZON RESORT</div>
          <div style="font-size: 18px; margin-top: 10px; color: #c9a227;">FINAL INVOICE</div>
        </div>
        
        <div style="margin-bottom: 25px;">
          <div style="font-size: 14px; font-weight: bold; color: #1e3a5f; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 15px;">Guest Information</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div><div style="font-size: 11px; color: #888;">Guest Name</div><div style="font-size: 14px; font-weight: 500;">${selectedBooking.guestName}</div></div>
            <div><div style="font-size: 11px; color: #888;">Room</div><div style="font-size: 14px; font-weight: 500;">${selectedBooking.roomName}</div></div>
            <div><div style="font-size: 11px; color: #888;">Check-in</div><div style="font-size: 14px; font-weight: 500;">${selectedBooking.checkInDate}</div></div>
            <div><div style="font-size: 11px; color: #888;">Check-out</div><div style="font-size: 14px; font-weight: 500;">${selectedBooking.checkOutDate}</div></div>
            <div><div style="font-size: 11px; color: #888;">Booking ID</div><div style="font-size: 14px; font-weight: 500;">${selectedBooking.id}</div></div>
            <div><div style="font-size: 11px; color: #888;">Keys Returned</div><div style="font-size: 14px; font-weight: 500;"><span style="display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 11px; background: ${selectedBooking.status === 'checked_out' ? '#4caf50' : '#f44336'}; color: white;">${selectedBooking.status === 'checked_out' ? 'YES' : 'NOT YET'}</span></div></div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <div style="font-size: 14px; font-weight: bold; color: #1e3a5f; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 15px;">Charges Summary</div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Description</th>
                <th style="padding: 10px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">Room Charges (${calculateNights(selectedBooking.checkInDate, selectedBooking.checkOutDate)} nights)</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R ${selectedBooking.totalAmount}</td>
              </tr>
              ${incidentalCharges.map(charge => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${charge.description}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R ${charge.amount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="text-align: right; margin-top: 20px;">
            <p>Subtotal: R ${selectedBooking.totalAmount}</p>
            <p>Incidental Charges: R ${getTotalIncidentalCharges()}</p>
            <p style="font-size: 18px; font-weight: bold; color: #1e3a5f;">TOTAL: R ${selectedBooking.totalAmount + getTotalIncidentalCharges()}</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px;">
          <p>Thank you for choosing Azure Horizon Resort. We hope to welcome you again!</p>
          <p>This is a system-generated invoice.</p>
        </div>
      </div>
    `;
    
    tempDiv.innerHTML = invoiceHtml;
    document.body.appendChild(tempDiv);
    
    try {
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Invoice_${selectedBooking.guestName.replace(/\s/g, '_')}_${selectedBooking.id}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      document.body.removeChild(tempDiv);
    }
  };

  const handleViewBilling = async (booking: Booking) => {
    setSelectedBooking(booking);
    setIsLoadingBilling(true);
    setShowBillingModal(true);
    
    setTimeout(() => {
      setGuestBilling({
        roomCharges: booking.totalAmount,
        incidentalCharges: incidentalCharges,
        total: booking.totalAmount + getTotalIncidentalCharges()
      });
      setIsLoadingBilling(false);
    }, 500);
  };

  const handleViewGuestDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowGuestDetailsModal(true);
  };

  const calculateNights = (checkIn: string, checkOut: string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Alert Modal */}
      <AlertModal
        open={alertModal.open}
        onClose={() => setAlertModal(prev => ({ ...prev, open: false }))}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-[#1e3a5f]">Front Desk Dashboard</h1>
        <p className="text-gray-600">Manage guest lifecycle and room inventory</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card><CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div><p className="text-sm text-gray-500">Today's Arrivals</p><p className="text-3xl font-bold">{todayCheckIns.length}</p></div>
            <div className="bg-blue-100 p-3 rounded-lg"><LogIn className="text-blue-600" /></div>
          </div>
        </CardContent></Card>
        
        <Card><CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div><p className="text-sm text-gray-500">Today's Departures</p><p className="text-3xl font-bold">{todayCheckOuts.length}</p></div>
            <div className="bg-orange-100 p-3 rounded-lg"><LogOut className="text-orange-600" /></div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div><p className="text-sm text-gray-500">Total Rooms</p><p className="text-3xl font-bold">{rooms.length}</p></div>
            <div className="bg-green-100 p-3 rounded-lg"><BedDouble className="text-green-600" /></div>
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div><p className="text-sm text-gray-500">Available</p><p className="text-3xl font-bold">{rooms.filter(r => r.isAvailable).length}</p></div>
            <div className="bg-yellow-100 p-3 rounded-lg"><Key className="text-yellow-600" /></div>
          </div>
        </CardContent></Card>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            className="pl-10" 
            placeholder="Search guest or booking ID..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        <Button variant="outline" onClick={() => setShowRoomStatusModal(true)}>
          <BedDouble className="mr-2 h-4 w-4" />
          View Room Status
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="arrivals">Arrivals</TabsTrigger>
          <TabsTrigger value="inhouse">In-House</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          <BookingsTable 
            bookings={filteredBookings} 
            onCheckIn={(b) => { setSelectedBooking(b); setShowCheckInModal(true); }}
            onCheckOut={(b) => { setSelectedBooking(b); setShowCheckOutModal(true); }}
            onViewBilling={handleViewBilling}
            onViewGuest={handleViewGuestDetails}
            onRoomSwap={(b) => { setSelectedBooking(b); setShowRoomSwapModal(true); }}
            onExtendStay={(b) => { setSelectedBooking(b); setShowExtendStayModal(true); }}
            onEarlyCheckout={(b) => { setSelectedBooking(b); setShowEarlyCheckoutModal(true); }}
            onDownloadInvoice={(b) => { setSelectedBooking(b); handleDownloadInvoice(); }}
            onEditBooking={(b) => { 
              setSelectedBooking(b); 
              setEditCheckIn(b.checkInDate);
              setEditCheckOut(b.checkOutDate);
              setShowEditBookingModal(true);
            }}
            onCancelBooking={(b) => { setSelectedBooking(b); handleCancelBooking(); }}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="arrivals" className="mt-4">
          <BookingsTable 
            bookings={todayCheckIns} 
            onCheckIn={(b) => { setSelectedBooking(b); setShowCheckInModal(true); }}
            onCheckOut={(b) => { setSelectedBooking(b); setShowCheckOutModal(true); }}
            onViewBilling={handleViewBilling}
            onViewGuest={handleViewGuestDetails}
            onRoomSwap={(b) => { setSelectedBooking(b); setShowRoomSwapModal(true); }}
            onExtendStay={(b) => { setSelectedBooking(b); setShowExtendStayModal(true); }}
            onEarlyCheckout={(b) => { setSelectedBooking(b); setShowEarlyCheckoutModal(true); }}
            onDownloadInvoice={(b) => { setSelectedBooking(b); handleDownloadInvoice(); }}
            onEditBooking={(b) => { 
              setSelectedBooking(b); 
              setEditCheckIn(b.checkInDate);
              setEditCheckOut(b.checkOutDate);
              setShowEditBookingModal(true);
            }}
            onCancelBooking={(b) => { setSelectedBooking(b); handleCancelBooking(); }}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="inhouse" className="mt-4">
          <BookingsTable 
            bookings={bookings.filter(b => b.status === 'checked_in')} 
            onCheckIn={(b) => { setSelectedBooking(b); setShowCheckInModal(true); }}
            onCheckOut={(b) => { setSelectedBooking(b); setShowCheckOutModal(true); }}
            onViewBilling={handleViewBilling}
            onViewGuest={handleViewGuestDetails}
            onRoomSwap={(b) => { setSelectedBooking(b); setShowRoomSwapModal(true); }}
            onExtendStay={(b) => { setSelectedBooking(b); setShowExtendStayModal(true); }}
            onEarlyCheckout={(b) => { setSelectedBooking(b); setShowEarlyCheckoutModal(true); }}
            onDownloadInvoice={(b) => { setSelectedBooking(b); handleDownloadInvoice(); }}
            onEditBooking={(b) => { 
              setSelectedBooking(b); 
              setEditCheckIn(b.checkInDate);
              setEditCheckOut(b.checkOutDate);
              setShowEditBookingModal(true);
            }}
            onCancelBooking={(b) => { setSelectedBooking(b); handleCancelBooking(); }}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Check-In Modal */}
      <Dialog open={showCheckInModal} onOpenChange={setShowCheckInModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Guest</DialogTitle>
            <DialogDescription>Assign a room to {selectedBooking?.guestName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="room-select">Select Room</Label>
            <select
              id="room-select"
              title="Select an available room"
              className="w-full p-2 border rounded-md"
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
            >
              <option value="">Available Rooms...</option>
              {rooms.filter(r => r.isAvailable && r.roomStatus === 'available').map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <Button className="w-full" onClick={handleCheckIn} disabled={!selectedRoomId || isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <LogIn className="mr-2 h-4 w-4" />}
              Complete Check-in
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-Out Modal */}
      <Dialog open={showCheckOutModal} onOpenChange={setShowCheckOutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guest Check-out</DialogTitle>
            <DialogDescription>Finalize bill for {selectedBooking?.guestName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Room Charges</span>
                <span>R {selectedBooking?.totalAmount}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Incidental Charges</span>
                <span>R {getTotalIncidentalCharges()}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total Due</span>
                <span>R {(selectedBooking?.totalAmount || 0) + getTotalIncidentalCharges()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Checkbox
                id="keys-returned"
                checked={keysReturned}
                onCheckedChange={(checked) => setKeysReturned(checked as boolean)}
              />
              <Label htmlFor="keys-returned" className="text-sm font-normal cursor-pointer">
                Confirm room keys have been returned by guest
              </Label>
            </div>

            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700" 
              onClick={handleCheckOut} 
              disabled={isProcessing || !keysReturned}
            >
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Process Payment & Checkout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Receipt Modal */}
      <Dialog open={showEmailReceiptModal} onOpenChange={setShowEmailReceiptModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Send Receipt by Email
            </DialogTitle>
            <DialogDescription>
              A final receipt will be sent to the guest's email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  className="pl-10" 
                  placeholder="guest@example.com" 
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                />
              </div>
            </div>
            
            {emailSent ? (
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-green-700 font-semibold">Receipt Sent!</p>
                <p className="text-xs text-green-600">The receipt has been sent to {emailAddress}</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowEmailReceiptModal(false)}>
                  Skip
                </Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSendEmailReceipt} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 h-4 w-4" />}
                  Send Receipt
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Early Checkout Modal */}
      <Dialog open={showEarlyCheckoutModal} onOpenChange={setShowEarlyCheckoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Early Checkout</DialogTitle>
            <DialogDescription>Process early departure for {selectedBooking?.guestName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">Early checkout may incur a 50% refund on remaining nights.</p>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Checkbox
                id="early-keys-returned"
                checked={keysReturned}
                onCheckedChange={(checked) => setKeysReturned(checked as boolean)}
              />
              <Label htmlFor="early-keys-returned" className="text-sm font-normal cursor-pointer">
                Confirm room keys have been returned
              </Label>
            </div>
            <Button className="w-full bg-red-600" onClick={handleEarlyCheckout} disabled={isProcessing || !keysReturned}>
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <LogOut className="mr-2 h-4 w-4" />}
              Confirm Early Checkout
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Swap Modal */}
      <Dialog open={showRoomSwapModal} onOpenChange={setShowRoomSwapModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Swap Room</DialogTitle>
            <DialogDescription>Move {selectedBooking?.guestName} to a different room</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="new-room">Select New Room</Label>
            <select
              id="new-room"
              title="Select a new room"
              className="w-full p-2 border rounded-md"
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
            >
              <option value="">Select Room...</option>
              {rooms.filter(r => r.isAvailable && r.id !== selectedBooking?.roomNumber).map(r => (
                <option key={r.id} value={r.id}>{r.name} (Current: {r.roomStatus})</option>
              ))}
            </select>
            <Button className="w-full" onClick={handleRoomSwap} disabled={!selectedRoomId || isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Repeat className="mr-2 h-4 w-4" />}
              Confirm Room Swap
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Stay Modal */}
      <Dialog open={showExtendStayModal} onOpenChange={setShowExtendStayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Stay</DialogTitle>
            <DialogDescription>Add extra nights for {selectedBooking?.guestName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="extend-days">Number of extra nights</Label>
            <Input
              id="extend-days"
              type="number"
              min={1}
              max={30}
              value={extendDays}
              onChange={(e) => setExtendDays(parseInt(e.target.value))}
            />
            <Button className="w-full" onClick={handleExtendStay} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
              Extend Stay
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Status Modal */}
      <Dialog open={showRoomStatusModal} onOpenChange={setShowRoomStatusModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Room Status Overview</DialogTitle>
            <DialogDescription>Current status of all rooms in the resort</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {rooms.map((room) => (
              <div key={room.id} className={`p-3 rounded-lg border ${getRoomStatusColor(room.roomStatus)}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold">Room {room.id}</span>
                  {getRoomStatusIcon(room.roomStatus)}
                </div>
                <p className="text-xs mt-1">{room.name}</p>
                <p className="text-xs font-medium mt-1 capitalize">{room.roomStatus}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-center mt-4 pt-4 border-t">
            <div className="flex items-center gap-1 text-xs"><CheckCircle className="h-3 w-3 text-green-500" /> Available</div>
            <div className="flex items-center gap-1 text-xs"><Users className="h-3 w-3 text-blue-500" /> Occupied</div>
            <div className="flex items-center gap-1 text-xs"><Coffee className="h-3 w-3 text-yellow-500" /> Dirty</div>
            <div className="flex items-center gap-1 text-xs"><Wrench className="h-3 w-3 text-red-500" /> Maintenance</div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Modal */}
      <Dialog open={showEditBookingModal} onOpenChange={setShowEditBookingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <Edit className="h-5 w-5" />
              Edit Booking
            </DialogTitle>
            <DialogDescription>
              Modify booking dates for {selectedBooking?.guestName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Room</Label>
              <Input value={selectedBooking?.roomName} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label>New Check-in Date</Label>
              <Input 
                type="date" 
                value={editCheckIn}
                onChange={(e) => setEditCheckIn(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>New Check-out Date</Label>
              <Input 
                type="date" 
                value={editCheckOut}
                onChange={(e) => setEditCheckOut(e.target.value)}
                min={editCheckIn || new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={handleCancelBooking}
                disabled={isProcessing || selectedBooking?.status === 'checked_in' || selectedBooking?.status === 'checked_out'}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Booking
              </Button>
              <Button 
                className="flex-1 bg-[#1e3a5f] hover:bg-[#2c5282]"
                onClick={handleUpdateBooking}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Guest Billing Modal */}
      <Dialog open={showBillingModal} onOpenChange={setShowBillingModal}>
        <DialogContent className="max-w-2xl bg-white rounded-xl shadow-2xl">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-2 text-[#1e3a5f]">
              <div className="w-10 h-10 bg-[#1e3a5f]/10 rounded-xl flex items-center justify-center">
                <Receipt className="h-5 w-5 text-[#1e3a5f]" />
              </div>
              <div>
                <span className="text-xl font-serif">Guest Billing Summary</span>
                <p className="text-xs text-gray-400 font-normal mt-0.5">
                  {selectedBooking?.guestName} • Room {selectedBooking?.roomNumber}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Warning for checked out guests */}
          {selectedBooking?.status === 'checked_out' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 font-medium">
                ℹ️ This guest has already checked out. This bill is for reference only.
              </p>
            </div>
          )}
          
          {isLoadingBilling ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
            </div>
          ) : guestBilling && (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Room Charges ({selectedBooking?.checkInDate} - {selectedBooking?.checkOutDate})</span>
                  <span className="text-xl font-bold text-[#1e3a5f]">R {guestBilling.roomCharges}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Incidental Charges
                  </div>
                  {selectedBooking?.status !== 'checked_out' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 border-[#c9a227] text-[#c9a227] hover:bg-[#c9a227]/10"
                      onClick={() => {
                        const desc = prompt("Enter charge description:");
                        const amount = prompt("Enter amount:");
                        if (desc && amount && !isNaN(parseFloat(amount))) {
                          const newCharge: IncidentalCharge = {
                            id: Date.now().toString(),
                            description: desc,
                            amount: parseFloat(amount),
                            date: new Date().toISOString()
                          };
                          setIncidentalCharges(prev => [...prev, newCharge]);
                          if (guestBilling) {
                            const updatedTotal = guestBilling.roomCharges + [...incidentalCharges, newCharge].reduce((sum, c) => sum + c.amount, 0);
                            setGuestBilling({
                              ...guestBilling,
                              incidentalCharges: [...incidentalCharges, newCharge],
                              total: updatedTotal
                            });
                          }
                        } else {
                          alert("Please enter valid description and amount.");
                        }
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add Charge
                    </Button>
                  )}
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {incidentalCharges.length === 0 ? (
                    <div className="text-center text-gray-400 py-4 text-sm">
                      No incidental charges added yet.
                    </div>
                  ) : (
                    incidentalCharges.map((charge) => (
                      <div key={charge.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{charge.description}</p>
                          <p className="text-xs text-gray-400">{new Date(charge.date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-[#1e3a5f]">R {charge.amount.toFixed(2)}</span>
                          {selectedBooking?.status !== 'checked_out' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full" 
                              onClick={() => {
                                setIncidentalCharges(prev => prev.filter(c => c.id !== charge.id));
                                if (guestBilling) {
                                  const updatedCharges = incidentalCharges.filter(c => c.id !== charge.id);
                                  const updatedTotal = guestBilling.roomCharges + updatedCharges.reduce((sum, c) => sum + c.amount, 0);
                                  setGuestBilling({
                                    ...guestBilling,
                                    incidentalCharges: updatedCharges,
                                    total: updatedTotal
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t pt-4 mt-2">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Subtotal</span>
                  <span className="text-[#1e3a5f]">R {(guestBilling.roomCharges || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 mt-1">
                  <span>Incidental Charges</span>
                  <span>R {getTotalIncidentalCharges().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t border-dashed">
                  <span>Total Due</span>
                  <span className="text-2xl text-[#1e3a5f] font-bold">R {((guestBilling.roomCharges || 0) + getTotalIncidentalCharges()).toFixed(2)}</span>
                </div>
              </div>

              {selectedBooking?.status !== 'checked_out' && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700" 
                  onClick={() => {
                    setShowBillingModal(false);
                    setShowCheckOutModal(true);
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Proceed to Checkout
                </Button>
              )}

              {selectedBooking?.status === 'checked_out' && (
                <Button 
                  className="w-full bg-gray-400 cursor-not-allowed" 
                  disabled
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Checkout Completed
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Guest Details Modal */}
      <Dialog open={showGuestDetailsModal} onOpenChange={setShowGuestDetailsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guest Information</DialogTitle>
            <DialogDescription>Complete guest profile</DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-[#1e3a5f] rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedBooking.guestName}</h3>
                  <Badge>{selectedBooking.status}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>Check-in: {formatDate(selectedBooking.checkInDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Check-out: {formatDate(selectedBooking.checkOutDate)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">Room: <span className="font-semibold">{selectedBooking.roomName}</span></p>
                <p className="text-sm text-gray-600">Booking ID: <span className="font-mono">{selectedBooking.id}</span></p>
                {selectedBooking.specialRequests && (
                  <p className="text-sm text-gray-600 mt-2">Special Requests: <span className="italic">{selectedBooking.specialRequests}</span></p>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1">
                  <Phone className="mr-2 h-4 w-4" /> Call Room
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="mr-2 h-4 w-4" /> Send Message
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// BookingsTable Component
interface BookingsTableProps {
  bookings: Booking[];
  onCheckIn: (b: Booking) => void;
  onCheckOut: (b: Booking) => void;
  onViewBilling: (b: Booking) => void;
  onViewGuest: (b: Booking) => void;
  onRoomSwap: (b: Booking) => void;
  onExtendStay: (b: Booking) => void;
  onEarlyCheckout: (b: Booking) => void;
  onDownloadInvoice: (b: Booking) => void;
  onEditBooking: (b: Booking) => void;
  onCancelBooking: (b: Booking) => void;
  getStatusBadge: (s: Booking['status']) => React.ReactNode;
}

function BookingsTable({ 
  bookings, 
  onCheckIn, 
  onCheckOut, 
  onViewBilling, 
  onViewGuest,
  onRoomSwap,
  onExtendStay,
  onEarlyCheckout,
  onDownloadInvoice,
  onEditBooking,
  getStatusBadge 
}: BookingsTableProps) {
  return (
    <Card><CardContent className="p-0 overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr className="text-xs text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-4 text-left font-medium"><div className="flex items-center gap-2"><Users className="h-4 w-4" />Guest</div></th>
            <th className="px-6 py-4 text-left font-medium">Status</th>
            <th className="px-6 py-4 text-left font-medium">Actions</th>
           </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-semibold text-gray-900">{booking.guestName}</div>
                <div className="text-xs text-gray-500">{booking.roomName}</div>
              </td>
              <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => onViewGuest(booking)} title="View Guest Details">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onViewBilling(booking)} title="View Billing">
                    <Receipt className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onDownloadInvoice(booking)} title="Download Invoice">
                    <Printer className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onEditBooking(booking)} title="Edit Booking">
                    <Edit className="h-3 w-3" />
                  </Button>
                  {booking.status === 'checked_in' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => onRoomSwap(booking)} title="Swap Room">
                        <Repeat className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onExtendStay(booking)} title="Extend Stay">
                        <CalendarPlus className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => onEarlyCheckout(booking)} title="Early Checkout">
                        <LogOut className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {booking.status === 'confirmed' && (
                    <Button size="sm" onClick={() => onCheckIn(booking)}>Check In</Button>
                  )}
                  {booking.status === 'checked_in' && (
                    <Button size="sm" variant="outline" onClick={() => onCheckOut(booking)}>Check Out</Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {bookings.length === 0 && <div className="p-8 text-center text-gray-400">No bookings matching your criteria.</div>}
    </CardContent></Card>
  );
}