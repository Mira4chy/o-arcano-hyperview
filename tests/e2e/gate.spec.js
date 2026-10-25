// @ts-check
const { test, expect } = require('@playwright/test');

/* Ignora ruído externo (fontes, CDN, Supabase) que não depende do nosso código. */
const isOwnError = (text) => !/fonts\.(googleapis|gstatic)|supabase|jsdelivr|Failed to load resource|net::ERR/i.test(text);

test.describe('Portão de acesso (sem login)', () => {
  test('carrega sem erros de JavaScript e mostra o login', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (msg) => { if (msg.type() === 'error' && isOwnError(msg.text())) errors.push(msg.text()); });

    await page.goto('/index.html?skipIntro');
    await expect(page).toHaveTitle(/O Arcano/);
    await expect(page.locator('#authGate')).toBeVisible();
    await expect(page.locator('#authEmail')).toBeVisible();
    await expect(page.locator('#authPassword')).toBeVisible();
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('alterna entre entrar e solicitar acesso', async ({ page }) => {
    await page.goto('/index.html?skipIntro');
    const gate = page.locator('#authGate');
    await expect(gate).toHaveAttribute('data-mode', 'login');
    await gate.locator('[data-auth-switch="request"]').click();
    await expect(gate).toHaveAttribute('data-mode', 'request');
    await expect(page.locator('#requestName')).toBeVisible();
    await gate.locator('[data-auth-switch="login"]').click();
    await expect(gate).toHaveAttribute('data-mode', 'login');
  });

  test('conteúdo protegido não aparece antes do login', async ({ page }) => {
    await page.goto('/index.html?skipIntro#/Bestiario');
    await expect(page.locator('#authGate')).toBeVisible();
    await expect(page.locator('.entry-card')).toHaveCount(0);
  });

  for (const [name, width, height] of [['celular', 375, 812], ['tablet', 768, 1024], ['desktop', 1440, 900]]) {
    test(`sem rolagem horizontal no ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/index.html?skipIntro');
      await expect(page.locator('#authGate')).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test('login com campos vazios não entra', async ({ page }) => {
    await page.goto('/index.html?skipIntro');
    await page.locator('#authSubmit').click();
    await expect(page.locator('#authGate')).toBeVisible();
  });

  test('a abertura animada só aparece na primeira visita da sessão', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#intro')).toBeAttached();
    await page.waitForFunction(() => sessionStorage.getItem('arcano-intro-seen') === '1');
    await page.reload();
    await expect(page.locator('html.skip-intro')).toHaveCount(1);
  });
});
