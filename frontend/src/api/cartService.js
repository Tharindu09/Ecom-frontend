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
