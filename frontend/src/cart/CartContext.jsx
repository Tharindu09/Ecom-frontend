import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS, endpoints } from "../api/endpoints.js";
import { addMyCartItem, getMyCart } from "../api/cartService.js";
import { useAuth } from "../auth/AuthContext.js";

const CartContext = createContext(null);

const loadStoredItems = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.cartItems);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const mergeItems = (localItems, serverItems) => {
  const merged = [...localItems];
  serverItems.forEach((serverItem) => {
    if (!serverItem?.productId) return;
    const existing = merged.find((item) => item.productId === serverItem.productId);
    if (existing) {
      existing.qty = Math.max(existing.qty || 0, serverItem.qty || 0) || 1;
      existing.name = existing.name || serverItem.name;
      existing.price = existing.price || serverItem.price;
      existing.imageUrl = existing.imageUrl || serverItem.imageUrl;
    } else {
      merged.push({
        productId: serverItem.productId,
        qty: serverItem.qty || 1,
        name: serverItem.name,
        price: serverItem.price,
        imageUrl: serverItem.imageUrl,
      });
    }
  });
  return merged;
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState(loadStoredItems);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.cartItems, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    getMyCart()
      .then((data) => {
        if (!isMounted) return;
        const serverItems = endpoints.cart.mapServerCartToItems(data);
        setItems((prev) => mergeItems(prev, serverItems));
      })
      .catch((error) => {
        console.error("Failed to fetch my cart", error);
      });
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const addItem = useCallback(async (product, qty = 1) => {
    const productId = product?.id || product?.productId;
    if (!productId) return;
    const newItem = {
      productId,
      qty,
      name: product?.name || product?.title,
      price: product?.price,
      imageUrl: product?.imageUrl || product?.image || product?.images?.[0],
    };

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      return [...prev, newItem];
    });

    if (isAuthenticated) {
      addMyCartItem({ productId, qty }).catch((error) => {
        console.error("Failed to add item to my cart", error);
      });
    }
  }, [isAuthenticated]);

  const updateItemQty = useCallback(async (productId, qty) => {
    if (qty < 1) return;
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, qty } : item
      )
    );
  }, []);

  const removeCartItem = useCallback(async (productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const persistMyCart = useCallback(async () => {
    if (!isAuthenticated) {
      return { ok: false, error: new Error("Login required") };
    }
    setSyncing(true);
    try {
      const current = await getMyCart();
      const serverItems = endpoints.cart.mapServerCartToItems(current);
      const existingQtyByProductId = new Map(
        serverItems.map((item) => [item.productId, item.qty || 0])
      );

      const pendingAdds = items
        .map((item) => {
          const serverQty = existingQtyByProductId.get(item.productId) || 0;
          const delta = (item.qty || 0) - serverQty;
          return { productId: item.productId, qty: delta };
        })
        .filter((item) => item.qty > 0)
        .map((item) => addMyCartItem(item));

      if (pendingAdds.length > 0) {
        await Promise.all(pendingAdds);
      }
      return { ok: true };
    } catch (error) {
      console.error("Failed to persist my cart", error);
      return { ok: false, error };
    } finally {
      setSyncing(false);
    }
  }, [isAuthenticated, items]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEYS.cartId);
    localStorage.removeItem(STORAGE_KEYS.cartItems);
  }, []);

  const value = useMemo(
    () => ({
      items,
      syncing,
      addItem,
      updateItemQty,
      removeCartItem,
      persistMyCart,
      clearCart,
      setItems,
    }),
    [items, syncing, addItem, updateItemQty, removeCartItem, persistMyCart, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
