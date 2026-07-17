import { UserProfile, Product, Coupon, Order, CartItem } from '../types';

// Types for PubSub
type ListenerCallback = (data: any) => void;
const listeners: { [key: string]: { id: string; callback: ListenerCallback }[] } = {};

// Register a listener for a specific key/topic
export const subscribeToTopic = (topic: string, id: string, callback: ListenerCallback) => {
  if (!listeners[topic]) {
    listeners[topic] = [];
  }
  listeners[topic].push({ id, callback });
  
  // Return unsubscribe function
  return () => {
    listeners[topic] = listeners[topic].filter(item => item.id !== id);
  };
};

// Publish updates to all listeners on a topic
export const publishTopic = (topic: string, data: any) => {
  if (listeners[topic]) {
    listeners[topic].forEach(item => item.callback(data));
  }
};

// Default seed data
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Truffle Butter Paneer Burger',
    description: 'Fresh grilled paneer patty topped with rich truffle butter sauce, caramelized onions, and crisp lettuce on toasted brioche.',
    price: 189,
    category: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
    isPopular: true,
    inStock: true
  },
  {
    id: 'p2',
    name: 'Peri Peri French Fries',
    description: 'Crispy golden French fries tossed in a fiery peri-peri spice blend. Served with garlic aioli dip.',
    price: 99,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=500&auto=format&fit=crop&q=60',
    isPopular: false,
    inStock: true
  },
  {
    id: 'p3',
    name: 'Double Chocolate Thick Shake',
    description: 'Ultra-creamy milkshake made with rich Belgian dark chocolate gelato, blended with chocolate shards and chocolate drizzle.',
    price: 149,
    category: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=60',
    isPopular: false,
    inStock: true
  },
  {
    id: 'p4',
    name: 'Spicy Chicken Kebab Pizza',
    description: 'Spicy minced chicken kebabs, red paprika, sliced onions, and fresh mozzarella cheese over our house marinara sauce.',
    price: 349,
    category: 'Pizzas',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    isPopular: true,
    inStock: true
  },
  {
    id: 'p5',
    name: 'Classic Veg Margherita',
    description: 'Simple and elegant. Fresh basil, sliced tomatoes, extra virgin olive oil, and melt-in-your-mouth fresh buffalo mozzarella.',
    price: 199,
    category: 'Pizzas',
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&auto=format&fit=crop&q=60',
    isPopular: false,
    inStock: true
  },
  {
    id: 'p6',
    name: 'Cheese Stuffed Garlic Bread',
    description: 'Freshly baked garlic bread overflowing with melted mozzarella cheese and seasoned with Italian herbs.',
    price: 129,
    category: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60',
    isPopular: false,
    inStock: true
  }
];

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'c1',
    code: 'WELCOME50',
    discountType: 'PERCENTAGE',
    discountValue: 50,
    minSubtotal: 200,
    isActive: true
  },
  {
    id: 'c2',
    code: 'POCKETSAVER',
    discountType: 'FIXED',
    discountValue: 40,
    minSubtotal: 120,
    isActive: true
  },
  {
    id: 'c3',
    code: 'FREEBIE',
    discountType: 'PERCENTAGE',
    discountValue: 100,
    minSubtotal: 0,
    isActive: true
  }
];

// Helper to get/set localStorage values
export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data) as T;
};

export const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Initialize Mock Database
export const initializeMockDatabase = () => {
  getStorageItem<Product[]>('ecom_products', DEFAULT_PRODUCTS);
  getStorageItem<Coupon[]>('ecom_coupons', DEFAULT_COUPONS);
  
  // Preset Users
  const defaultUsers: UserProfile[] = [
    {
      uid: 'u_admin',
      email: 'admin@restaurant.com',
      role: 'admin',
      name: 'Chef Manager',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'u_customer',
      email: 'customer@user.com',
      role: 'customer',
      name: 'John Doe',
      createdAt: new Date().toISOString(),
      addresses: ['123 Main St, Tech Park', '456 Garden Avenue']
    },
    {
      uid: 'u_rider',
      email: 'rider@delivery.com',
      role: 'delivery_partner',
      name: 'Alex Rider',
      createdAt: new Date().toISOString(),
      partnerStatus: 'idle',
      cashCollected: 0,
      currentCoordinates: {
        latitude: 12.9716, // Near Bangalore City Center
        longitude: 77.5946,
        timestamp: Date.now()
      }
    }
  ];
  
  const users = getStorageItem<UserProfile[]>('ecom_users', defaultUsers);
  
  // Set up mock auth user if not present
  if (!sessionStorage.getItem('ecom_current_user')) {
    // Leave guest / unauthenticated by default
  }
};
