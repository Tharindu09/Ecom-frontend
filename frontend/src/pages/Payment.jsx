import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { getOrder } from "../api/orderService.js";
import { processPayment } from "../api/paymentService.js";
import Loader from "../components/Loader.jsx";

const STRIPE_JS_SRC = "https://js.stripe.com/v3/";

let stripeLoaderPromise;

const loadStripe = () => {
  if (window.Stripe) return Promise.resolve(window.Stripe);

  if (!stripeLoaderPromise) {
    stripeLoaderPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = STRIPE_JS_SRC;
      script.async = true;
      script.onload = () => {
        if (window.Stripe) {
          resolve(window.Stripe);
          return;
        }
        reject(new Error("Stripe.js loaded but Stripe() is unavailable."));
      };
      script.onerror = () => reject(new Error("Failed to load Stripe.js"));
      document.body.appendChild(script);
    });
  }

  return stripeLoaderPromise;
};

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getOrderAmount = (order) => {
  const fromTotals =
    asNumber(order?.totalAmount) ??
    asNumber(order?.total) ??
    asNumber(order?.amount) ??
    asNumber(order?.grandTotal);
  if (fromTotals != null) return fromTotals;

  const items = order?.items || order?.orderItems || [];
  return items.reduce((sum, item) => {
    const price = asNumber(item?.priceAtPurchase) ?? asNumber(item?.price) ?? 0;
    const qty = asNumber(item?.quantity) ?? asNumber(item?.qty) ?? 1;
    return sum + price * qty;
  }, 0);
};

