import axiosClient from "./axiosClient.js";
import { endpoints } from "./endpoints.js";

export const getMyCart = async () => {
  const { data } = await axiosClient.get(endpoints.cart.my);
  return data;
};

export const addMyCartItem = async ({ productId, qty }) => {
  const payload = endpoints.cart.mapAddItemPayload({ productId, qty });
  const { data } = await axiosClient.post(endpoints.cart.addMy, payload);
  return data;
};

export const removeMyCartItem = async (productId) => {
  const { data } = await axiosClient.delete(endpoints.cart.removeMy(productId));
  return data;
};

export const clearMyCart = async () => {
  const { data } = await axiosClient.delete(endpoints.cart.clearMy);
  return data;
};
