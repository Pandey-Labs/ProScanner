import { create } from 'zustand';

export interface Product {
  _id: string;
  name: string;
  barcode: string;
  price: number;
  stock_quantity: number;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
  total: number;
}

interface AppState {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
}

export const useStore = create<AppState>((set, get) => ({
  cart: [],
  addToCart: (product) => set((state) => {
    const existingItem = state.cart.find(item => item._id === product._id);
    if (existingItem) {
      return {
        cart: state.cart.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        )
      };
    }
    return {
      cart: [...state.cart, { ...product, quantity: 1, total: product.price }]
    };
  }),
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item._id !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    cart: state.cart.map(item =>
      item._id === productId
        ? { ...item, quantity, total: quantity * item.price }
        : item
    )
  })),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => {
    const { cart } = get();
    return cart.reduce((sum, item) => sum + item.total, 0);
  }
}));
