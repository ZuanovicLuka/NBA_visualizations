export const apiCall = (url: string, options: RequestInit = {}) => {
  const baseUrl = "http://localhost:8000";

  return fetch(`${baseUrl}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      ...(localStorage.getItem("token")
        ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
        : {}),
    },
  }).then(async (res) => {
    let data = null;
    if (res.status !== 204) {
      try {
        data = await res.json();
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    }
    return [data, res.status] as const;
  });
};
