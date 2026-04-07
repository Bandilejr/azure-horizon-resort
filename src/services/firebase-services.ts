import { 
  signInWithEmailAndPassword, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  type User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { ref, push, set, onValue, off, update, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createDeliveryReceipt } from './transaction-services';


// IMPORT from your local firebase config file
import { auth, db as dbInstance, rtdb as rtdbInstance, storage as storageInstance } from '../lib/firebase';

import type { 
  Room, 
  Booking, 
  RoomServiceRequest, 
  RequestStatus,
  TableReservation, 
  FoodOrder, 
  ChatMessage,
  User as AppUser // Aliased to avoid conflict with Firebase User
} from '@/types';



// ==========================================
// EXPORTS FOR EXTERNAL USE
// ==========================================
export const db = dbInstance;
export const rtdb = rtdbInstance;
export const storage = storageInstance;

// ==========================================
// AUTHENTICATION SERVICES
// ==========================================

/**
 * Registers a new visitor account in Auth and Firestore
 */
export const registerUser = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userData: AppUser = {
      id: uid,
      uid: uid, // Store Firebase UID for auth linkage
      name,
      email,
      role: 'guest',
      status: 'visitor', // Default status for new registrations
    };

    // Store in 'users' collection using email as key to match login logic
    await setDoc(doc(db, 'users', email), userData);
    return { user: userData, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return { user: null, error: message };
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const userDoc = await getDoc(doc(db, 'users', email));
    
    if (userDoc.exists()) {
      return { user: { id: uid, ...userDoc.data() } as AppUser, error: null };
    } else {
      return { user: null, error: "Profile not found." };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return { user: null, error: message };
  }
};

export const loginAsGuest = async (name: string, roomNumber?: string) => {
  try {
    const userCredential = await signInAnonymously(auth);
    const uid = userCredential.user.uid;

    const guestData: AppUser = {
      id: uid,
      uid: uid, // Store Firebase UID for auth linkage
      name: name,
      role: 'guest',
      status: 'visitor', 
      roomNumber: 'N/A',
    };

    if (roomNumber && roomNumber.trim() !== "") {
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef, 
        where("guestName", "==", name),
        where("roomNumber", "==", roomNumber)
      );
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        guestData.status = 'resident';
        guestData.roomNumber = roomNumber;
      }
    }

    await setDoc(doc(db, 'guests', uid), guestData);
    return { user: guestData, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error during guest login';
    return { user: null, error: message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
};

export const listenForAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// ==========================================
// ROOM SERVICES
// ==========================================

export const listenForRooms = (callback: (rooms: Room[]) => void) => {
  const q = collection(db, 'rooms');
  return onSnapshot(q, (snapshot) => {
    const rooms = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Room));
    callback(rooms);
  });
};

export const getAvailableRooms = async (): Promise<Room[]> => {
  const querySnapshot = await getDocs(collection(db, 'rooms'));
  const allRooms = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Room));
  return allRooms.filter(room => room.isAvailable);
};

// ==========================================
// BOOKING SERVICES
// ==========================================

// Check if a room is already booked for specific dates
// Check if a room is already booked for specific dates
export const checkRoomAvailability = async (roomId: string, checkInDate: string, checkOutDate: string): Promise<boolean> => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef, 
      where('roomId', '==', roomId),
      where('status', 'in', ['confirmed', 'checked_in'])
    );
    const snapshot = await getDocs(q);
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    for (const doc of snapshot.docs) {
      const booking = doc.data();
      const existingCheckIn = new Date(booking.checkInDate);
      const existingCheckOut = new Date(booking.checkOutDate);
      
      // Check if date ranges overlap
      if (checkIn < existingCheckOut && checkOut > existingCheckIn) {
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Error checking availability:", error);
    return true;
  }
};
export const listenForBookings = (callback: (bookings: Booking[]) => void) => {
  const q = collection(db, 'bookings');
  return onSnapshot(q, (snapshot) => {
    const bookings = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
    callback(bookings);
  });
};

