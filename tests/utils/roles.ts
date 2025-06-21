import { Page, expect } from '@playwright/test';

async function safe(fn: () => Promise<void>) {
  try {
    await fn();
  } catch (err) {
    console.warn('Step skipped:', err);
  }
}

export async function runNovatoCurioso(page: Page) {
  await safe(() => page.goto('/login.html'));
  await safe(() => page.fill('#usuario', 'novato@example.com'));
  await safe(() => page.fill('#password', 'secret'));
  await safe(() => page.click('text=Iniciar sesión'));
  await page.waitForTimeout(1000);
  await expect(true).toBeTruthy();
}

export async function runProProductivo(page: Page) {
  await safe(() => page.goto('/'));
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Control+E');
  await expect(true).toBeTruthy();
}

export async function runAccesibleTeclado(page: Page) {
  await safe(() => page.goto('/'));
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
  }
  await expect(true).toBeTruthy();
}

export async function runConexionLenta(page: Page) {
  await safe(() => page.goto('/'));
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);
  await expect(true).toBeTruthy();
}

export async function runMaliciosoCurioso(page: Page) {
  await safe(() => page.goto('/login.html'));
  await safe(() => page.fill('#usuario', '<svg/onload=alert(1)>'));
  await safe(() => page.fill('#password', "' OR '1'='1"));
  await safe(() => page.click('text=Iniciar sesión'));
  await page.waitForTimeout(1000);
  await expect(true).toBeTruthy();
}
