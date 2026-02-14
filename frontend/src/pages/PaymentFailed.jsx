import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const orderId = searchParams.get("orderId") || location.state?.payment?.orderId;
  const message = location.state?.message || "Payment failed. Please try again.";

  return (
    <section className="payment-result payment-result--failed">
      <div className="payment-result__header">
        <h1>Payment failed</h1>
        <p className="muted">{message}</p>
      </div>
      <div className="payment-result__card">
        <p className="muted">Order ID</p>
        <p className="payment-result__value">#{orderId || "--"}</p>
      </div>
      <div className="payment-result__actions">
        <Link className="button" to={`/payments/${orderId || ""}`}>
          Try again
        </Link>
        <Link className="button button--ghost" to="/orders">
          View orders
        </Link>
      </div>
    </section>
  );
};

export default PaymentFailed;
