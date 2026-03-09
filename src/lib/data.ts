import type { Product, Category, User, Order } from './types';

export const categories: Category[] = [
  { id: '1', name: 'Apparel', slug: 'apparel', image: 'category-apparel' },
  { id: '2', name: 'Shoes', slug: 'shoes', image: 'category-shoes' },
  { id: '3', name: 'Accessories', slug: 'accessories', image: 'category-accessories' },
  { id: '4', name: 'Electronics', slug: 'electronics', image: 'category-electronics' },
];

export const products: Product[] = [
  {
    id: '1',
    slug: 'classic-leather-jacket',
    name: 'Classic Leather Jacket',
    description:
      'A timeless piece that adds an edge to any outfit. Made from 100% genuine leather, this jacket is built to last and will only get better with age. Features a classic collar, zip-front closure, and multiple pockets for functionality.',
    price: 299.99,
    originalPrice: 350.0,
    images: ['product-1'],
    category: 'apparel',
    stock: 15,
    featured: true,
    keywords: ['leather', 'jacket', 'classic', 'biker'],
  },
  {
    id: '2',
    slug: 'sleek-wireless-headphones',
    name: 'Sleek Wireless Headphones',
    description:
      'Experience immersive sound with these sleek, comfortable wireless headphones. Featuring active noise cancellation, a 30-hour battery life, and crystal-clear microphone for calls. Perfect for music lovers and professionals on the go.',
    price: 179.99,
    images: ['product-2'],
    category: 'electronics',
    stock: 30,
    featured: true,
    keywords: ['headphones', 'wireless', 'noise-cancelling', 'audio'],
  },
  {
    id: '3',
    slug: 'comfort-running-shoes',
    name: 'Comfort Running Shoes',
    description:
      'Engineered for maximum comfort and performance. These running shoes feature a breathable mesh upper, responsive cushioning, and a durable outsole for excellent traction. Ideal for your daily run or gym session.',
    price: 120.0,
    images: ['product-3'],
    category: 'shoes',
    stock: 0,
    featured: false,
    keywords: ['running', 'shoes', 'sneakers', 'sport'],
  },
  {
    id: '4',
    slug: 'stylish-durable-backpack',
    name: 'Stylish & Durable Backpack',
    description:
      'A versatile backpack that combines style and functionality. Made from water-resistant materials, it features a padded laptop compartment, multiple organizational pockets, and comfortable shoulder straps. Perfect for work, travel, or school.',
    price: 89.99,
    originalPrice: 110.0,
    images: ['product-4'],
    category: 'accessories',
    stock: 40,
    featured: true,
    keywords: ['backpack', 'travel', 'laptop', 'durable'],
  },
  {
    id: '5',
    slug: 'minimalist-wristwatch',
    name: 'Minimalist Wristwatch',
    description:
      'An elegant and minimalist wristwatch that complements any style. Features a clean dial, stainless steel case, and a genuine leather strap. A sophisticated accessory for any occasion.',
    price: 150.0,
    images: ['product-5'],
    category: 'accessories',
    stock: 25,
    featured: false,
    keywords: ['watch', 'wristwatch', 'minimalist', 'accessory'],
  },
  {
    id: '6',
    slug: 'formal-blue-shirt',
    name: 'Formal Blue Shirt',
    description:
      'A crisp, formal blue shirt made from high-quality cotton. Designed for a modern fit, it\'s perfect for the office or formal events. Easy to iron and comfortable to wear all day long.',
    price: 65.0,
    images: ['product-6'],
    category: 'apparel',
    stock: 60,
    featured: true,
    keywords: ['shirt', 'formal', 'cotton', 'business'],
  },
  {
    id: '7',
    slug: 'latest-model-smartphone',
    name: 'Latest Model Smartphone',
    description:
      'Stay connected with the latest smartphone technology. Featuring a stunning OLED display, a powerful processor for seamless multitasking, and a pro-grade camera system to capture life\'s moments in brilliant detail.',
    price: 999.0,
    images: ['product-7'],
    category: 'electronics',
    stock: 20,
    featured: false,
    keywords: ['smartphone', 'tech', 'mobile', 'camera'],
  },
  {
    id: '8',
    slug: 'designer-sunglasses',
    name: 'Designer Sunglasses',
    description:
      'Protect your eyes in style with these designer sunglasses. Offering 100% UV protection, these shades feature a lightweight frame and scratch-resistant lenses. A must-have accessory for sunny days.',
    price: 210.0,
    images: ['product-8'],
    category: 'accessories',
    stock: 35,
    featured: true,
    keywords: ['sunglasses', 'designer', 'eyewear', 'fashion'],
  },
  {
    id: '9',
    slug: 'classic-denim-jeans',
    name: 'Classic Denim Jeans',
    description:
      'A wardrobe staple, these classic denim jeans are made for comfort and style. Featuring a slim-fit design and durable denim fabric, they are perfect for casual wear. Versatile and timeless.',
    price: 75.99,
    originalPrice: 90.0,
    images: ['product-9'],
    category: 'apparel',
    stock: 80,
    featured: false,
    keywords: ['jeans', 'denim', 'pants', 'casual'],
  },
];

export const users: User[] = [
    { id: '1', name: 'Admin User', email: 'admin@iloventag.com', role: 'admin' },
    { id: '2', name: 'Customer User', email: 'customer@iloventag.com', role: 'customer' },
];

export const orders: Order[] = [
    {
        id: 'ORD-001',
        userId: '2',
        products: [
            { product: products[0], quantity: 1 },
            { product: products[2], quantity: 1 },
        ],
        totalPrice: products[0].price + products[2].price,
        orderStatus: 'Shipped',
        paymentId: 'pay_MOCK12345',
        createdAt: '2023-10-26T10:00:00Z',
        shippingAddress: {
            name: 'Customer User',
            address: '123 Market St',
            city: 'San Francisco',
            zip: '94103',
            country: 'USA'
        }
    },
    {
        id: 'ORD-002',
        userId: '2',
        products: [
            { product: products[3], quantity: 2 },
        ],
        totalPrice: products[3].price * 2,
        orderStatus: 'Confirmed',
        paymentId: 'pay_MOCK12346',
        createdAt: '2023-10-28T14:30:00Z',
        shippingAddress: {
            name: 'Customer User',
            address: '123 Market St',
            city: 'San Francisco',
            zip: '94103',
            country: 'USA'
        }
    }
];

// Data access functions
export const getProducts = () => products;
export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
export const getFeaturedProducts = () => products.filter((p) => p.featured);
export const getCategories = () => categories;
export const getCategoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);
export const getProductsByCategory = (categorySlug: string) => products.filter((p) => p.category === categorySlug);
export const getUsers = () => users;
export const getUserByEmail = (email: string) => users.find(u => u.email === email);
export const getOrders = () => orders;
export const getOrdersByUserId = (userId: string) => orders.filter(o => o.userId === userId);
export const getOrderById = (id: string) => orders.find(o => o.id === id);
