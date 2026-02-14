import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../api/endpoints.js";
import { useCart } from "../cart/CartContext.js";

const POLL_INTERVAL_MS = 2000;
const MAX_BACKOFF_MS = 10000;
const TIMEOUT_MS = 90000;

const normalizeStatus = (value) => {
  if (!value) return "PROCESSING";
  return String(value).trim().toUpperCase();
};

const PaymentProcessing = ({ orderId: orderIdProp, paymentId: paymentIdProp }) => {
  const { orderId: orderIdParam, paymentId: paymentIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState("PROCESSING");
  const [warning, setWarning] = useState("");
  const [timedOut, setTimedOut] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const startTimeRef = useRef(0);
  const backoffRef = useRef(POLL_INTERVAL_MS);
  const stoppedRef = useRef(false);
  const lastPaymentRef = useRef(null);

  const orderId = orderIdProp ?? orderIdParam ?? location.state?.orderId ?? "";
  const paymentId = paymentIdProp ?? paymentIdParam ?? location.state?.paymentId ?? "";
  const encodedOrderId = useMemo(() => encodeURIComponent(String(orderId)), [orderId]);

  const stopPolling = () => {
    stoppedRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const scheduleNext = (delay) => {
    if (stoppedRef.current) return;
    timerRef.current = setTimeout(() => {
      pollOnce();
    }, delay);
  };

  const handleSuccess = (paymentData) => {
    const resolvedOrderId = paymentData?.orderId ?? orderId;
    const encodedId = encodeURIComponent(String(resolvedOrderId));
    // Only clear the cart after the backend confirms the final status.
    clearCart();
    navigate(`/checkout/success?orderId=${encodedId}`, {
      replace: true,
      state: { payment: paymentData },
    });
  };

  const handleFailure = (paymentData) => {
    const resolvedOrderId = paymentData?.orderId ?? orderId;
    const encodedId = encodeURIComponent(String(resolvedOrderId));
    navigate(`/checkout/failed?orderId=${encodedId}`, {
      replace: true,
      state: {
        message: "Payment failed. Please try again.",
        payment: paymentData,
      },
    });
  };

  const pollOnce = async () => {
    if (!paymentId) {
      setWarning("Missing payment reference.");
      stopPolling();
      return;
    }

    // Hard timeout to avoid infinite polling.
    if (Date.now() - startTimeRef.current > TIMEOUT_MS) {
      setTimedOut(true);
      stopPolling();
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = localStorage.getItem("ecom_token");
      // Use a single in-flight request and schedule the next poll after it completes.
      const response = await fetch(
        `${API_BASE_URL}/api/payments/${encodeURIComponent(String(paymentId))}`,
        {
          signal: controller.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }

      const data = await response.json();
      lastPaymentRef.current = data;
      const nextStatus = normalizeStatus(data?.paymentStatus ?? data?.PaymentStatus);
      setStatus(nextStatus);
      setWarning("");
      backoffRef.current = POLL_INTERVAL_MS;

      if (nextStatus === "SUCCEEDED" || nextStatus === "PAID") {
        stopPolling();
        handleSuccess(data);
        return;
      }

      if (nextStatus === "FAILED") {
        stopPolling();
        handleFailure(data);
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      setWarning("Network issue while checking payment status. Retrying...");
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
    }

    scheduleNext(backoffRef.current);
  };

  useEffect(() => {
    // Reset polling state on mount and when retrying.
    stoppedRef.current = false;
    setTimedOut(false);
    setWarning("");
    setStatus("PROCESSING");
    backoffRef.current = POLL_INTERVAL_MS;
    startTimeRef.current = Date.now();

    pollOnce();

    return () => {
      stopPolling();
    };
  }, [paymentId, retryToken]);

  const handleRetry = () => {
    stopPolling();
    setRetryToken((value) => value + 1);
  };

  const handleCancel = () => {
    stopPolling();
    navigate("/checkout");
  };

  if (!orderId && !paymentId) {
    return (
      <section className="payment-processing">
        <h1>Processing your payment</h1>
        <p className="error">Missing payment details.</p>
        <button type="button" className="button" onClick={() => navigate("/checkout")}>
          Back to checkout
        </button>
      </section>
    );
  }

  return (
    <section className="payment-processing">
      <h1>Processing your payment</h1>
      <p className="muted">Order ID: {orderId || "--"}</p>
      <div className="payment-processing__status">
        <span className="spinner" aria-hidden="true" />
        <p className="payment-processing__status-text">Status: {status}</p>
      </div>
      {warning && <p className="warning">{warning}</p>}
      {timedOut && (
        <div className="payment-processing__timeout">
          <p className="muted">
            Payment is still processing. You can retry or view your order.
          </p>
          <div className="payment-processing__actions">
            <button type="button" className="button" onClick={handleRetry}>
              Retry
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => navigate(`/orders/${encodedOrderId}`)}
            >
              View order
            </button>
          </div>
        </div>
      )}
      <button type="button" className="button button--ghost" onClick={handleCancel}>
        Cancel
      </button>
    </section>
  );
};

export default PaymentProcessing;
