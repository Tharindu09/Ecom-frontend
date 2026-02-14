import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { getOrder } from "../api/orderService.js";
import Loader from "../components/Loader.jsx";

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getOrderTotal = (order) => {
  const direct =
    asNumber(order?.totalAmount) ??
    asNumber(order?.total) ??
    asNumber(order?.amount) ??
    asNumber(order?.grandTotal);
  if (direct != null) return direct;

  const items = order?.items || order?.orderItems || [];
  return items.reduce((sum, item) => {
    const price = asNumber(item?.priceAtPurchase) ?? asNumber(item?.price) ?? 0;
    const qty = asNumber(item?.quantity) ?? asNumber(item?.qty) ?? 1;
    return sum + price * qty;
  }, 0);
};

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const orderId = searchParams.get("orderId") || location.state?.payment?.orderId;
  const payment = location.state?.payment || null;

  useEffect(() => {
    let isMounted = true;
    if (!orderId) {
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);
    getOrder(orderId)
      .then((data) => {
        if (isMounted) setOrder(data);
      })
      .catch((err) => {
        console.error("Failed to load order after payment", err);
        if (isMounted) setError("Unable to load order details.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const items = order?.items || order?.orderItems || [];
  const total = useMemo(() => getOrderTotal(order), [order]);

  return (
    <section className="payment-result">
      <div className="payment-result__header">
        <h1>Payment successful</h1>
        <p className="muted">Thanks! Your payment has been confirmed.</p>
      </div>
      <div className="payment-result__card">
        {loading ? (
          <Loader label="Loading receipt" />
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <>
            <div className="payment-result__meta">
              <div>
                <p className="muted">Order ID</p>
                <p className="payment-result__value">#{orderId || "--"}</p>
              </div>
              <div>
                <p className="muted">Payment ID</p>
                <p className="payment-result__value">
                  {payment?.paymentId ?? payment?.PaymentId ?? "--"}
                </p>
              </div>
              <div>
                <p className="muted">Date</p>
                <p className="payment-result__value">
                  {order?.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : payment?.createdAt
                    ? new Date(payment.createdAt).toLocaleString()
                    : "--"}
                </p>
              </div>
            </div>
            <div className="payment-result__items">
              <div className="table">
                <div className="table__row table__head">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Total</span>
                </div>
                {items.map((item, index) => (
                  <div key={`${item?.productId}-${index}`} className="table__row">
                    <span>{item?.productName || item?.name || item?.title || "Item"}</span>
                    <span>{item?.quantity || item?.qty || 1}</span>
                    <span>
                      {item?.priceAtPurchase != null
                        ? `$${(item.priceAtPurchase * (item?.quantity || item?.qty || 1)).toFixed(2)}`
                        : item?.price != null
                        ? `$${(item.price * (item?.quantity || item?.qty || 1)).toFixed(2)}`
                        : "--"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="payment-result__total">
              <p className="muted">Total paid</p>
              <p className="price">
                {total != null ? `$${total.toFixed(2)}` : payment?.amount ?? "--"}{" "}
                {payment?.currency ? payment.currency.toUpperCase() : ""}
              </p>
            </div>
          </>
        )}
      </div>
      <div className="payment-result__actions">
        <Link className="button" to={`/orders/${orderId || ""}`}>
          View order
        </Link>
        <Link className="button button--ghost" to="/products">
          Continue shopping
        </Link>
      </div>
    </section>
  );
};

export default PaymentSuccess;
