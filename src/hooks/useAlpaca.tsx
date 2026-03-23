import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('quantivahq_access_token')}`,
});

const fetchAlpacaData = async (path: string) => {
  const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    headers: authHeaders(),
  });
  return res.data;
};

export const useAlpacaDashboard = () => {
  return useQuery({
    queryKey: ["alpacaDashboard"],
    queryFn: async () => fetchAlpacaData("/alpaca-trading/dashboard"),
  });
};

export const useAlpacaBalance = () => {
  return useQuery({
    queryKey: ["alpacaBalance"],
    queryFn: async () => fetchAlpacaData("/alpaca-trading/balance"),
  });
};

export const useAlpacaPosition = () => {
  return useQuery({
    queryKey: ["alpacaPosition"],
    queryFn: async () => fetchAlpacaData("/alpaca-trading/positions"),
  });
};

export const useAlpacaOrdersOpen = () => {
  return useQuery({
    queryKey: ["alpacaOrdersOpen"],
    queryFn: async () => fetchAlpacaData("/alpaca-trading/orders/open"),
  });
};

export const useAlpacaOrdersAll = () => {
  return useQuery({
    queryKey: ["alpacaOrdersAll"],
    queryFn: async () => fetchAlpacaData("/alpaca-trading/orders/all"),
  });
};

export const useAlpacaOrdersHistory = () => {
  return useQuery({
    queryKey: ["alpacaOrdersHistory"],
    queryFn: async () => fetchAlpacaData("/alpaca-trading/trade-history"),
  });
};
