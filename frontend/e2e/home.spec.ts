import { test, expect } from '@playwright/test';

test('홈 화면에 헤더와 상품 검색이 노출된다', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: '⚾ KBO 굿즈' })).toBeVisible();
  await expect(page.getByRole('search')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '베스트 굿즈' }),
  ).toBeVisible();
});
