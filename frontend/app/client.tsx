"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

const client = new QueryClient();

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ChakraProvider value={defaultSystem}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </ChakraProvider>
  );
};
