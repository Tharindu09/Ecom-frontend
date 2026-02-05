import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyOrders } from "../api/orderService.js";
import Loader from "../components/Loader.jsx";

const Orders = ({ onToast }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    listMyOrders()
      .then((data) => {
        const list = data?.orders || data?.items || data || [];
        if (isMounted) setOrders(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error("Failed to load orders", err);
        setError("Unable to load orders.");
        onToast?.("Unable to load orders.", "error");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [onToast]);

  if (loading) return <Loader label="Loading orders" />;

  return (
    <section className="orders">
      <h1>Orders</h1>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 ? (
        <p className="muted">No orders yet.</p>
      ) : (
        <div className="table">
          <div className="table__row table__head">
            <span>Order</span>
            <span>Date</span>
            <span>Status</span>
            <span>Total</span>
          </div>
          {orders.map((order) => (
            <Link
              to={`/orders/${order?.id || order?.orderId}`}
              key={order?.id || order?.orderId}
              className="table__row"
            >
              <span>#{order?.id || order?.orderId}</span>
              <span>
                {order?.date || order?.createdAt
                  ? new Date(order?.date || order?.createdAt).toLocaleDateString()
                  : "--"}
              </span>
              <span>{order?.orderStatus || order?.status || "Processing"}</span>
              <span>
                {order?.totalAmount != null
                  ? `$${order.totalAmount}`
                  : order?.total != null
                  ? `$${order.total}`
                  : order?.amount != null
                  ? `$${order.amount}`
                  : "--"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default Orders;
