import { Product, Coupon, UserProfile, Order, CartItem } from '../types';
import { isMockMode, db as fDb } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  addDoc, deleteDoc, onSnapshot, query, where, orderBy 
} from 'firebase/firestore';
import { getStorageItem, setStorageItem, publishTopic, subscribeToTopic } from './mockFirebase';

// -------------------------------------------------------------
// PRODUCTS
// -------------------------------------------------------------
export const getProducts = async (): Promise<Product[]> => {
  if (isMockMode) {
    return getStorageItem<Product[]>('ecom_products', []);
  }
  
  const colRef = collection(fDb, 'products');
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
};

export const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
  if (isMockMode) {
    const products = getStorageItem<Product[]>('ecom_products', []);
    const id = 'p_' + Date.now();
    const newProduct = { id, ...product };
    products.push(newProduct);
    setStorageItem('ecom_products', products);
    return id;
  }
  
  const colRef = collection(fDb, 'products');
  const docRef = await addDoc(colRef, product);
  return docRef.id;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<void> => {
  if (isMockMode) {
    const products = getStorageItem<Product[]>('ecom_products', []);
    const updated = products.map(p => p.id === id ? { ...p, ...updates } : p);
    setStorageItem('ecom_products', updated);
    return;
  }
  
  const docRef = doc(fDb, 'products', id);
  await updateDoc(docRef, updates);
};

export const deleteProduct = async (id: string): Promise<void> => {
  if (isMockMode) {
    const products = getStorageItem<Product[]>('ecom_products', []);
    const filtered = products.filter(p => p.id !== id);
    setStorageItem('ecom_products', filtered);
    return;
  }
  
  const docRef = doc(fDb, 'products', id);
  await deleteDoc(docRef);
};

// -------------------------------------------------------------
// COUPONS
// -------------------------------------------------------------
export const getCoupons = async (): Promise<Coupon[]> => {
  if (isMockMode) {
    return getStorageItem<Coupon[]>('ecom_coupons', []);
  }
  
  const colRef = collection(fDb, 'coupons');
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Coupon));
};

export const addCoupon = async (coupon: Omit<Coupon, 'id'>): Promise<string> => {
  if (isMockMode) {
    const coupons = getStorageItem<Coupon[]>('ecom_coupons', []);
    const id = 'c_' + Date.now();
    const newCoupon = { id, ...coupon };
    coupons.push(newCoupon);
    setStorageItem('ecom_coupons', coupons);
    return id;
  }
  
  const colRef = collection(fDb, 'coupons');
  const docRef = await addDoc(colRef, coupon);
  return docRef.id;
};

export const updateCoupon = async (id: string, updates: Partial<Coupon>): Promise<void> => {
  if (isMockMode) {
    const coupons = getStorageItem<Coupon[]>('ecom_coupons', []);
    const updated = coupons.map(c => c.id === id ? { ...c, ...updates } : c);
    setStorageItem('ecom_coupons', updated);
    return;
  }
  
  const docRef = doc(fDb, 'coupons', id);
  await updateDoc(docRef, updates);
};

export const deleteCoupon = async (id: string): Promise<void> => {
  if (isMockMode) {
    const coupons = getStorageItem<Coupon[]>('ecom_coupons', []);
    const filtered = coupons.filter(c => c.id !== id);
    setStorageItem('ecom_coupons', filtered);
    return;
  }
  
  const docRef = doc(fDb, 'coupons', id);
  await deleteDoc(docRef);
};

