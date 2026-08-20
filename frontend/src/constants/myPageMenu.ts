export interface MyPageMenuItem {
  key: string;
  label: string;
}

export interface MyPageMenuGroup {
  title: string;
  items: MyPageMenuItem[];
}

export const MYPAGE_MENU: MyPageMenuGroup[] = [
  {
    title: '나의 쇼핑 정보',
    items: [
      { key: 'orders', label: '주문/배송 조회' },
      { key: 'returns', label: '취소/반품/교환 내역' },
      { key: 'cart', label: '장바구니' },
      { key: 'points', label: '적립금 내역' },
      { key: 'coupons', label: '쿠폰 내역' },
    ],
  },
  {
    title: '활동 정보',
    items: [
      { key: 'recent', label: '최근 본 상품' },
      { key: 'wishlist', label: '나의 위시리스트' },
      { key: 'reviews', label: '내가 쓴 리뷰' },
    ],
  },
  {
    title: '나의 정보',
    items: [
      { key: 'profile-edit', label: '회원 정보 수정' },
      { key: 'refund-account', label: '배송지 관리' },
      { key: 'withdraw', label: '회원 탈퇴' },
      { key: 'logout', label: '로그아웃' },
    ],
  },
  {
    title: '문의',
    items: [
      { key: 'inquiries', label: '1:1 문의 내역' },
      { key: 'qna', label: '상품 Q&A 내역' },
    ],
  },
];
