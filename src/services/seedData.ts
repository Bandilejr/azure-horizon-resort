import { db, rtdb } from '../lib/firebase';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { ref, set } from 'firebase/database';
import { seedTables } from './tableSeedData';

export const seedDatabase = async () => {
  try {
    alert("Starting database initialization...");

    // ==========================================
    // 1. STAFF ACCOUNTS (25)
    // ==========================================
    const staffList = [
      { id: 'bandile_maqeda', uid: 'bandile_maqeda', name: "Bandile Maqeda", role: "admin", email: "admin@azurehorizon.com", status: 'staff' },
      { id: 'sarah_jenkins', uid: 'sarah_jenkins', name: "Sarah Jenkins", role: "admin", email: "s.jenkins@azurehorizon.com", status: 'staff' },
      { id: 'pieter_uys', uid: 'pieter_uys', name: "Pieter-Dirk Uys", role: "admin", email: "p.uys@azurehorizon.com", status: 'staff' },
      { id: 'sibusiso_khoza', uid: 'sibusiso_khoza', name: "Chef Sibusiso Khoza", role: "chef", email: "s.khoza@azurehorizon.com", status: 'staff' },
      { id: 'marco_rossi', uid: 'marco_rossi', name: "Chef Marco Rossi", role: "chef", email: "m.rossi@azurehorizon.com", status: 'staff' },
      { id: 'oliver_tambo', uid: 'oliver_tambo', name: "Chef Oliver Tambo", role: "chef", email: "o.tambo@azurehorizon.com", status: 'staff' },
      { id: 'zuki_matola', uid: 'zuki_matola', name: "Chef Zuki Matola", role: "chef", email: "z.matola@azurehorizon.com", status: 'staff' },
      { id: 'gordon_ramsay', uid: 'gordon_ramsay', name: "Chef Gordon Ramsay", role: "chef", email: "g.ramsay@azurehorizon.com", status: 'staff' },
      { id: 'elena_meyer', uid: 'elena_meyer', name: "Elena Meyer", role: "front_desk", email: "e.meyer@azurehorizon.com", status: 'staff' },
      { id: 'lindiwe_buthelezi', uid: 'lindiwe_buthelezi', name: "Lindiwe Buthelezi", role: "front_desk", email: "l.buthelezi@azurehorizon.com", status: 'staff' },
      { id: 'anita_desai', uid: 'anita_desai', name: "Anita Desai", role: "front_desk", email: "a.desai@azurehorizon.com", status: 'staff' },
      { id: 'grace_kelly', uid: 'grace_kelly', name: "Grace Kelly", role: "front_desk", email: "g.kelly@azurehorizon.com", status: 'staff' },
      { id: 'david_miller', uid: 'david_miller', name: "David Miller", role: "waitstaff", email: "waiter@azurehorizon.com", status: 'staff' },
      { id: 'bongani_dlamini', uid: 'bongani_dlamini', name: "Bongani Dlamini", role: "waitstaff", email: "b.dlamini@azurehorizon.com", status: 'staff' },
      { id: 'yusuf_khan', uid: 'yusuf_khan', name: "Yusuf Khan", role: "waitstaff", email: "y.khan@azurehorizon.com", status: 'staff' },
      { id: 'nadine_gordimer', uid: 'nadine_gordimer', name: "Nadine Gordimer", role: "waitstaff", email: "n.gordimer@azurehorizon.com", status: 'staff' },
      { id: 'miriam_makeba', uid: 'miriam_makeba', name: "Miriam Makeba", role: "waitstaff", email: "m.makeba@azurehorizon.com", status: 'staff' },
      { id: 'thabo_mbeki', uid: 'thabo_mbeki', name: "Thabo Mbeki", role: "maintenance", email: "t.mbeki@azurehorizon.com", status: 'staff' },
      { id: 'kevin_dupreez', uid: 'kevin_dupreez', name: "Kevin Du Preez", role: "maintenance", email: "k.dupreez@azurehorizon.com", status: 'staff' },
      { id: 'chris_evans', uid: 'chris_evans', name: "Chris Evans", role: "maintenance", email: "c.evans@azurehorizon.com", status: 'staff' },
      { id: 'frikkie_louw', uid: 'frikkie_louw', name: "Frikkie Louw", role: "maintenance", email: "f.louw@azurehorizon.com", status: 'staff' },
    ];

    for (const s of staffList) {
      await setDoc(doc(db, 'users', s.email), s);
    }
    console.log(`✅ Added ${staffList.length} staff accounts`);

    // ==========================================
    // 2. GUEST ACCOUNTS (15)
    // ==========================================
    const guests = [
      { id: 'robert_harrison', uid: 'robert_harrison', name: 'Robert Harrison', email: 'rharrison@gmail.com', role: 'guest', status: 'resident', roomNumber: '101' },
      { id: 'zoe_katsaros', uid: 'zoe_katsaros', name: 'Zoe Katsaros', email: 'zoe.k@icloud.com', role: 'guest', status: 'resident', roomNumber: '204' },
      { id: 'michael_chen', uid: 'michael_chen', name: 'Michael Chen', email: 'mchen88@outlook.com', role: 'guest', status: 'visitor' },
      { id: 'amara_okafor', uid: 'amara_okafor', name: 'Amara Okafor', email: 'amara.pro@me.com', role: 'guest', status: 'resident', roomNumber: '302' },
      { id: 'jacobus_van_der_merwe', uid: 'jacobus_van_der_merwe', name: 'Jacobus van der Merwe', email: 'j.vdm@mweb.co.za', role: 'guest', status: 'resident', roomNumber: '110' },
      { id: 'linda_thompson', uid: 'linda_thompson', name: 'Linda Thompson', email: 'linda.t@yahoo.com', role: 'guest', status: 'visitor' },
      { id: 'sanjay_gupta', uid: 'sanjay_gupta', name: 'Sanjay Gupta', email: 'sgupta@health.org', role: 'guest', status: 'resident', roomNumber: '401' },
      { id: 'isabella_rossi', uid: 'isabella_rossi', name: 'Isabella Rossi', email: 'bella.rossi@protonmail.com', role: 'guest', status: 'resident', roomNumber: '105' },
      { id: 'thomas_shelby', uid: 'thomas_shelby', name: 'Thomas Shelby', email: 'tshelby@peaky.biz', role: 'guest', status: 'visitor' },
      { id: 'emily_blunt', uid: 'emily_blunt', name: 'Emily Blunt', email: 'emily.act@icloud.com', role: 'guest', status: 'resident', roomNumber: '202' },
      { id: 'david_wilson', uid: 'david_wilson', name: 'David Wilson', email: 'david.w@hotmail.com', role: 'guest', status: 'visitor' },
      { id: 'sarah_johnson', uid: 'sarah_johnson', name: 'Sarah Johnson', email: 'sarah.j@yahoo.com', role: 'guest', status: 'resident', roomNumber: '305' },
      { id: 'james_brown', uid: 'james_brown', name: 'James Brown', email: 'james.b@gmail.com', role: 'guest', status: 'visitor' },
      { id: 'maria_garcia', uid: 'maria_garcia', name: 'Maria Garcia', email: 'maria.g@outlook.com', role: 'guest', status: 'resident', roomNumber: '208' },
      { id: 'ahmed_khan', uid: 'ahmed_khan', name: 'Ahmed Khan', email: 'ahmed.k@icloud.com', role: 'guest', status: 'visitor' },
    ];

    for (const g of guests) {
      await setDoc(doc(db, 'users', g.email), g);
    }
    console.log(`✅ Added ${guests.length} guest accounts`);

    // ==========================================
    // 3. ROOMS (10 rooms with multiple images)
    // ==========================================
    const rooms = [
      { 
        id: '101', name: 'Oceanic Executive Suite', price: 4200, type: 'ocean_view', isAvailable: true, capacity: 2, 
        description: 'Luxury suite with panoramic sea views and private balcony. Wake up to breathtaking ocean vistas from your king-size bed.', 
        amenities: ['King Bed', 'Ocean View', 'WiFi', 'Mini Bar', 'Room Service', 'Private Balcony', 'Walk-in Shower'],
        images: ['/rooms/ocean-suite.png', '/rooms/ocean-suite-bedroom.jpg', '/rooms/ocean-suite-bathroom.jpg', '/rooms/ocean-suite-balcony.jpg'] 
      },
      { 
        id: '102', name: 'Coastal Breeze Room', price: 3500, type: 'ocean_view', isAvailable: true, capacity: 2, 
        description: 'Beautiful ocean views from your private terrace. Perfect for couples seeking a romantic getaway.', 
        amenities: ['Queen Bed', 'Ocean View', 'WiFi', 'Balcony', 'Mini Fridge', 'Coffee Maker'],
        images: ['/rooms/coastal-breeze.png', '/rooms/coastal-breeze-balcony.jpg', '/rooms/coastal-breeze-bathroom.jpg'] 
      },
      { 
        id: '105', name: 'Coral Garden Terrace', price: 2800, type: 'garden', isAvailable: true, capacity: 2, 
        description: 'Quiet room with private garden access and terrace. Surrounded by tropical plants and flowers.', 
        amenities: ['Queen Bed', 'Garden View', 'WiFi', 'Patio', 'Outdoor Seating', 'Rain Shower'],
        images: ['/rooms/garden-terrace-bedroom.jpg', '/rooms/garden-terrace-patio.jpg', '/rooms/garden-terrace-garden.png'] 
      },
      { 
        id: '110', name: 'Zen Garden Studio', price: 2200, type: 'garden', isAvailable: true, capacity: 2, 
        description: 'Peaceful studio overlooking zen garden with meditation space. Ideal for relaxation and mindfulness.', 
        amenities: ['Queen Bed', 'Meditation Space', 'Rain Shower', 'Garden View', 'Yoga Mat', 'Essential Oils'],
        images: ['/rooms/zen-studio.png', '/rooms/zen-studio-meditation.jpg', '/rooms/zen-studio-bathroom.jpg'] 
      },
      { 
        id: '202', name: 'Skyline Penthouse', price: 9500, type: 'penthouse', isAvailable: true, capacity: 4, 
        description: 'Top-floor luxury with panoramic city and ocean views. Experience the ultimate in sophistication.', 
        amenities: ['King Bed', 'Private Pool', 'Butler Service', 'Kitchen', '360° View', 'Dining Area', 'Home Theater'],
        images: ['/rooms/penthouse.png', '/rooms/penthouse-living.jpg', '/rooms/penthouse-pool.jpg', '/rooms/penthouse-view.jpg'] 
      },
      { 
        id: '204', name: 'Family Oasis Villa', price: 5400, type: 'family', isAvailable: true, capacity: 6, 
        description: 'Spacious villa perfect for families with children. Multiple bedrooms and living areas.', 
        amenities: ['Bunk Beds', 'Kitchenette', 'Play Area', 'Garden Access', 'Kids Club', 'Game Console', 'Crib Available'],
        images: ['/rooms/family-villa.png', '/rooms/family-villa-kids.png', '/rooms/family-villa-living.jpg', '/rooms/family-villa-garden.jpg'] 
      },
      { 
        id: '205', name: 'Heritage Suite', price: 6200, type: 'family', isAvailable: true, capacity: 4, 
        description: 'Elegant suite with separate living area and heritage decor. Blends classic charm with modern comfort.', 
        amenities: ['King Bed', 'Living Room', 'Dining Area', 'WiFi', 'Fireplace', 'Antique Furnishings'],
        images: ['/rooms/heritage-suite.png', '/rooms/heritage-suite-living.jpg', '/rooms/heritage-suite-bedroom.jpg'] 
      },
      { 
        id: '302', name: 'Azure Honeymoon Suite', price: 4800, type: 'ocean_view', isAvailable: true, capacity: 2, 
        description: 'Romantic suite with ocean views and spa bath. Perfect for newlyweds and special occasions.', 
        amenities: ['King Bed', 'Spa Bath', 'Champagne Service', 'Ocean View', 'Private Balcony', 'Rose Petal Turndown'],
        images: ['/rooms/honeymoon-suite.png', '/rooms/honeymoon-suite-bathroom.jpg', '/rooms/honeymoon-suite-view.jpg'] 
      },
      { 
        id: '305', name: 'Sunset View Room', price: 3900, type: 'ocean_view', isAvailable: true, capacity: 2, 
        description: 'Stunning sunset views from your private balcony. Watch the sun dip below the horizon each evening.', 
        amenities: ['Queen Bed', 'Sunset View', 'WiFi', 'Balcony', 'Wine Cooler', 'Binoculars'],
        images: ['/rooms/sunset-view.png', '/rooms/sunset-view-balcony.jpg', '/rooms/sunset-view-bedroom.jpg'] 
      },
      { 
        id: '401', name: 'Imperial Presidential Suite', price: 12500, type: 'penthouse', isAvailable: true, capacity: 6, 
        description: 'Ultimate luxury experience with private elevator and grand piano. The pinnacle of resort living.', 
        amenities: ['Private Elevator', 'Grand Piano', 'Chef\'s Kitchen', '360° View', 'Butler Service', 'Private Theater', 'Wine Cellar'],
        images: ['/rooms/presidential-suite.png', '/rooms/presidential-suite-living.jpg', '/rooms/presidential-suite-piano.jpg', '/rooms/presidential-suite-kitchen.jpg'] 
      },
    ];

    for (const room of rooms) {
      await setDoc(doc(db, 'rooms', room.id), room);
    }
    console.log(`✅ Added ${rooms.length} rooms`);

    // ==========================================
    // 4. BOOKINGS (15 - expanded)
    // ==========================================
    const today = new Date();
    const futureDate = (days: number) => new Date(today.getTime() + days * 86400000).toISOString().split('T')[0];
    const pastDate = (days: number) => new Date(today.getTime() - days * 86400000).toISOString().split('T')[0];

    const bookings = [
      { id: 'BK-1001', guestId: 'robert_harrison', guestName: 'Robert Harrison', status: 'checked_in', roomNumber: '101', roomName: 'Oceanic Executive Suite', checkInDate: pastDate(5), checkOutDate: futureDate(2), totalAmount: 29400, numberOfGuests: 2, paymentStatus: 'deposit_paid', depositPaid: 4410 },
      { id: 'BK-1002', guestId: 'zoe_katsaros', guestName: 'Zoe Katsaros', status: 'checked_in', roomNumber: '204', roomName: 'Family Oasis Villa', checkInDate: pastDate(3), checkOutDate: futureDate(4), totalAmount: 32400, numberOfGuests: 4, paymentStatus: 'deposit_paid', depositPaid: 4860 },
      { id: 'BK-1003', guestId: 'amara_okafor', guestName: 'Amara Okafor', status: 'checked_in', roomNumber: '302', roomName: 'Azure Honeymoon Suite', checkInDate: pastDate(2), checkOutDate: futureDate(5), totalAmount: 33600, numberOfGuests: 2, paymentStatus: 'deposit_paid', depositPaid: 5040 },
      { id: 'BK-1004', guestId: 'jacobus_van_der_merwe', guestName: 'Jacobus van der Merwe', status: 'checked_in', roomNumber: '110', roomName: 'Zen Garden Studio', checkInDate: pastDate(4), checkOutDate: futureDate(3), totalAmount: 15400, numberOfGuests: 2, paymentStatus: 'deposit_paid', depositPaid: 2310 },
      { id: 'BK-1005', guestId: 'sanjay_gupta', guestName: 'Sanjay Gupta', status: 'checked_in', roomNumber: '401', roomName: 'Imperial Presidential Suite', checkInDate: pastDate(1), checkOutDate: futureDate(7), totalAmount: 100000, numberOfGuests: 4, paymentStatus: 'deposit_paid', depositPaid: 15000 },
      { id: 'BK-1006', guestId: 'isabella_rossi', guestName: 'Isabella Rossi', status: 'checked_out', roomNumber: '105', roomName: 'Coral Garden Terrace', checkInDate: pastDate(10), checkOutDate: pastDate(7), totalAmount: 8400, numberOfGuests: 2, paymentStatus: 'paid', depositPaid: 1260 },
      { id: 'BK-1007', guestId: 'emily_blunt', guestName: 'Emily Blunt', status: 'checked_in', roomNumber: '202', roomName: 'Skyline Penthouse', checkInDate: pastDate(2), checkOutDate: futureDate(4), totalAmount: 57000, numberOfGuests: 2, paymentStatus: 'deposit_paid', depositPaid: 8550 },
      { id: 'BK-1008', guestId: 'sarah_johnson', guestName: 'Sarah Johnson', status: 'confirmed', roomNumber: '305', roomName: 'Sunset View Room', checkInDate: futureDate(3), checkOutDate: futureDate(6), totalAmount: 17550, numberOfGuests: 2, paymentStatus: 'deposit_paid', depositPaid: 2632 },
      { id: 'BK-1009', guestId: 'maria_garcia', guestName: 'Maria Garcia', status: 'confirmed', roomNumber: '208', roomName: 'Coastal Breeze Room', checkInDate: futureDate(5), checkOutDate: futureDate(9), totalAmount: 21000, numberOfGuests: 2, paymentStatus: 'pending', depositPaid: 0 },
      { id: 'BK-1010', guestId: 'david_wilson', guestName: 'David Wilson', status: 'confirmed', roomNumber: '205', roomName: 'Heritage Suite', checkInDate: futureDate(7), checkOutDate: futureDate(11), totalAmount: 37200, numberOfGuests: 3, paymentStatus: 'pending', depositPaid: 0 },
      { id: 'BK-1011', guestId: 'ahmed_khan', guestName: 'Ahmed Khan', status: 'confirmed', roomNumber: '102', roomName: 'Coastal Breeze Room', checkInDate: futureDate(10), checkOutDate: futureDate(14), totalAmount: 21000, numberOfGuests: 2, paymentStatus: 'pending', depositPaid: 0 },
      { id: 'BK-1012', guestId: 'linda_thompson', guestName: 'Linda Thompson', status: 'checked_out', roomNumber: '105', roomName: 'Coral Garden Terrace', checkInDate: pastDate(20), checkOutDate: pastDate(17), totalAmount: 8400, numberOfGuests: 2, paymentStatus: 'paid', depositPaid: 1260 },
      { id: 'BK-1013', guestId: 'michael_chen', guestName: 'Michael Chen', status: 'checked_out', roomNumber: '110', roomName: 'Zen Garden Studio', checkInDate: pastDate(15), checkOutDate: pastDate(12), totalAmount: 6600, numberOfGuests: 1, paymentStatus: 'paid', depositPaid: 990 },
      { id: 'BK-1014', guestId: 'thomas_shelby', guestName: 'Thomas Shelby', status: 'checked_out', roomNumber: '302', roomName: 'Azure Honeymoon Suite', checkInDate: pastDate(25), checkOutDate: pastDate(22), totalAmount: 14400, numberOfGuests: 2, paymentStatus: 'paid', depositPaid: 2160 },
      { id: 'BK-1015', guestId: 'james_brown', guestName: 'James Brown', status: 'cancelled', roomNumber: '101', roomName: 'Oceanic Executive Suite', checkInDate: futureDate(15), checkOutDate: futureDate(18), totalAmount: 18900, numberOfGuests: 2, paymentStatus: 'refunded', depositPaid: 2835 },
    ];

    for (const b of bookings) {
      await setDoc(doc(db, 'bookings', b.id), b);
    }
    console.log(`✅ Added ${bookings.length} bookings`);

    // ==========================================
    // 5. SERVICE REQUESTS (15)
    // ==========================================
    const serviceRequests = [
      { id: 'M-01', type: 'maintenance', description: 'AC unit making humming noise in 101', status: 'in_progress', assignedTo: 'Thabo Mbeki', guestName: 'Robert Harrison', roomNumber: '101', createdAt: new Date().toISOString(), priority: 'high' },
      { id: 'M-02', type: 'maintenance', description: 'Leaking tap in bathroom 204', status: 'completed', assignedTo: 'Kevin Du Preez', guestName: 'Zoe Katsaros', roomNumber: '204', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), priority: 'medium' },
      { id: 'M-03', type: 'housekeeping', description: 'Extra towels and robes requested for 302', status: 'completed', assignedTo: 'Chris Evans', guestName: 'Amara Okafor', roomNumber: '302', createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), priority: 'low' },
      { id: 'M-04', type: 'maintenance', description: 'Smart TV remote not pairing in 401', status: 'pending', assignedTo: null, guestName: 'Sanjay Gupta', roomNumber: '401', createdAt: new Date().toISOString(), priority: 'medium' },
      { id: 'M-05', type: 'housekeeping', description: 'Daily turn-down service required for VIP guest', status: 'in_progress', assignedTo: 'Frikkie Louw', guestName: 'Emily Blunt', roomNumber: '202', createdAt: new Date().toISOString(), priority: 'high' },
      { id: 'M-06', type: 'maintenance', description: 'Balcony door lock sticking in 110', status: 'pending', assignedTo: null, guestName: 'Jacobus van der Merwe', roomNumber: '110', createdAt: new Date().toISOString(), priority: 'high' },
      { id: 'M-07', type: 'housekeeping', description: 'Urgent spill cleanup in hallway B', status: 'completed', assignedTo: 'Kevin Du Preez', guestName: 'System', roomNumber: 'N/A', createdAt: new Date(Date.now() - 1 * 86400000).toISOString(), priority: 'low' },
      { id: 'M-08', type: 'maintenance', description: 'Shower drain clogged in 305', status: 'pending', assignedTo: null, guestName: 'Sarah Johnson', roomNumber: '305', createdAt: new Date().toISOString(), priority: 'medium' },
      { id: 'M-09', type: 'housekeeping', description: 'Mini bar restocking needed', status: 'in_progress', assignedTo: 'Chris Evans', guestName: 'Maria Garcia', roomNumber: '208', createdAt: new Date().toISOString(), priority: 'low' },
      { id: 'M-10', type: 'maintenance', description: 'WiFi connectivity issues in 205', status: 'pending', assignedTo: null, guestName: 'David Wilson', roomNumber: '205', createdAt: new Date().toISOString(), priority: 'high' },
      { id: 'M-11', type: 'housekeeping', description: 'Extra pillows and blankets requested', status: 'pending', assignedTo: null, guestName: 'Ahmed Khan', roomNumber: '102', createdAt: new Date().toISOString(), priority: 'low' },
      { id: 'M-12', type: 'maintenance', description: 'Safe not opening in 105', status: 'completed', assignedTo: 'Thabo Mbeki', guestName: 'Linda Thompson', roomNumber: '105', createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), priority: 'medium' },
      { id: 'M-13', type: 'housekeeping', description: 'Late checkout cleaning requested', status: 'pending', assignedTo: null, guestName: 'Michael Chen', roomNumber: '110', createdAt: new Date().toISOString(), priority: 'low' },
      { id: 'M-14', type: 'maintenance', description: 'Elevator out of service - urgent', status: 'in_progress', assignedTo: 'Frikkie Louw', guestName: 'System', roomNumber: 'Lobby', createdAt: new Date().toISOString(), priority: 'emergency' },
      { id: 'M-15', type: 'housekeeping', description: 'Welcome amenities for new guest', status: 'pending', assignedTo: null, guestName: 'James Brown', roomNumber: '101', createdAt: new Date().toISOString(), priority: 'medium' },
    ];

    for (const req of serviceRequests) {
      await setDoc(doc(db, 'service_requests', req.id), req);
    }
    console.log(`✅ Added ${serviceRequests.length} service requests`);

    // ==========================================
    // 6. RESTAURANT MENU (RTDB)
    // ==========================================
    const menuRef = ref(rtdb, 'menu');
    await set(menuRef, {
      appetizers: [
        { id: 'a1', name: 'Tuna Tartare', price: 145, description: 'Fresh Atlantic tuna with avocado, sesame, and citrus soy dressing.', dietary: ['gluten-free'], image: '/food/tuna-tartare.jpg' },
        { id: 'a2', name: 'Oysters Rockefeller', price: 180, description: 'Half dozen fresh oysters baked with spinach, herbs, and breadcrumbs.', dietary: ['contains shellfish'], image: '/food/oysters-rockefeller.jpg' },
        { id: 'a3', name: 'Calamari Fritti', price: 110, description: 'Lightly battered and fried calamari served with garlic aioli.', dietary: ['contains shellfish'], image: '/food/calamari-fritti.jpg' },
        { id: 'a4', name: 'Bruschetta', price: 85, description: 'Toasted bread with fresh tomatoes, basil, and balsamic glaze.', dietary: ['vegetarian'], image: '/food/bruschetta.jpg' },
        { id: 'a5', name: 'Charcuterie Board', price: 220, description: 'Selection of cured meats, artisanal cheeses, and olives.', dietary: ['contains dairy'], image: '/food/charcuterie.jpg' },
      ],
      mains: [
        { id: 'm1', name: 'Wagyu Beef Steak', price: 450, description: '250g A5 Wagyu with truffle mash, asparagus, and red wine reduction.', dietary: ['gluten-free option'], image: '/food/wagyu-steak.jpg' },
        { id: 'm2', name: 'Grilled Lobster', price: 580, description: 'Whole lobster split and grilled with garlic herb butter.', dietary: ['contains shellfish'], image: '/food/grilled-lobster.jpg' },
        { id: 'm3', name: 'Wild Mushroom Risotto', price: 210, description: 'Creamy Arborio rice with porcini, shiitake, and truffle oil.', dietary: ['vegetarian'], image: '/food/mushroom-risotto.jpg' },
        { id: 'm4', name: 'Lamb Chops', price: 380, description: 'Grilled New Zealand lamb chops with rosemary jus.', dietary: ['gluten-free'], image: '/food/lamb-chops.jpg' },
        { id: 'm5', name: 'Seafood Paella', price: 420, description: 'Saffron rice with prawns, mussels, calamari, and chorizo.', dietary: ['contains shellfish'], image: '/food/paella.jpg' },
        { id: 'm6', name: 'Vegetable Wellington', price: 240, description: 'Roasted vegetables wrapped in puff pastry with mushroom duxelles.', dietary: ['vegetarian'], image: '/food/wellington.jpg' },
      ],
      desserts: [
        { id: 'de1', name: 'Chocolate Fondant', price: 95, description: 'Warm chocolate lava cake with vanilla bean ice cream.', dietary: ['vegetarian'], image: '/food/chocolate-lava-cake.jpg' },
        { id: 'de2', name: 'Crème Brûlée', price: 85, description: 'Classic Madagascar vanilla bean custard with caramelized sugar top.', dietary: ['vegetarian'], image: '/food/creme-brulee.jpg' },
        { id: 'de3', name: 'Tiramisu', price: 90, description: 'Classic Italian dessert with espresso-soaked ladyfingers.', dietary: ['contains dairy'], image: '/food/tiramisu.jpg' },
        { id: 'de4', name: 'Sorbet Trio', price: 70, description: 'Three scoops of house-made sorbet (lemon, raspberry, mango).', dietary: ['vegan', 'gluten-free'], image: '/food/sorbet.jpg' },
      ],
      beverages: [
        { id: 'b1', name: 'Signature Cocktail', price: 120, description: 'Azure Horizon Special - gin, elderflower, prosecco, and edible flowers.', image: '/food/signature-cocktail.jpg' },
        { id: 'b2', name: 'Cabernet Sauvignon', price: 95, description: 'Glass of premium South African red wine.', dietary: ['vegan'], image: '/food/cabernet.jpg' },
        { id: 'b3', name: 'Sauvignon Blanc', price: 85, description: 'Crisp New Zealand white wine.', dietary: ['vegan'], image: '/food/sauvignon.jpg' },
        { id: 'b4', name: 'Craft Beer', price: 70, description: 'Local artisanal pale ale.', image: '/food/beer.jpg' },
        { id: 'b5', name: 'Fresh Coconut', price: 65, description: 'Chilled young coconut served naturally.', dietary: ['vegan', 'gluten-free'], image: '/food/coconut.jpg' },
      ],
    });
    console.log(`✅ Added restaurant menu`);

    // ==========================================
    // 7. RESTAURANT TABLES
    // ==========================================
    await seedTables();

    // ==========================================
    // 8. SAMPLE TABLE RESERVATIONS (10)
    // ==========================================
    const tableReservations = [
      { guestId: 'robert_harrison', guestName: 'Robert Harrison', date: futureDate(1), time: '19:00', partySize: 2, tableNumber: 5, tableType: 'medium', location: 'Window', status: 'confirmed', specialRequests: 'Anniversary celebration', createdAt: new Date().toISOString() },
      { guestId: 'amara_okafor', guestName: 'Amara Okafor', date: futureDate(1), time: '20:00', partySize: 4, tableNumber: 8, tableType: 'medium', location: 'Indoor', status: 'confirmed', specialRequests: 'Birthday cake', createdAt: new Date().toISOString() },
      { guestId: 'emily_blunt', guestName: 'Emily Blunt', date: futureDate(2), time: '18:30', partySize: 2, tableNumber: 11, tableType: 'large', location: 'Window', status: 'confirmed', specialRequests: 'Window seat preferred', createdAt: new Date().toISOString() },
      { guestId: 'sanjay_gupta', guestName: 'Sanjay Gupta', date: futureDate(2), time: '21:00', partySize: 6, tableNumber: 13, tableType: 'large', location: 'Patio', status: 'confirmed', specialRequests: 'Business dinner', createdAt: new Date().toISOString() },
      { guestId: 'sarah_johnson', guestName: 'Sarah Johnson', date: futureDate(3), time: '19:30', partySize: 3, tableNumber: 7, tableType: 'medium', location: 'Indoor', status: 'confirmed', specialRequests: '', createdAt: new Date().toISOString() },
      { guestId: 'maria_garcia', guestName: 'Maria Garcia', date: futureDate(4), time: '20:30', partySize: 5, tableNumber: 12, tableType: 'large', location: 'Indoor', status: 'confirmed', specialRequests: 'High chair needed', createdAt: new Date().toISOString() },
      { guestId: 'david_wilson', guestName: 'David Wilson', date: futureDate(5), time: '18:00', partySize: 2, tableNumber: 3, tableType: 'small', location: 'Window', status: 'confirmed', specialRequests: 'Early dinner', createdAt: new Date().toISOString() },
      { guestId: 'zoe_katsaros', guestName: 'Zoe Katsaros', date: futureDate(1), time: '20:00', partySize: 4, tableNumber: 9, tableType: 'medium', location: 'Patio', status: 'confirmed', specialRequests: 'Outdoor seating', createdAt: new Date().toISOString() },
      { guestId: 'jacobus_van_der_merwe', guestName: 'Jacobus van der Merwe', date: futureDate(2), time: '19:00', partySize: 2, tableNumber: 4, tableType: 'small', location: 'Indoor', status: 'confirmed', specialRequests: 'Quiet area', createdAt: new Date().toISOString() },
      { guestId: 'isabella_rossi', guestName: 'Isabella Rossi', date: pastDate(1), time: '19:00', partySize: 2, tableNumber: 2, tableType: 'small', location: 'Window', status: 'completed', specialRequests: '', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    ];

    for (const tr of tableReservations) {
      await addDoc(collection(db, 'table_reservations'), tr);
    }
    console.log(`✅ Added ${tableReservations.length} table reservations`);

    // ==========================================
    // 9. SAMPLE ORDER CONFIRMATIONS (5)
    // ==========================================
    const orderConfirmations = [
      { guestId: 'robert_harrison', guestName: 'Robert Harrison', orderId: 'ORD-001', orderType: 'room_delivery', items: [{ name: 'Wagyu Beef Steak', quantity: 1, price: 450 }], subtotal: 450, tax: 45, totalAmount: 495, status: 'delivered', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
      { guestId: 'amara_okafor', guestName: 'Amara Okafor', orderId: 'ORD-002', orderType: 'dine_in', items: [{ name: 'Grilled Lobster', quantity: 2, price: 580 }, { name: 'Chocolate Fondant', quantity: 1, price: 95 }], subtotal: 1255, tax: 125.5, totalAmount: 1380.5, status: 'delivered', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { guestId: 'emily_blunt', guestName: 'Emily Blunt', orderId: 'ORD-003', orderType: 'takeaway', items: [{ name: 'Wild Mushroom Risotto', quantity: 1, price: 210 }, { name: 'Tiramisu', quantity: 1, price: 90 }], subtotal: 300, tax: 30, totalAmount: 330, status: 'ready', createdAt: new Date().toISOString() },
      { guestId: 'sanjay_gupta', guestName: 'Sanjay Gupta', orderId: 'ORD-004', orderType: 'room_delivery', items: [{ name: 'Seafood Paella', quantity: 1, price: 420 }, { name: 'Signature Cocktail', quantity: 2, price: 120 }], subtotal: 660, tax: 66, totalAmount: 726, status: 'preparing', createdAt: new Date().toISOString() },
      { guestId: 'sarah_johnson', guestName: 'Sarah Johnson', orderId: 'ORD-005', orderType: 'dine_in', items: [{ name: 'Lamb Chops', quantity: 1, price: 380 }, { name: 'Crème Brûlée', quantity: 1, price: 85 }], subtotal: 465, tax: 46.5, totalAmount: 511.5, status: 'pending', createdAt: new Date().toISOString() },
    ];

    for (const oc of orderConfirmations) {
      await addDoc(collection(db, 'order_confirmations'), oc);
    }
    console.log(`✅ Added ${orderConfirmations.length} order confirmations`);

    alert("✅ System Initialized Successfully with extensive demo data!");
  } catch (err: unknown) {
    console.error(err);
    alert("Seeding failed. Check console for details.");
  }
};