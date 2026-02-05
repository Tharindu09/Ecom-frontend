import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  const id = product?.id || product?.productId;
  const image =
    product?.imageUrl || product?.image || product?.images?.[0] || "";

  return (
    <div className="card">
      <Link to={`/products/${id}`} className="card__image">
        {image ? (
          <img src={image} alt={product?.name || product?.title || "Product"} />
        ) : (
          <div className="card__image--placeholder">No image</div>
        )}
      </Link>
      <div className="card__body">
        <h3>{product?.name || product?.title || "Untitled"}</h3>
        <p className="muted">{product?.category || ""}</p>
        <div className="card__footer">
          <span className="price">
            {product?.price != null ? `$${product.price}` : "Price N/A"}
          </span>
          <Link to={`/products/${id}`} className="button button--ghost">
            View
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
