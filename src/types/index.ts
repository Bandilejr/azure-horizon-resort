// src/types/index.ts

// User Roles
export type UserRole = 'admin' | 'guest' | 'front_desk' | 'chef' | 'waitstaff' | 'delivery' | 'maintenance' | null;

// User Interface
export interface User {
  uid: string;
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  roomNumber?: string;
  checkInDate?: string;
  checkOutDate?: string;
  // NEW: Essential for the Visitor vs Resident gatekeeping
  status?: 'visitor' | 'resident' | 'staff'; 
  isAuthenticated?: boolean;
}

// Room Types
export interface Room {
  id: string;
  name: string;
  type: 'ocean_view' | 'garden' | 'penthouse' | 'family' | 'beachfront' | 'mountain_view' | 'accessible';
  price: number;
  capacity: number;
  description: string;
  amenities: string[];
  images: string[];
  isAvailable: boolean;
}

// Booking Types
export interface Booking {
  id: string;
  uid?: string; // Firebase UID for auth linkage
  guestId: string;
  guestEmail?: string;  // ← ADD THIS LINE
  guestName: string;
  roomId: string;
  roomName: string;
  roomNumber: string; // Ensure this exists for UI mapping
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  totalAmount: number;
  depositPaid?: number;
  paymentStatus: 'pending' | 'deposit_paid' | 'paid' | 'refunded' ;
  createdAt: string;
}

// Room Service Request Types
export type RequestType = 'housekeeping' | 'maintenance';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface RoomServiceRequest {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  type: RequestType;
  description: string;
  status: RequestStatus;
  imageUrl?: string;  // Keep as optional string (undefined when not provided)
  priority?: 'low' | 'medium' | 'high'; 
  createdAt: string;
  completedAt?: string;
}

// Restaurant Types
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'appetizers' | 'mains' | 'desserts' | 'beverages';
  image?: string;
  dietary?: string[];
}

export interface TableReservation {
  id: string;
  guestId: string;
  guestName: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
  status: 'confirmed' | 'cancelled' | 'completed';
}

export type OrderType = 'dine_in' | 'takeaway' | 'room_delivery';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';

export interface OrderItem {
  menuItemId?: string; // Optional if adding custom items
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export interface FoodOrder {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber?: string;
  tableNumber?: string;
  orderType: OrderType;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;  // ← This should use OrderStatus type
  assignedTo?: string;
  createdAt: string;
  estimatedReadyTime?: string;
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'guest' | 'concierge' | 'system';
  message: string;
  timestamp: string;
  isRead: boolean;
}

// Guide Content Types
export interface GuideSection {
  id: string;
  title: string;
  icon: string;
  content: string;
}

// Incidentals for Check-out
export interface IncidentalCharge {
  id: string;
  description: string;
  amount: number;
  date: string;
}