import { test, expect } from '@playwright/test';

test('빈 값으로 로그인 제출 시 유효성 검사 메시지가 노출된다', async ({
  page,
}) => {
  await page.goto('/login');

  await page.getByRole('button', { name: '로그인', exact: true }).click();

  await expect(page.getByText('올바른 이메일 형식이 아닙니다.')).toBeVisible();
  await expect(page.getByText('비밀번호를 입력해주세요.')).toBeVisible();
});

test('회원가입 모드로 전환할 수 있다', async ({ page }) => {
  await page.goto('/login');

  await page
    .getByRole('button', { name: '계정이 없으신가요? 회원가입' })
    .click();

  await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
});
