'use client';

import React, { createContext, useReducer, useContext, useEffect } from 'react';

// 1. Initial State
const initialState = {
  wishlistItems: [],
};

// 2. Reducer Function
const wishlistReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_WISHLIST': {
      const itemExists = state.wishlistItems.find(item => item.id === action.payload.id);
      if (itemExists) {
        return state; // যদি আগে থেকেই থাকে, পরিবর্তনไม่ต้อง
      }
      const newWishlistItems = [...state.wishlistItems, action.payload];
      // localStorage-এ সেভ করা
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist', JSON.stringify(newWishlistItems));
      }
      return {
        ...state,
        wishlistItems: newWishlistItems,
      };
    }
    case 'REMOVE_FROM_WISHLIST': {
      const newWishlistItems = state.wishlistItems.filter(item => item.id !== action.payload.id);
      // localStorage-এ আপডেট করা
      if (typeof window !== 'undefined') {
        localStorage.setItem('wishlist', JSON.stringify(newWishlistItems));
      }
      return {
        ...state,
        wishlistItems: newWishlistItems,
      };
    }
    case 'INITIALIZE_WISHLIST': {
        return {
            ...state,
            wishlistItems: action.payload || [],
        };
    }
    default:
      return state;
  }
};

// 3. Create Context
const WishlistContext = createContext();

// 4. Provider Component
export const WishlistProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  // অ্যাপ লোড হওয়ার সময় localStorage থেকে ডেটা আনা
  useEffect(() => {
    try {
        const localData = localStorage.getItem('wishlist');
        if (localData) {
            dispatch({ type: 'INITIALIZE_WISHLIST', payload: JSON.parse(localData) });
        }
    } catch (error) {
        console.error("Failed to parse wishlist from localStorage", error);
        localStorage.removeItem('wishlist'); // ভাঙা ডেটা মুছে ফেলা
    }
  }, []);

  return (
    <WishlistContext.Provider value={{ state, dispatch }}>
      {children}
    </WishlistContext.Provider>
  );
};

// 5. Custom Hook for easy context usage
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
