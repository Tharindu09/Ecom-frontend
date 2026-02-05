import axiosClient from "./axiosClient.js";
import { endpoints } from "./endpoints.js";

export const listProducts = async () => {
  const { data } = await axiosClient.get(endpoints.products.list);
  return data;
};

export const getProduct = async (id) => {
  const { data } = await axiosClient.get(endpoints.products.detail(id));
  return data;
};
