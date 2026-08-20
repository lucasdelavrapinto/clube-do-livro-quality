import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Necessário para o deploy em produção: gera .next/standalone/server.js,
  // que é o que o serviço systemd (clube-do-livro.service) executa.
  output: "standalone",
  // Acesso ao dev server a partir de outros aparelhos da rede local (celular, tablet).
  // Wildcard porque o IP da máquina muda de subrede conforme a rede — fixar um só
  // quebra o HMR toda vez que isso acontece. Vale apenas em desenvolvimento.
  allowedDevOrigins: ['192.168.*.*'],
};

export default nextConfig;
