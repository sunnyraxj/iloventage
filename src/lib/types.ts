

// From collections collection
export type Category = {
    id: string;
    name: string;
    description?: string;
    gender: 'male' | 'female' | 'unisex' | 'all';
    imageUrl?: string;
    slug: string;
};

// From products collection
export type ProductSize = {
    size: string;
    stock: number;
};

export type ProductVariant = {
    color: string;
    imageUrls: string[];
    sizes: ProductSize[];
};

export type Product = {
    id:string;
    name: string;
    slug: string;
    description: string;
    brand: string;
    gender: 'male' | 'female' | 'unisex';
    collectionId: string;
    price: number;
    mrp?: number;
    moq: number;
    clicks: number;
    isVisible: boolean;
    createdAt: string; // ISO string
    videoUrl?: string;
    additionalDetails?: string[];
    variants: ProductVariant[];
};

// From users collection
export type UserAddress = {
    id: string;
    name: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    userId: string;
};

export type User = {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'customer';
    photoURL?: string;
    addresses?: UserAddress[];
};

// From orders collection
export type OrderAddress = {
    name: string;
    mobile: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
};

export type OrderItem = {
    id: string; // This will be a unique ID for the cart item, e.g. `${productId}-${color}-${size}`
    productId: string;
    name: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
    stock: number;
    moq: number;
    imageUrl: string;
};

export type Order = {
    id: string;
    orderNumber: string;
    orderStatus: 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'pending';
    paymentStatus: 'paid' | 'unpaid' | 'refunded';
    userId: string | null;
    guestEmail?: string;
    createdAt: string; // ISO string
    confirmedAt?: string; // ISO string
    shipping: number;
    total: number;
    address: OrderAddress;
    items: OrderItem[];
    razorpay: {
        orderId: string;
        paymentId: string;
        method: string;
    };
};

// From settings collection
export type StoreDetails = {
    name: string;
    email: string;
    phone: string;
    phone2?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    logoUrl: string;
    heroImageUrl: string;
    instagramUrl?: string;
    whatsappGroupUrl?: string;
};

export type ShippingSettings = {
    belowThresholdRate: number;
    freeShippingThreshold: number;
};

export type StoreSettings = {
    id: string;
    storeDetails: StoreDetails;
    shippingSettings: ShippingSettings;
};

// For Cart
export type CartItem = OrderItem;
