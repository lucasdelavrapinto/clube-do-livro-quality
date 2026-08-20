import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Acesso ao dev server a partir de outros aparelhos da rede local (celular, tablet).
  // Wildcard porque o IP da máquina muda de subrede conforme a rede — fixar um só
  // quebra o HMR toda vez que isso acontece. Vale apenas em desenvolvimento.
  allowedDevOrigins: ['192.168.*.*'],
};

export default nextConfig;
