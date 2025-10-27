import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiCall } from "@/api";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp?: number;
  [key: string]: any;
}

export const useGetUser = () => {
  const router = useRouter();

  return useQuery({
    queryKey: ["user"],
    retry: false,
    queryFn: async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/");
        throw new Error("No token");
      }

      try {
        const decoded: JwtPayload = jwtDecode(token);
        const now = Date.now() / 1000;
        if (decoded.exp && decoded.exp < now) {
          console.warn("Token expired");
          localStorage.removeItem("token");
          router.replace("/");
          throw new Error("Token expired");
        }
      } catch {
        console.error("Invalid token");
        localStorage.removeItem("token");
        router.replace("/");
        throw new Error("Invalid token");
      }

      const [data, status] = await apiCall("/users/info", { method: "GET" });

      if (status !== 200) {
        localStorage.removeItem("token");
        router.replace("/");
        throw new Error("Failed to fetch user info");
      }

      return data;
    },
  });
};