// -------------------------------------------------------------
// USERS / ROLE MANAGEMENT
// -------------------------------------------------------------
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (isMockMode) {
    const users = getStorageItem<UserProfile[]>('ecom_users', []);
    return users.find(u => u.uid === uid) || null;
  }
  
  const docRef = doc(fDb, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const createUserProfile = async (uid: string, profile: Omit<UserProfile, 'uid' | 'createdAt'>): Promise<UserProfile> => {
  const newProfile: UserProfile = {
    uid,
    createdAt: new Date().toISOString(),
    ...profile
  };
  
  if (isMockMode) {
    const users = getStorageItem<UserProfile[]>('ecom_users', []);
    if (!users.some(u => u.uid === uid)) {
      users.push(newProfile);
      setStorageItem('ecom_users', users);
    }
    return newProfile;
  }
  
  const docRef = doc(fDb, 'users', uid);
  await setDoc(docRef, newProfile);
  return newProfile;
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  if (isMockMode) {
    const users = getStorageItem<UserProfile[]>('ecom_users', []);
    const updated = users.map(u => u.uid === uid ? { ...u, ...updates } : u);
    setStorageItem('ecom_users', updated);
    
    // Notify user listeners
    publishTopic(`user_${uid}`, updated.find(u => u.uid === uid));
    // If it's a delivery partner, notify their listener
    const rider = updated.find(u => u.uid === uid);
    if (rider && rider.role === 'delivery_partner') {
      publishTopic(`rider_${uid}`, rider.currentCoordinates);
      publishTopic('delivery_partners_changed', updated.filter(u => u.role === 'delivery_partner'));
    }
    return;
  }
  
  const docRef = doc(fDb, 'users', uid);
  await updateDoc(docRef, updates);
};

export const getDeliveryPartners = async (): Promise<UserProfile[]> => {
  if (isMockMode) {
    const users = getStorageItem<UserProfile[]>('ecom_users', []);
    return users.filter(u => u.role === 'delivery_partner');
  }
  
  const colRef = collection(fDb, 'users');
  const q = query(colRef, where('role', '==', 'delivery_partner'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data() as UserProfile);
};

// -------------------------------------------------------------
// ORDERS
// -------------------------------------------------------------
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> => {
  const id = 'ord_' + Math.floor(Math.random() * 1000000);
  const newOrder: Order = {
    id,
    createdAt: new Date().toISOString(),
    ...orderData
  };
  
  if (isMockMode) {
    const orders = getStorageItem<Order[]>('ecom_orders', []);
    orders.unshift(newOrder); // Newest first
    setStorageItem('ecom_orders', orders);
    publishTopic('orders_changed', orders);
    return newOrder;
  }
  
  const docRef = doc(fDb, 'orders', id);
  await setDoc(docRef, newOrder);
  return newOrder;
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  if (isMockMode) {
    const orders = getStorageItem<Order[]>('ecom_orders', []);
    return orders.find(o => o.id === orderId) || null;
  }
  
  const docRef = doc(fDb, 'orders', orderId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as Order;
  }
  return null;
};

export const updateOrderStatus = async (orderId: string, status: Order['orderStatus']): Promise<void> => {
  if (isMockMode) {
    const orders = getStorageItem<Order[]>('ecom_orders', []);
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    order.orderStatus = status;
    
    // Transition partner status if picking up/delivering
    if (order.assignedPartnerId) {
      const users = getStorageItem<UserProfile[]>('ecom_users', []);
      const rider = users.find(u => u.uid === order.assignedPartnerId);
      if (rider) {
        if (status === 'PICKED_UP') {
          rider.partnerStatus = 'delivering';
        } else if (status === 'DELIVERED') {
          rider.partnerStatus = 'idle';
          // If COD payment, add to collected cash
          if (order.paymentMethod === 'COD') {
            order.paymentStatus = 'PAID';
            rider.cashCollected = (rider.cashCollected || 0) + order.totalAmount;
          }
        }
        setStorageItem('ecom_users', users);
        publishTopic(`user_${rider.uid}`, rider);
        publishTopic('delivery_partners_changed', users.filter(u => u.role === 'delivery_partner'));
      }
    }
    
    setStorageItem('ecom_orders', orders);
    publishTopic('orders_changed', orders);
    publishTopic(`order_${orderId}`, order);
    return;
  }
  
  const docRef = doc(fDb, 'orders', orderId);
  await updateDoc(docRef, { orderStatus: status });
  
  // Real Firebase side: status cascades will be updated in components/portal
};

export const updateOrderPaymentStatus = async (orderId: string, status: Order['paymentStatus']): Promise<void> => {
  if (isMockMode) {
    const orders = getStorageItem<Order[]>('ecom_orders', []);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.paymentStatus = status;
      setStorageItem('ecom_orders', orders);
      publishTopic('orders_changed', orders);
      publishTopic(`order_${orderId}`, order);
    }
    return;
  }
  
  const docRef = doc(fDb, 'orders', orderId);
  await updateDoc(docRef, { paymentStatus: status });
};

export const assignRiderToOrder = async (orderId: string, riderId: string | null): Promise<void> => {
  let riderName: string | null = null;
  if (riderId) {
    const riderProfile = await getUserProfile(riderId);
    riderName = riderProfile ? riderProfile.name : 'Delivery Partner';
  }
  
  if (isMockMode) {
    const orders = getStorageItem<Order[]>('ecom_orders', []);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      order.assignedPartnerId = riderId;
      setStorageItem('ecom_orders', orders);
      publishTopic('orders_changed', orders);
      publishTopic(`order_${orderId}`, order);
    }
    return;
  }
  
  const docRef = doc(fDb, 'orders', orderId);
  await updateDoc(docRef, { assignedPartnerId: riderId });
};

// -------------------------------------------------------------
// REAL-TIME STREAMS (PubSub in Mock, onSnapshot in Firebase)
// -------------------------------------------------------------

export const streamOrders = (callback: (orders: Order[]) => void): (() => void) => {
  if (isMockMode) {
    const initialOrders = getStorageItem<Order[]>('ecom_orders', []);
    callback(initialOrders);
    return subscribeToTopic('orders_changed', 'order_stream_' + Math.random(), callback);
  }
  
  const colRef = collection(fDb, 'orders');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => doc.data() as Order);
    callback(orders);
  });
};

