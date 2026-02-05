import React, { useEffect, useMemo, useState } from "react";
import { listProducts } from "../api/productService.js";
import ProductCard from "../components/ProductCard.jsx";
import Loader from "../components/Loader.jsx";

const Products = ({ onToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    listProducts()
      .then((data) => {
        const list = data?.items || data?.products || data || [];
        if (isMounted) setProducts(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
        setError("Unable to load products right now.");
        onToast?.("Unable to load products.", "error");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [onToast]);

  const categories = useMemo(() => {
    const list = products
      .map((product) => product?.category)
      .filter((value) => value);
    return Array.from(new Set(list));
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const name = product?.name || product?.title || "";
      const matchesSearch = name
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesCategory = category
        ? product?.category === category
        : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  if (loading) {
    return <Loader label="Loading products" />;
  }

  return (
    <section className="products">
      <div className="products__header">
        <div>
          <h1>Products</h1>
          <p className="muted">Browse the latest inventory.</p>
        </div>
        <div className="products__filters">
          <input
            type="search"
            placeholder="Search products"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {categories.length > 0 && (
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {filtered.length === 0 ? (
          <p className="muted">No products found.</p>
        ) : (
          filtered.map((product) => (
            <ProductCard
              key={product?.id || product?.productId}
              product={product}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default Products;
