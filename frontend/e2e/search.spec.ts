import { test, expect } from '@playwright/test';

test('헤더 검색창에서 검색하면 /search로 이동한다', async ({ page }) => {
  await page.goto('/');

  const searchInput = page.getByRole('searchbox', { name: '상품 검색' });
  await searchInput.fill('유니폼');
  await searchInput.press('Enter');

  await expect(page).toHaveURL(/\/search\?q=/);
  // 결과가 있든 없든(데이터 의존적) 검색어를 반영한 제목은 항상 렌더링된다.
  await expect(
    page.getByRole('heading', { name: "'유니폼'에 대한 검색 결과" }),
  ).toBeVisible();
});
