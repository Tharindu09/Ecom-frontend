import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../cart/CartContext.js";
import QuantityPicker from "../components/QuantityPicker.jsx";

const Cart = ({ onToast }) => {
  const { items, updateItemQty, removeCartItem, persistMyCart, syncing } = useCart();
  const navigate = useNavigate();

  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 0),
      0
    );
  }, [items]);

  const handleRemove = async (productId) => {
    const result = await removeCartItem(productId);
    if (!result?.ok) {
      onToast?.("Unable to remove item from cart.", "error");
      return;
    }
    onToast?.("Item removed", "info");
  };

  const handleProceed = async () => {
    const result = await persistMyCart();
    if (!result.ok) {
      onToast?.("Unable to save cart before checkout.", "error");
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <section className="cart">
        <h1>Your cart is empty</h1>
        <p className="muted">Add products to start your order.</p>
        <Link className="button" to="/products">
          Browse products
        </Link>
      </section>
    );
  }

  return (
    <section className="cart">
      <div className="cart__header">
        <h1>Your cart</h1>
        {syncing && <span className="muted">Syncing...</span>}
      </div>
      <div className="cart__list">
        {items.map((item) => {
          const parsedStock = Number(item?.stock);
          const maxQty =
            Number.isFinite(parsedStock) && parsedStock > 0 ? parsedStock : 99;
          return (
            <div key={item.productId} className="cart__item">
              <div className="cart__item-info">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <div className="image-placeholder">No image</div>
                )}
                <div>
                  <h3>{item.name || "Untitled"}</h3>
                  <p className="muted">
                    {item.price != null ? `$${item.price}` : "Price N/A"}
                  </p>
                </div>
              </div>
              <div className="cart__item-actions">
                <QuantityPicker
                  value={item.qty}
                  onChange={(value) => updateItemQty(item.productId, value)}
                  max={maxQty}
                />
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => handleRemove(item.productId)}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="cart__summary">
        <div>
          <p className="muted">Subtotal</p>
          <p className="price">${subtotal.toFixed(2)}</p>
        </div>
        <button type="button" className="button" onClick={handleProceed} disabled={syncing}>
          Proceed to checkout
        </button>
      </div>
    </section>
  );
};

export default Cart;