const Payment = ({ onToast }) => {
  const { orderId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const cardNumberElementRef = useRef(null);
  const cardExpiryElementRef = useRef(null);
  const cardCvcElementRef = useRef(null);
  const stripeRef = useRef(null);
  const mountedCardNumberRef = useRef(null);
  const mountedCardExpiryRef = useRef(null);
  const mountedCardCvcRef = useRef(null);

  const [order, setOrder] = useState(location.state?.order || null);
  const [loadingOrder, setLoadingOrder] = useState(!location.state?.order);
  const [initializingStripe, setInitializingStripe] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const amount = useMemo(() => {
    const stateAmount = asNumber(location.state?.amount);
    if (stateAmount != null && stateAmount > 0) return stateAmount;
    return getOrderAmount(order);
  }, [location.state?.amount, order]);

  const currency = useMemo(() => {
    return String(
      location.state?.currency ||
      order?.currency ||
      order?.paymentCurrency ||
      "usd"
    ).toLowerCase();
  }, [location.state?.currency, order]);

  useEffect(() => {
    let isMounted = true;
    if (order) return () => { isMounted = false; };

    getOrder(orderId)
      .then((data) => {
        if (!isMounted) return;
        setOrder(data);
      })
      .catch((err) => {
        console.error("Failed to load order for payment", err);
        if (isMounted) {
          const message = "Unable to load order for payment.";
          setError(message);
          onToast?.(message, "error");
        }
      })
      .finally(() => {
        if (isMounted) setLoadingOrder(false);
      });

    return () => {
      isMounted = false;
    };
  }, [order, orderId, onToast]);

  useEffect(() => {
    if (loadingOrder) return undefined;

    let isMounted = true;
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

    if (!stripeKey) {
      setError("Missing Stripe key. Set VITE_STRIPE_PUBLISHABLE_KEY.");
      setInitializingStripe(false);
      return undefined;
    }

    if (!/^pk_(test|live)_/.test(stripeKey)) {
      setError("Invalid Stripe publishable key. Use a key starting with pk_test_ or pk_live_.");
      setInitializingStripe(false);
      return undefined;
    }

    loadStripe()
      .then((Stripe) => {
        if (
          !isMounted ||
          !cardNumberElementRef.current ||
          !cardExpiryElementRef.current ||
          !cardCvcElementRef.current
        ) {
          return;
        }
        if (!Stripe) {
          throw new Error("Stripe.js is unavailable in this browser context.");
        }

        const stripe = Stripe(stripeKey);
        const elements = stripe.elements();
        const elementStyle = {
          base: {
            color: "#1b1b1f",
            fontFamily: "Poppins, Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "15px",
            "::placeholder": {
              color: "#9a9a9a",
            },
          },
          invalid: {
            color: "#d84343",
          },
        };

        const cardNumber = elements.create("cardNumber", { style: elementStyle });
        const cardExpiry = elements.create("cardExpiry", { style: elementStyle });
        const cardCvc = elements.create("cardCvc", { style: elementStyle });

        cardNumber.mount(cardNumberElementRef.current);
        cardExpiry.mount(cardExpiryElementRef.current);
        cardCvc.mount(cardCvcElementRef.current);

        stripeRef.current = stripe;
        mountedCardNumberRef.current = cardNumber;
        mountedCardExpiryRef.current = cardExpiry;
        mountedCardCvcRef.current = cardCvc;
      })
      .catch((loadError) => {
        console.error("Failed to initialize Stripe", loadError);
        if (isMounted) {
          const message = loadError?.message || "Unable to initialize Stripe payment form.";
          setError(message);
          onToast?.(message, "error");
        }
      })
      .finally(() => {
        if (isMounted) setInitializingStripe(false);
      });

    return () => {
      isMounted = false;
      [mountedCardNumberRef, mountedCardExpiryRef, mountedCardCvcRef].forEach((ref) => {
        if (!ref.current) return;
        ref.current.unmount();
        ref.current.destroy();
        ref.current = null;
      });
    };
  }, [loadingOrder, onToast]);

  const handlePay = async (event) => {
    event.preventDefault();
    setError("");

    if (!stripeRef.current || !mountedCardNumberRef.current) {
      setError("Payment form is not ready yet.");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Invalid order amount.");
      return;
    }

    setProcessing(true);
    try {
      const { error: paymentMethodError, paymentMethod } =
        await stripeRef.current.createPaymentMethod({
          type: "card",
          card: mountedCardNumberRef.current,
        });

      if (paymentMethodError) {
        setError(paymentMethodError.message || "Unable to read card details.");
        return;
      }

      const response = await processPayment({
        amount,
        currency,
        paymentMethodId: paymentMethod.id,
        idempotencyKey: globalThis.crypto?.randomUUID?.() || uuidv4(),
        orderId: Number(order?.id || order?.orderId || orderId),
      });

      const normalizedStatus = String(response.paymentStatus || "").toLowerCase();
      const isProcessing = normalizedStatus === "processing";
      if (!response.created && !isProcessing) {
        setError(response.errorMessage || "Payment could not be created.");
        return;
      }

      if (response.requiresAction) {
        if (!response.clientSecret) {
          setError("Additional authentication is required, but no client secret was returned.");
          return;
        }

        const { error: actionError, paymentIntent } =
          await stripeRef.current.confirmCardPayment(response.clientSecret);

        if (actionError) {
          setError(actionError.message || "Payment authentication failed.");
          return;
        }

        if (!paymentIntent || !["succeeded", "processing"].includes(paymentIntent.status)) {
          setError("Payment was not completed. Please try again.");
          return;
        }
      }

      const nextOrderId = order?.id || order?.orderId || orderId;
      const paymentId = response.paymentId;
      if (!paymentId) {
        setError("Payment created but no payment reference was returned.");
        return;
      }

      onToast?.("Payment processing. Please wait...", "info");
      navigate(`/payments/processing/${nextOrderId}/${paymentId}`, {
        replace: true,
        state: { orderId: nextOrderId, paymentId },
      });
    } catch (err) {
      console.error("Payment failed", err);
      const message =
        err?.response?.data?.message || err?.message || "Unable to process payment.";
      setError(message);
      onToast?.(message, "error");
    } finally {
      setProcessing(false);
    }
  };

  if (loadingOrder) {
    return <Loader label="Preparing secure payment" />;
  }

  const visibleAmount = amount && amount > 0 ? amount : 0;

  return (
    <section className="payment">
      <h1>Stripe payment</h1>
      <p className="muted">
        Order #{order?.id || order?.orderId || orderId} - {currency.toUpperCase()} {visibleAmount.toFixed(2)}
      </p>

      <form className="payment__form" onSubmit={handlePay}>
        <div className="payment__fields">
          <label className="payment__field payment__field--full">
            Card number
            <div ref={cardNumberElementRef} className="payment__element" />
          </label>
          <label className="payment__field">
            Expiry date
            <div ref={cardExpiryElementRef} className="payment__element" />
          </label>
          <label className="payment__field">
            CVC
            <div ref={cardCvcElementRef} className="payment__element" />
          </label>
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="button" disabled={processing || initializingStripe}>
          {processing ? "Processing payment..." : "Pay now"}
        </button>
      </form>
    </section>
  );
};

export default Payment;