export const listenForGuestBooking = (guestId: string, callback: (booking: Booking | null) => void) => {
  const q = query(collection(db, 'bookings'), where('guestId', '==', guestId), where('status', '!=', 'checked_out'));
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Booking);
    } else {
      callback(null);
    }
  });
};

export const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, { status });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
};

// ==========================================
// ROOM SERVICE REQUESTS
// ==========================================

export const listenForServiceRequests = (callback: (requests: RoomServiceRequest[]) => void) => {
  const q = collection(db, 'service_requests');
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RoomServiceRequest));
    callback(requests);
  });
};

export const updateServiceRequestStatus = async (requestId: string, status: RequestStatus) => {
  try {
    const requestRef = doc(db, 'service_requests', requestId);
    await updateDoc(requestRef, { 
      status,
      completedAt: status === 'completed' ? new Date().toISOString() : null
    });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating service request';
    return { success: false, error: message };
  }
};



// ==========================================
// RESTAURANT & KITCHEN (RTDB)
// ==========================================

export const listenForOrders = (callback: (orders: FoodOrder[]) => void) => {
  const ordersRef = ref(rtdb, 'orders');
  console.log("Setting up orders listener at path: orders");
  
  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    console.log("Orders snapshot received:", data);
    if (data) {
      const ordersArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      console.log("Processed orders:", ordersArray.length);
      callback(ordersArray as FoodOrder[]);
    } else {
      console.log("No orders found in database");
      callback([]);
    }
  });
  return () => off(ordersRef);
};

export const createOrder = async (order: Omit<FoodOrder, 'id' | 'createdAt'>) => {
  try {
    const newOrderRef = push(ref(rtdb, 'orders'));
    const orderData = { ...order, createdAt: new Date().toISOString(), id: newOrderRef.key };
    await set(newOrderRef, orderData);
    return { orderId: newOrderRef.key };
  } catch (error: unknown) {
    return { orderId: null, error: error instanceof Error ? error.message : 'Error' };
  }
};

