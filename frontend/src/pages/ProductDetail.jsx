import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getProduct } from "../api/productService.js";
import Loader from "../components/Loader.jsx";
import QuantityPicker from "../components/QuantityPicker.jsx";
import { useCart } from "../cart/CartContext.js";

const ProductDetail = ({ onToast }) => {
  const { id } = useParams();
  const { addItem, items } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getProduct(id)
      .then((data) => {
        if (isMounted) setProduct(data);
      })
      .catch((err) => {
        console.error("Failed to load product", err);
        setError("Unable to load product details.");
        onToast?.("Unable to load product.", "error");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id, onToast]);

  const images =
    product?.images?.length > 0
      ? product.images
      : product?.imageUrl
      ? [product.imageUrl]
      : product?.image
      ? [product.image]
      : [];

  const productId = product?.id || product?.productId;
  const stockValue = useMemo(() => {
    const parsed = Number(product?.stock ?? product?.Stock ?? product?.productStock);
    return Number.isFinite(parsed) ? parsed : null;
  }, [product]);
  const inCartQty =
    items.find((item) => item.productId === productId)?.qty || 0;
  const availableStock = stockValue != null ? stockValue - inCartQty : null;
  const maxQty = availableStock != null ? Math.max(availableStock, 1) : 99;
  const isOutOfStock = availableStock != null && availableStock <= 0;

  useEffect(() => {
    if (qty > maxQty) {
      setQty(maxQty);
    }
  }, [qty, maxQty]);

  if (loading) return <Loader label="Loading product" />;

  if (error) return <p className="error">{error}</p>;

  if (!product) return <p className="muted">Product not found.</p>;

  const handleAdd = () => {
    if (isOutOfStock || (availableStock != null && qty > availableStock)) {
      onToast?.("Only available stock can be added.", "error");
      return;
    }
    addItem(product, qty);
    onToast?.("Added to cart", "success");
  };

  return (
    <section className="product-detail">
      <div className="product-detail__media">
        {images.length > 0 ? (
          <div className="media-grid">
            {images.map((src, index) => (
              <img key={`${src}-${index}`} src={src} alt={product?.name} />
            ))}
          </div>
        ) : (
          <div className="card__image--placeholder">No image</div>
        )}
      </div>
      <div className="product-detail__info">
        <p className="muted">{product?.category}</p>
        <h1>{product?.name || product?.title}</h1>
        <p className="price">
          {product?.price != null ? `$${product.price}` : "Price N/A"}
        </p>
        {product?.stock != null && (
          <p className="muted">Stock: {product.stock}</p>
        )}
        <p>{product?.description || "No description available."}</p>
        <div className="product-detail__actions">
          <QuantityPicker value={qty} onChange={setQty} min={1} max={maxQty} />
          <button
            type="button"
            className="button"
            onClick={handleAdd}
            disabled={isOutOfStock}
          >
            Add to cart
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductDetail;
