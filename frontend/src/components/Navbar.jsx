import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.js";
import { useCart } from "../cart/CartContext.js";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const { items } = useCart();
  const count = items.reduce((sum, item) => sum + (item.qty || 0), 0);

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
            <button type="button" className="link-button" onClick={logout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
