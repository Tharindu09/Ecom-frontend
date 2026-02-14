export const API_BASE_URL = "http://localhost:5000";

export const STORAGE_KEYS = {
  token: "ecom_token",
  user: "ecom_user",
  cartId: "ecom_cart_id",
  cartItems: "ecom_cart_items",
};

export const endpoints = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
  },
  users: {
    me: "/api/users/me",
    address: "/api/users/address",
  },
  products: {
    list: "/api/products",
    detail: (id) => `/api/products/${id}`,
    create: "/api/products",
  },
  cart: {
    my: "/api/cart/my",
    addMy: "/api/cart/my/add",
    removeMy: (productId) => `/api/cart/my/remove/${productId}`,
    clearMy: "/api/cart/my/clear",
    mapAddItemPayload: ({ productId, qty }) => ({
      ProductId: productId,
      Quantity: qty,
    }),
    mapServerCartToItems: (serverCart) => {
      if (!serverCart) return [];
      const rawItems = serverCart.items || serverCart.cartItems || [];
      return rawItems.map((item) => ({
        productId: item.productId || item.ProductId || item.id || item.product_id,
        qty: item.qty || item.quantity || item.Quantity || 1,
        name: item.name || item.productName || item.ProductName,
        price: item.price ?? item.Price,
        imageUrl: item.imageUrl || item.image || item.image_url,
        stock: item.stock ?? item.Stock ?? item.productStock ?? null,
      }));
    },
  },
  orders: {
    create: "/api/orders/create",
    my: "/api/orders/myorders",
    detail: (id) => `/api/orders/${id}`,
    mapCreatePayload: (address) => ({
      UserId: address?.userId,
      Phone: address?.phone || "",
      Address1: address?.address1 || "",
      Address2: address?.address2 || "",
      City: address?.city || "",
      Country: address?.country || "",
      PostalCode: address?.postalCode || "",
    }),
  },
  payments: {
    process: "/api/payments/process",
    mapProcessPayload: ({ amount, currency, paymentMethodId, idempotencyKey, orderId }) => ({
      Amount: Number(amount),
      Currency: currency,
      PaymentMethodId: paymentMethodId,
      IdempotencyKey: idempotencyKey,
      OrderId: Number(orderId),
    }),
  },
};
