import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.js";
import { useCart } from "../cart/CartContext.js";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const count = items.reduce((sum, item) => sum + (item.qty || 0), 0);
  const handleLogout = () => {
    logout();
    navigate("/products");
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <Link to="/products">Ecom Gateway</Link>
      </div>
      <nav className="navbar__links">
        {isAuthenticated ? (
          <>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/cart" className="navbar__cart">
              Cart
              {count > 0 && <span className="badge">{count}</span>}
            </NavLink>
            <NavLink to="/orders">Orders</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
      {isAuthenticated && (
        <button type="button" className="link-button navbar__logout" onClick={handleLogout}>
          <span>Logout</span>
          <svg
            className="navbar__logout-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M15 5l6 7-6 7M21 12H9M9 5H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </header>
  );
};

export default Navbar;
