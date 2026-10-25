// @ts-check
const { test, expect } = require('@playwright/test');

/* Fluxos autenticados. Só rodam com uma conta de TESTE aprovada:
     E2E_EMAIL=teste@exemplo.com E2E_PASSWORD=... npm test
   Nunca use a conta do Mestre real. Os testes só LEEM; nenhum cria, edita ou apaga dados. */
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;
test.skip(!email || !password, 'Defina E2E_EMAIL e E2E_PASSWORD (conta de teste) para rodar os fluxos autenticados.');

const isOwnError = (text) => !/fonts\.(googleapis|gstatic)|jsdelivr|Failed to load resource|net::ERR/i.test(text);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html?skipIntro');
  await page.locator('#authEmail').fill(email);
  await page.locator('#authPassword').fill(password);
  await page.locator('#authSubmit').click();
  await expect(page.locator('#authGate')).toHaveCount(0, { timeout: 20_000 });
});

test('a home mostra o índice e nenhum erro de JavaScript', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (msg) => { if (msg.type() === 'error' && isOwnError(msg.text())) errors.push(msg.text()); });
  await page.goto('/index.html?skipIntro#/');
  await expect(page.locator('.codex-home__group')).toHaveCount(4);
  expect(errors, errors.join('\n')).toEqual([]);
});

for (const tab of ['Bestiario', 'Magias', 'Itens', 'Racas', 'Sistemas', 'Persona', 'Eras']) {
  test(`#/${tab} abre sem quebrar`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/index.html?skipIntro#/${tab}`);
    await expect(page.locator('#view')).not.toBeEmpty();
    await expect(page.locator('body.is-routing')).toHaveCount(0, { timeout: 15_000 });
    expect(errors, errors.join('\n')).toEqual([]);
  });
}

test('linha do tempo: nenhum marco fica cortado pela borda do trilho', async ({ page }) => {
  await page.goto('/index.html?skipIntro#/Eras');
  const events = page.locator('.chrono-event');
  test.skip((await events.count()) === 0, 'Sem acontecimentos cadastrados.');
  const track = await page.locator('.chrono-track-scroll').boundingBox();
  for (const box of await events.evaluateAll((nodes) => nodes.map((n) => { const r = n.getBoundingClientRect(); return { x: r.x, right: r.right }; }))) {
    expect(box.x).toBeGreaterThanOrEqual((track?.x ?? 0) - 1);
    expect(box.right).toBeLessThanOrEqual((track?.x ?? 0) + (track?.width ?? 0) + 1);
  }
});

test('o botão de sair pede confirmação com diálogo próprio', async ({ page }) => {
  await page.goto('/index.html?skipIntro#/');
  await page.getByRole('button', { name: 'Sair' }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
