import axiosClient from "./axiosClient.js";
import { endpoints } from "./endpoints.js";

export const getMe = async () => {
  const { data } = await axiosClient.get(endpoints.users.me);
  return data;
};

export const getAddresses = async () => {
  const { data } = await axiosClient.get(endpoints.users.address);
  return data;
};

export const addAddress = async (payload) => {
  const { data } = await axiosClient.post(endpoints.users.address, payload);
  return data;
};
