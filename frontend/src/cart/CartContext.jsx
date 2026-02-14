import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS, endpoints } from "../api/endpoints.js";
import { addMyCartItem, clearMyCart, getMyCart, removeMyCartItem } from "../api/cartService.js";
import { useAuth } from "../auth/AuthContext.js";

const CartContext = createContext(null);

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

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
    const serverStock =
      asNumber(serverItem.stock) ??
      asNumber(serverItem.Stock) ??
      asNumber(serverItem.productStock) ??
      null;
    const existing = merged.find((item) => item.productId === serverItem.productId);
    if (existing) {
      existing.qty = Math.max(existing.qty || 0, serverItem.qty || 0) || 1;
      existing.name = existing.name || serverItem.name;
      existing.price = existing.price || serverItem.price;
      existing.imageUrl = existing.imageUrl || serverItem.imageUrl;
      if (existing.stock == null && serverStock != null) {
        existing.stock = serverStock;
      }
    } else {
      merged.push({
        productId: serverItem.productId,
        qty: serverItem.qty || 1,
        name: serverItem.name,
        price: serverItem.price,
        imageUrl: serverItem.imageUrl,
        stock: serverStock ?? null,
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
    const stock =
      asNumber(product?.stock) ??
      asNumber(product?.Stock) ??
      asNumber(product?.productStock) ??
      null;
    const stockCap = stock != null && stock > 0 ? stock : null;
    const newItem = {
      productId,
      qty,
      name: product?.name || product?.title,
      price: product?.price,
      imageUrl: product?.imageUrl || product?.image || product?.images?.[0],
      stock,
    };

    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        const nextQty =
          stockCap != null ? Math.min(existing.qty + qty, stockCap) : existing.qty + qty;
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, qty: nextQty, stock: item.stock ?? stock }
            : item
        );
      }
      if (stock != null && stock <= 0) return prev;
      return [...prev, { ...newItem, qty: stockCap != null ? Math.min(qty, stockCap) : qty }];
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
        item.productId === productId
          ? {
              ...item,
              qty:
                item.stock != null && item.stock > 0 && qty > item.stock
                  ? item.stock
                  : qty,
            }
          : item
      )
    );
  }, []);

  const removeCartItem = useCallback(async (productId) => {
    let previousItems = [];
    setItems((prev) => {
      previousItems = prev;
      return prev.filter((item) => item.productId !== productId);
    });

    if (!isAuthenticated) {
      return { ok: true };
    }

    try {
      await removeMyCartItem(productId);
      return { ok: true };
    } catch (error) {
      setItems(previousItems);
      console.error("Failed to remove item from my cart", error);
      return { ok: false, error };
    }
  }, [isAuthenticated]);

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

  const clearCart = useCallback(async () => {
    const previousItems = items;
    setItems([]);
    localStorage.removeItem(STORAGE_KEYS.cartId);
    localStorage.removeItem(STORAGE_KEYS.cartItems);

    if (!isAuthenticated) {
      return { ok: true };
    }

    try {
      await clearMyCart();
      return { ok: true };
    } catch (error) {
      setItems(previousItems);
      console.error("Failed to clear my cart", error);
      return { ok: false, error };
    }
  }, [isAuthenticated, items]);

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
