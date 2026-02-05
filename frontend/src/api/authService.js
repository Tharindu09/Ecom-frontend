import axiosClient from "./axiosClient.js";
import { endpoints } from "./endpoints.js";

export const login = async (payload) => {
  const { data } = await axiosClient.post(endpoints.auth.login, payload);
  return data;
};

export const register = async (payload) => {
  const { data } = await axiosClient.post(endpoints.auth.register, payload);
  return data;
};
