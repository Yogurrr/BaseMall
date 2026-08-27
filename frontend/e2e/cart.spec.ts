import { test, expect } from '@playwright/test';

// 💡 비로그인 장바구니는 zustand 로컬 스토어(guestCartStore)로 동작하므로 로그인 없이도
// 담기→장바구니 페이지 반영까지 검증할 수 있다. 상품 데이터는 DB 시딩에 의존하므로
// 특정 상품명 대신 "첫 번째 상품 카드"를 사용해 데이터에 결합되지 않게 한다.
test('상품을 장바구니에 담으면 장바구니 페이지에 반영된다', async ({
  page,
}) => {
  await page.goto('/');

  // article 안에는 썸네일 링크와 제목 링크가 있는데, 썸네일 쪽은 찜하기 버튼이 겹쳐 있어
  // 클릭 좌표가 어긋날 수 있으므로 제목 링크(h3 a)를 사용한다.
  const firstProductTitleLink = page.locator('article h3 a').first();
  await firstProductTitleLink.click();

  await page.getByRole('button', { name: '🛒 장바구니 담기' }).click();

  await expect(
    page.getByRole('dialog', { name: '장바구니에 담았습니다' }),
  ).toBeVisible();

  await page.getByRole('link', { name: '장바구니' }).click();

  await expect(page).toHaveURL('/cart');
  await expect(page.getByText('장바구니가 비어 있습니다.')).not.toBeVisible();
});
