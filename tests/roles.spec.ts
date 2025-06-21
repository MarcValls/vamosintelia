import { test } from '@playwright/test';
import {
  runNovatoCurioso,
  runProProductivo,
  runAccesibleTeclado,
  runConexionLenta,
  runMaliciosoCurioso,
} from './utils/roles';

test.describe('Role based flows', () => {
  test('@human-test Novato Curioso', async ({ page }) => {
    await runNovatoCurioso(page);
  });

  test('@human-test Pro Productivo', async ({ page }) => {
    await runProProductivo(page);
  });

  test('@human-test Accesible-Teclado', async ({ page }) => {
    await runAccesibleTeclado(page);
  });

  test('@human-test Conexión Lenta', async ({ page }) => {
    await runConexionLenta(page);
  });

  test('@human-test Malicioso-Curioso', async ({ page }) => {
    await runMaliciosoCurioso(page);
  });
});
