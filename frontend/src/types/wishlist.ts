import type { Product } from './product';

// 💡 위시리스트에 담긴 상품. wishlistApi(서버)와 WishlistContext(비회원 로컬 저장소) 양쪽에서
// 동일한 모양을 쓰므로 여기 한 곳에서만 정의한다.
export type WishlistItem = Product;
