export const apiCall = async (url: string, options: RequestInit = {}) => {
  const baseUrl = "http://localhost:8000";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  let data = null;
  if (res.status !== 204) {
    try {
      data = await res.json();
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }

  return [data, res.status] as const;
};
