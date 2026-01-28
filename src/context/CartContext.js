'use client';
import { createContext, useContext, useReducer, useEffect, useState, useMemo } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      // একই আইডি কিন্তু ভিন্ন সাইজ হলে আলাদা আইটেম হিসেবে হ্যান্ডেল করা
      const existingItem = state.find(
        item => item.id === action.payload.id && item.selectedSize === action.payload.selectedSize
      );
      if (existingItem) {
        return state.map(item =>
          (item.id === action.payload.id && item.selectedSize === action.payload.selectedSize)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...state, { ...action.payload, quantity: 1 }];
      }
    
    case 'REMOVE_FROM_CART':
      return state.filter(item => 
        !(item.id === action.payload.id && item.selectedSize === action.payload.selectedSize)
      );

    case 'UPDATE_QUANTITY':
      return state.map(item => 
        (item.id === action.payload.id && item.selectedSize === action.payload.selectedSize)
          ? { ...item, quantity: action.payload.quantity }
          : item
      );

    case 'CLEAR_CART':
      return [];

    case 'SET_CART':
      return action.payload;

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
    const [cart, dispatch] = useReducer(cartReducer, []);
    const [isHydrated, setIsHydrated] = useState(false);

    // ১. লোকাল স্টোরেজ থেকে ডাটা লোড করা (Hydration)
    useEffect(() => {
        try {
            const localData = localStorage.getItem('zaqeen_bag'); // ব্র্যান্ডেড কি নাম
            if (localData) {
                dispatch({ type: 'SET_CART', payload: JSON.parse(localData) });
            }
        } catch (error) {
            console.error("Cart retrieval failed", error);
        }
        setIsHydrated(true);
    }, []);

    // ২. কার্ট আপডেট হলে লোকাল স্টোরেজে সেভ করা
    useEffect(() => {
        if (isHydrated) {
            localStorage.setItem('zaqeen_bag', JSON.stringify(cart));
        }
    }, [cart, isHydrated]);

    // ৩. মেমোরাইজড ক্যালকুলেশন (পারফরম্যান্স অপ্টিমাইজেশন)
    const cartMetrics = useMemo(() => {
        const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
        const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        return { totalItems, totalPrice };
    }, [cart]);

    return (
        <CartContext.Provider value={{ 
            cart, 
            dispatch, 
            isHydrated,
            totalItems: cartMetrics.totalItems,
            totalPrice: cartMetrics.totalPrice 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};