export const streamActiveOrder = (orderId: string, callback: (order: Order | null) => void): (() => void) => {
  if (isMockMode) {
    const orders = getStorageItem<Order[]>('ecom_orders', []);
    const order = orders.find(o => o.id === orderId) || null;
    callback(order);
    return subscribeToTopic(`order_${orderId}`, 'active_order_' + orderId + '_' + Math.random(), callback);
  }
  
  const docRef = doc(fDb, 'orders', orderId);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as Order);
    } else {
      callback(null);
    }
  });
};

export const streamRiderCoordinates = (riderId: string, callback: (coords: UserProfile['currentCoordinates'] | undefined) => void): (() => void) => {
  if (isMockMode) {
    const users = getStorageItem<UserProfile[]>('ecom_users', []);
    const rider = users.find(u => u.uid === riderId);
    callback(rider?.currentCoordinates);
    return subscribeToTopic(`rider_${riderId}`, 'rider_coord_' + riderId + '_' + Math.random(), callback);
  }
  
  const docRef = doc(fDb, 'users', riderId);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as UserProfile;
      callback(data.currentCoordinates);
    } else {
      callback(undefined);
    }
  });
};

export const streamDeliveryPartners = (callback: (riders: UserProfile[]) => void): (() => void) => {
  if (isMockMode) {
    const users = getStorageItem<UserProfile[]>('ecom_users', []);
    callback(users.filter(u => u.role === 'delivery_partner'));
    return subscribeToTopic('delivery_partners_changed', 'riders_stream_' + Math.random(), callback);
  }
  
  const colRef = collection(fDb, 'users');
  const q = query(colRef, where('role', '==', 'delivery_partner'));
  return onSnapshot(q, (snapshot) => {
    const riders = snapshot.docs.map(doc => doc.data() as UserProfile);
    callback(riders);
  });
};

export const updateRiderLocation = async (riderId: string, coords: { latitude: number; longitude: number; heading?: number }): Promise<void> => {
  const currentCoords = {
    ...coords,
    timestamp: Date.now()
  };
  
  await updateUserProfile(riderId, {
    currentCoordinates: currentCoords
  });
};

export const settleRiderCash = async (riderId: string): Promise<void> => {
  await updateUserProfile(riderId, {
    cashCollected: 0
  });
};

export const seedLiveDatabase = async (): Promise<void> => {
  const products = await getProducts();
  if (products.length === 0) {
    const defaultProducts = [
      {
        name: 'Truffle Butter Paneer Burger',
        description: 'Fresh grilled paneer patty topped with rich truffle butter sauce, caramelized onions, and crisp lettuce on toasted brioche.',
        price: 189,
        category: 'Burgers',
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
        isPopular: true,
        inStock: true
      },
      {
        name: 'Peri Peri French Fries',
        description: 'Crispy golden French fries tossed in a fiery peri-peri spice blend. Served with garlic aioli dip.',
        price: 99,
        category: 'Sides',
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&auto=format&fit=crop&q=60',
        isPopular: false,
        inStock: true
      },
      {
        name: 'Double Chocolate Thick Shake',
        description: 'Ultra-creamy milkshake made with rich Belgian dark chocolate gelato, blended with chocolate shards and chocolate drizzle.',
        price: 149,
        category: 'Beverages',
        imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=60',
        isPopular: false,
        inStock: true
      },
      {
        name: 'Spicy Chicken Kebab Pizza',
        description: 'Spicy minced chicken kebabs, red paprika, sliced onions, and fresh mozzarella cheese over our house marinara sauce.',
        price: 349,
        category: 'Pizzas',
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
        isPopular: true,
        inStock: true
      },
      {
        name: 'Classic Veg Margherita',
        description: 'Simple and elegant. Fresh basil, sliced tomatoes, extra virgin olive oil, and melt-in-your-mouth fresh buffalo mozzarella.',
        price: 199,
        category: 'Pizzas',
        imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&auto=format&fit=crop&q=60',
        isPopular: false,
        inStock: true
      },
      {
        name: 'Cheese Stuffed Garlic Bread',
        description: 'Freshly baked garlic bread overflowing with melted mozzarella cheese and seasoned with Italian herbs.',
        price: 129,
        category: 'Sides',
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
        isPopular: false,
        inStock: true
      }
    ];
    for (const prod of defaultProducts) {
      await addProduct(prod);
    }
  }

  const coupons = await getCoupons();
  if (coupons.length === 0) {
    const defaultCoupons = [
      {
        code: 'WELCOME50',
        discountType: 'PERCENTAGE' as const,
        discountValue: 50,
        minSubtotal: 200,
        isActive: true
      },
      {
        code: 'POCKETSAVER',
        discountType: 'FIXED' as const,
        discountValue: 40,
        minSubtotal: 120,
        isActive: true
      },
      {
        code: 'FREEBIE',
        discountType: 'PERCENTAGE' as const,
        discountValue: 100,
        minSubtotal: 0,
        isActive: true
      }
    ];
    for (const coup of defaultCoupons) {
      await addCoupon(coup);
    }
  }
};

