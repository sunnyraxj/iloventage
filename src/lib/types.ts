export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  image: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: string;
  stock: number;
  featured: boolean;
  keywords: string[];
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  products: {
    product: Product;
    quantity: number;
  }[];
  totalPrice: number;
  orderStatus: 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  paymentId: string;
  createdAt: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    zip: string;
    country: string;
  };
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
};
