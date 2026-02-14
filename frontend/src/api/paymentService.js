import axiosClient from "./axiosClient.js";
import { endpoints } from "./endpoints.js";

export const processPayment = async (request) => {
  const payload = endpoints.payments.mapProcessPayload(request);
  const { data } = await axiosClient.post(endpoints.payments.process, payload);

  return {
    created: data?.created ?? data?.Created ?? false,
    requiresAction: data?.requiresAction ?? data?.RequiresAction ?? false,
    clientSecret: data?.clientSecret ?? data?.ClientSecret ?? "",
    paymentIntentId: data?.paymentIntentId ?? data?.PaymentIntentId ?? "",
    paymentId: data?.paymentId ?? data?.PaymentId ?? "",
    orderId: data?.orderId ?? data?.OrderId ?? "",
    paymentStatus: data?.paymentStatus ?? data?.PaymentStatus ?? "",
    errorMessage: data?.errorMessage ?? data?.ErrorMessage ?? "",
  };
};
