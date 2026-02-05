import React, { useCallback, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Products from "./pages/Products.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import OrderDetail from "./pages/OrderDetail.jsx";
import Toast from "./components/Toast.jsx";

const App = () => {
  const [toast, setToast] = useState({ message: "", type: "info" });

  const showToast = useCallback((message, type = "info") => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast({ message: "", type: "info" });
  }, []);

  return (
    <div className="app">
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/login" element={<Login onToast={showToast} />} />
          <Route path="/register" element={<Register onToast={showToast} />} />
          <Route path="/products" element={<Products onToast={showToast} />} />
          <Route path="/products/:id" element={<ProductDetail onToast={showToast} />} />
          <Route path="/cart" element={<Cart onToast={showToast} />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout onToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders onToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail onToast={showToast} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/products" replace />} />
        </Routes>
      </main>
      <Toast message={toast.message} type={toast.type} onClose={clearToast} />
    </div>
  );
};

export default App;
