import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../api/orderService.js";
import { addAddress, getAddresses } from "../api/userService.js";
import { useCart } from "../cart/CartContext.js";
import { useAuth } from "../auth/AuthContext.js";
import Loader from "../components/Loader.jsx";

const EMPTY_ADDRESS_FORM = {
  phone: "",
  address1: "",
  address2: "",
  city: "",
  postalCode: "",
  country: "",
};

const Checkout = ({ onToast }) => {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [addressMode, setAddressMode] = useState("saved");
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [form, setForm] = useState(EMPTY_ADDRESS_FORM);
  const [saveAddress, setSaveAddress] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoadingAddresses(true);
    getAddresses()
      .then((data) => {
        if (!isMounted) return;
        const list = Array.isArray(data)
          ? data
          : data?.items || data?.addresses || [];
        setAddresses(list);
        if (!Array.isArray(list) || list.length === 0) {
          setAddressMode("new");
        }
      })
      .catch((error) => {
        console.error("Failed to load addresses", error);
        if (isMounted) {
          setAddressMode("new");
          onToast?.("Unable to load saved addresses.", "error");
        }
      })
      .finally(() => {
        if (isMounted) setLoadingAddresses(false);
      });
    return () => {
      isMounted = false;
    };
  }, [onToast]);

  const selectedAddress = useMemo(() => {
    if (addressMode !== "saved") return null;
    return addresses[selectedAddressIndex] || null;
  }, [addressMode, addresses, selectedAddressIndex]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);
  }, [items]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (addressMode === "saved") {
      if (!selectedAddress) nextErrors.address = "Please select an address";
    } else {
      ["phone", "address1", "city", "postalCode", "country"].forEach(
        (field) => {
          if (!form[field]) nextErrors[field] = "Required";
        }
      );
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const mapAddressToOrderPayload = (source) => ({
    userId: user?.id || source?.userId,
    phone: source?.phone || "",
    address1: source?.address1 || source?.addressLine1 || "",
    address2: source?.address2 || source?.addressLine2 || "",
    city: source?.city || "",
    postalCode: source?.postalCode || "",
    country: source?.country || "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const sourceAddress = addressMode === "saved" ? selectedAddress : form;

      if (addressMode === "new" && saveAddress) {
        await addAddress({
          phone: form.phone,
          addressLine1: form.address1,
          addressLine2: form.address2,
          city: form.city,
          country: form.country,
          postalCode: form.postalCode,
        });
      }

      const order = await createOrder(mapAddressToOrderPayload(sourceAddress));
      const nextOrderId =
        order?.id ||
        order?.orderId ||
        order?.data?.id ||
        order?.data?.orderId;

      if (!nextOrderId) {
        await clearCart();
        onToast?.("Order placed, but payment was not started.", "info");
        navigate("/orders");
        return;
      }

      const clearResult = await clearCart();
      if (!clearResult?.ok) {
        onToast?.("Order placed, but cart clear failed on server.", "info");
      }

      onToast?.("Order placed. Continue with payment.", "success");
      navigate(`/payments/${nextOrderId}`, {
        state: {
          order: order?.data || order,
          amount: subtotal,
          currency: "usd",
        },
      });
    } catch (error) {
      console.error("Failed to place order", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to place order";
      onToast?.(message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <section className="checkout">
        <h1>Checkout</h1>
        <p className="muted">Your cart is empty.</p>
      </section>
    );
  }

  return (
    <section className="checkout">
      <div className="checkout__header">
        <h1>Checkout</h1>
        <p className="muted">Confirm your shipping details.</p>
      </div>
      <form className="form form--grid" onSubmit={handleSubmit}>
        <div className="form__actions">
          <button
            type="button"
            className={addressMode === "saved" ? "button" : "button button--ghost"}
            onClick={() => setAddressMode("saved")}
            disabled={addresses.length === 0}
          >
            Use saved address
          </button>
          <button
            type="button"
            className={addressMode === "new" ? "button" : "button button--ghost"}
            onClick={() => setAddressMode("new")}
          >
            Add new address
          </button>
        </div>

        {loadingAddresses ? (
          <Loader label="Loading addresses" />
        ) : addressMode === "saved" ? (
          <>
            <label>
              Saved address
              <select
                value={selectedAddressIndex}
                onChange={(event) => setSelectedAddressIndex(Number(event.target.value))}
                disabled={addresses.length === 0}
              >
                {addresses.map((address, index) => (
                  <option key={`${address?.userId || "u"}-${index}`} value={index}>
                    {address?.addressLine1}, {address?.city}
                  </option>
                ))}
              </select>
              {errors.address && <span className="error">{errors.address}</span>}
            </label>
            {selectedAddress && (
              <p className="muted">
                {selectedAddress.addressLine1}
                {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ""}
                , {selectedAddress.city}, {selectedAddress.country} {selectedAddress.postalCode}
              </p>
            )}
          </>
        ) : (
          <>
            <label>
              Phone
              <input name="phone" value={form.phone} onChange={handleChange} />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </label>
            <label>
              Address line 1
              <input
                name="address1"
                value={form.address1}
                onChange={handleChange}
              />
              {errors.address1 && <span className="error">{errors.address1}</span>}
            </label>
            <label>
              Address line 2
              <input
                name="address2"
                value={form.address2}
                onChange={handleChange}
                placeholder="Optional"
              />
            </label>
            <label>
              City
              <input name="city" value={form.city} onChange={handleChange} />
              {errors.city && <span className="error">{errors.city}</span>}
            </label>
            <label>
              Postal code
              <input
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
              />
              {errors.postalCode && (
                <span className="error">{errors.postalCode}</span>
              )}
            </label>
            <label>
              Country
              <input name="country" value={form.country} onChange={handleChange} />
              {errors.country && <span className="error">{errors.country}</span>}
            </label>
            <label className="muted">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(event) => setSaveAddress(event.target.checked)}
              />{" "}
              Save this address to my account
            </label>
          </>
        )}
        <div className="form__actions">
          <button type="submit" className="button" disabled={loading}>
            {loading ? "Placing order..." : "Place order"}
          </button>
        </div>
      </form>
      {loading && <Loader label="Placing order" />}
    </section>
  );
};

export default Checkout;
