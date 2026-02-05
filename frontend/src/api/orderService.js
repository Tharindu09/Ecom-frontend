import axiosClient from "./axiosClient.js";
import { endpoints } from "./endpoints.js";

export const createOrder = async (address) => {
  const payload = endpoints.orders.mapCreatePayload(address);
  const { data } = await axiosClient.post(endpoints.orders.create, payload);
  return data;
};

export const listMyOrders = async () => {
  const { data } = await axiosClient.get(endpoints.orders.my);
  return data;
};

export const getOrder = async (id) => {
  const { data } = await axiosClient.get(endpoints.orders.detail(id));
  return data;
};