export const claimOrder = async (orderId: string, chefId: string) => {
  try {
    if (!chefId) {
      console.error("No chef ID provided");
      return { success: false, error: "No chef ID provided" };
    }
    
    console.log(`Claiming order ${orderId} for chef ${chefId}`);
    const orderRef = ref(rtdb, `orders/${orderId}`);
    
    // Use update with proper object
    await update(orderRef, { 
      status: 'preparing', 
      assignedTo: chefId,
      claimedAt: Date.now()
    });
    
    console.log(`Order ${orderId} claimed successfully`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Claim order error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
};

export const markOrderReady = async (orderId: string) => {
  try {
    await update(ref(rtdb, `orders/${orderId}`), { 
      status: 'ready',
      assignedTo: null  // ← ADD THIS LINE to clear the chef assignment
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
};

// For waitstaff - pick up ready order for delivery
export const pickupOrder = async (orderId: string, staffId: string) => {
  try {
    await update(ref(rtdb, `orders/${orderId}`), { 
      status: 'picked_up',  // ← Different from 'preparing'
      assignedTo: staffId,
      pickedUpAt: Date.now()
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
};

export const deliverOrder = async (orderId: string) => {
  try {
    // Get order details first
    const orderRef = ref(rtdb, `orders/${orderId}`);
    const orderSnapshot = await get(orderRef);
    const orderData = orderSnapshot.val();
    
    // Update order status
    await update(ref(rtdb, `orders/${orderId}`), { 
      status: 'delivered',
      completedAt: new Date().toISOString()
    });
    
    // Create delivery receipt in Firestore
    if (orderData) {
      await createDeliveryReceipt(
        orderId,
        orderData.guestId || 'unknown',
        orderData.guestName || 'Guest',
        orderData.items || [],
        orderData.totalAmount || 0
      );
    }
    
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error delivering order';
    return { success: false, error: message };
  }
};
// ==========================================
// CHAT & STORAGE
// ==========================================

export const listenForChatMessages = (guestId: string, callback: (messages: ChatMessage[]) => void) => {
  const chatRef = ref(rtdb, `chats/${guestId}`);
  onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const messages = Object.keys(data).map(key => ({ id: key, ...data[key] }));
      callback(messages as ChatMessage[]);
    } else {
      callback([]);
    }
  });
  return () => off(chatRef);
};

export const sendChatMessage = async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
  try {
    const guestId = message.senderRole === 'guest' ? message.senderId : 'concierge';
    const newMsgRef = push(ref(rtdb, `chats/${guestId}`));
    await set(newMsgRef, { ...message, timestamp: new Date().toISOString() });
    return { messageId: newMsgRef.key };
  } catch (error: unknown) {
    return { messageId: null, error: error instanceof Error ? error.message : 'Error' };
  }
};

export const uploadImage = async (file: File, path: string) => {
  try {
    const fRef = storageRef(storage, path);
    await uploadBytes(fRef, file);
    const url = await getDownloadURL(fRef);
    return { url, error: null };
  } catch (error: unknown) {
    return { url: null, error: error instanceof Error ? error.message : 'Error' };
  }
};

export const createTableReservation = async (reservation: Omit<TableReservation, 'id'>) => {
  try {
    await addDoc(collection(db, 'table_reservations'), reservation);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Error' };
  }
};

// Add this to your src/services/firebase-services.ts

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt'> & { depositPaid?: number }) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const newDoc = doc(bookingsRef);
    const id = newDoc.id;
    
    const finalBooking = {
      ...bookingData,
      id,
      depositPaid: bookingData.depositPaid || 0,
      createdAt: new Date().toISOString()
    };

    await setDoc(newDoc, finalBooking);
    
    // Update user status to 'resident' if guestEmail is provided
    if (bookingData.guestEmail) {
      const userRef = doc(db, 'users', bookingData.guestEmail);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          status: 'resident',
          roomNumber: bookingData.roomNumber
        });
        console.log(`Updated user ${bookingData.guestEmail} to resident status`);
      } else {
        console.log("User not found with email:", bookingData.guestEmail);
      }
    }

    return { success: true, bookingId: id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown booking error occurred';
    console.error("Booking Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
};
/**
 * Creates a new room service or maintenance request in Firestore
 */
export const createServiceRequest = async (requestData: Omit<RoomServiceRequest, 'id' | 'createdAt'>) => {
  try {
    const requestsRef = collection(db, 'service_requests');
    const newDoc = doc(requestsRef);
    const id = newDoc.id;

    // Create the final request object without imageUrl if it's undefined
    const finalRequest: Partial<RoomServiceRequest> & { id: string; createdAt: string; status: string } = {
      ...requestData,
      id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    // Only add imageUrl if it exists (don't send null)
    if (requestData.imageUrl) {
      finalRequest.imageUrl = requestData.imageUrl;
    }

    await setDoc(newDoc, finalRequest);
    return { success: true, requestId: id };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit service request';
    console.error("Service Request Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
};

export const checkInGuest = async (bookingId: string, roomNumber: string, guestEmail: string) => {
  try {
    // 1. Update the Booking
    await updateDoc(doc(db, 'bookings', bookingId), { status: 'checked_in' });

    // 2. Update the User (The "Resident" unlock)
    await updateDoc(doc(db, 'users', guestEmail), { 
      status: 'resident', 
      roomNumber: roomNumber 
    });

    // 3. Update the Physical Room
    await updateDoc(doc(db, 'rooms', roomNumber), { isAvailable: false });

    return { success: true };
  } catch (error: unknown) {
    console.error("Check-in error:", error);
    return { success: false };
  }
};