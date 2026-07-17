export interface UserProfile {
  uid: string;
  email: string;
  role: 'customer' | 'admin' | 'delivery_partner';
  name: string;
  createdAt: string;
  addresses?: string[]; // Saved delivery addresses for customers
  cashCollected?: number; // Outstanding COD cash held by delivery_partner
  // Only populated if role === 'delivery_partner'
  partnerStatus?: 'idle' | 'delivering';
  currentCoordinates?: {
    latitude: number;
    longitude: number;
    heading?: number;
    timestamp: number;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isPopular: boolean; // "Trending Now"
  inStock: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minSubtotal: number;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  assignedPartnerId: string | null; // Set manually by Admin
  items: CartItem[];
  subtotal: number; // For calculations
  discountApplied: number; // Coupon reduction
  totalAmount: number;
  paymentMethod: 'COD' | 'UPI';
  paymentStatus: 'UNPAID_COD' | 'PAID';
  orderStatus: 'PLACED' | 'PREPARING' | 'PICKED_UP' | 'DELIVERED';
  deliveryAddress: {
    street: string;
    coordinates: { latitude: number; longitude: number };
  };
  createdAt: string;
}
