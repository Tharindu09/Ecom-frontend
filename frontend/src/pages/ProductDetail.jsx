import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProduct } from "../api/productService.js";
import Loader from "../components/Loader.jsx";
import QuantityPicker from "../components/QuantityPicker.jsx";
import { useCart } from "../cart/CartContext.js";

const ProductDetail = ({ onToast }) => {
  const { id } = useParams();
  const { addItem } = useCart();
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

  if (loading) return <Loader label="Loading product" />;

  if (error) return <p className="error">{error}</p>;

  if (!product) return <p className="muted">Product not found.</p>;

  const handleAdd = () => {
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
          <QuantityPicker value={qty} onChange={setQty} min={1} max={99} />
          <button type="button" className="button" onClick={handleAdd}>
            Add to cart
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductDetail;
