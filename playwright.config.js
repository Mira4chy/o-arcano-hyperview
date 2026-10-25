// @ts-check
const { defineConfig } = require('@playwright/test');

/* Testes de ponta a ponta do Codex.
   - Sem credenciais: roda só o que não exige login (portão de acesso, layout, erros de console).
   - Com E2E_EMAIL e E2E_PASSWORD (use uma conta de TESTE, nunca a do Mestre real): roda também
     a navegação autenticada em tests/e2e/codex.spec.js.
   Navegador: Edge/Chrome já instalado (E2E_CHANNEL=chrome para trocar), sem baixar nada. */
module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: process.env.E2E_CHANNEL || 'msedge',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'python -m http.server 4173 --bind 127.0.0.1',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: true,
    timeout: 20_000
  }
});
