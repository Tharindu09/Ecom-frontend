import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getOrder } from "../api/orderService.js";
import Loader from "../components/Loader.jsx";

const OrderDetail = ({ onToast }) => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getOrder(id)
      .then((data) => {
        if (isMounted) setOrder(data);
      })
      .catch((err) => {
        console.error("Failed to load order", err);
        setError("Unable to load order details.");
        onToast?.("Unable to load order.", "error");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [id, onToast]);

  if (loading) return <Loader label="Loading order" />;

  if (error) return <p className="error">{error}</p>;

  if (!order) return <p className="muted">Order not found.</p>;

  const items = order?.items || order?.orderItems || [];
  const normalizedStatus = String(order?.orderStatus || order?.status || "").toLowerCase();
  const needsPayment = ["pendingpayment", "pending_payment"].includes(normalizedStatus);

  return (
    <section className="order-detail">
      <h1>Order #{order?.id || order?.orderId}</h1>
      <div className="order-detail__meta">
        <p className="muted">
          Status: {order?.orderStatus || order?.status || "Processing"}
        </p>
        <p className="muted">
          Date:{" "}
          {order?.date || order?.createdAt
            ? new Date(order?.date || order?.createdAt).toLocaleString()
            : "--"}
        </p>
        {needsPayment && (
          <Link
            to={`/payments/${order?.id || order?.orderId || id}`}
            className="button"
          >
            Pay now
          </Link>
        )}
      </div>
      <div className="order-detail__section">
        <h2>Shipping</h2>
        <p>{order?.userName || order?.shippingAddress?.fullName}</p>
        <p>{order?.userPhone || order?.shippingAddress?.phone}</p>
        <p>{order?.shipLine1 || order?.shippingAddress?.address1}</p>
        {(order?.shipLine2 || order?.shippingAddress?.address2) && (
          <p>{order?.shipLine2 || order?.shippingAddress?.address2}</p>
        )}
        <p>
          {order?.shipCity || order?.shippingAddress?.city}{" "}
          {order?.shipPostalCode || order?.shippingAddress?.postalCode}
        </p>
        <p>{order?.shipCountry || order?.shippingAddress?.country}</p>
      </div>
      <div className="order-detail__section">
        <h2>Items</h2>
        <div className="table">
          <div className="table__row table__head">
            <span>Product</span>
            <span>Qty</span>
            <span>Price</span>
          </div>
          {items.map((item, index) => (
            <div key={`${item?.productId}-${index}`} className="table__row">
              <span>
                {item?.productName || item?.name || item?.title || item?.productId}
              </span>
              <span>{item?.quantity || item?.qty || 1}</span>
              <span>
                {item?.priceAtPurchase != null
                  ? `$${item.priceAtPurchase}`
                  : item?.price != null
                  ? `$${item.price}`
                  : "--"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OrderDetail;
