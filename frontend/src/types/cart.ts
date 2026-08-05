import type { Product } from './product';

// 💡 장바구니에 담긴 상품. cartApi(서버)와 CartContext(비회원 로컬 저장소) 양쪽에서
// 동일한 모양을 쓰므로 여기 한 곳에서만 정의한다.
// cartItemId는 장바구니 줄 자체의 식별자(id는 상품 id로 유지) — 같은 상품이라도
// 사이즈/마킹이 다르면 여러 줄이 존재할 수 있어 수정/삭제는 cartItemId로 한다.
export interface CartItem extends Product {
  cartItemId: number;
  quantity: number;
  size?: string;
  markingName?: string;
}
