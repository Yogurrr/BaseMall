import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button/Button';
import { Spinner } from '../components/Spinner/Spinner';
import { SelectFilter } from '../components/SelectFilter/SelectFilter';
import { fetchUsers } from '../api/userApi';
import type { User } from '../api/userApi';
import { register } from '../api/authApi';
import { clearToken } from '../api/authToken';
import {
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchDeletedProducts,
  fetchProducts,
  fetchTeams,
  formatPrice,
  restoreProduct,
  updateProduct,
} from '../api/productApi';
import type { Product, ProductInput } from '../api/productApi';
import { ORDER_STATUSES, fetchOrders, updateOrderStatus } from '../api/orderApi';
import styles from './Admin.module.css';

type Tab = 'products' | 'orders' | 'users';

const EMPTY_FORM = {
  name: '',
  category: '',
  team: '',
  price: '',
  originalPrice: '',
  emoji: '🛒',
  badge: '' as Product['badge'] | '',
};

export const Admin = () => {
  const [tab, setTab] = useState<Tab>('products');
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          ⚾ KBO 굿즈
          <span>ADMIN</span>
        </div>
        <nav className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'products' ? styles.tabActive : ''}`}
            onClick={() => setTab('products')}
          >
            상품 관리
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'orders' ? styles.tabActive : ''}`}
            onClick={() => setTab('orders')}
          >
            주문 관리
          </button>
          <button
            type="button"
            className={`${styles.tab} ${tab === 'users' ? styles.tabActive : ''}`}
            onClick={() => setTab('users')}
          >
            회원 관리
          </button>
        </nav>
        <button type="button" className={styles.tab} onClick={handleLogout}>
          로그아웃
        </button>
        <Link to="/" className={styles.backLink}>
          ← 쇼핑몰로 돌아가기
        </Link>
      </aside>

      <main className={styles.content}>
        {tab === 'products' ? <ProductsPanel /> : tab === 'orders' ? <OrdersPanel /> : <UsersPanel />}
      </main>
    </div>
  );
};

const ProductsPanel = () => {
  const queryClient = useQueryClient();
  const [showDeleted, setShowDeleted] = useState(false);

  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });
  const {
    data: deletedProducts = [],
    isLoading: isDeletedLoading,
    isError: isDeletedError,
  } = useQuery({
    queryKey: ['products', 'deleted'],
    queryFn: fetchDeletedProducts,
    enabled: showDeleted,
  });
  const { data: categoryNames = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });
  const { data: teamNames = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!form.category && categoryNames.length > 0) {
      setForm((f) => ({ ...f, category: categoryNames[0] }));
    }
  }, [categoryNames]);

  useEffect(() => {
    if (!form.team && teamNames.length > 0) {
      setForm((f) => ({ ...f, team: teamNames[0] }));
    }
  }, [teamNames]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, category: categoryNames[0] ?? '', team: teamNames[0] ?? '' });
    setEditingId(null);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: ProductInput) =>
      editingId !== null ? updateProduct(editingId, payload) : createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (editingId === id) resetForm();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: restoreProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    const priceValue = Number(form.price);
    if (!trimmedName || !priceValue) return;

    saveMutation.mutate({
      name: trimmedName,
      category: form.category,
      team: form.team || undefined,
      price: priceValue,
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      emoji: form.emoji || '🛒',
      badge: form.badge || undefined,
    });
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      team: product.team ?? '',
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      emoji: product.emoji,
      badge: product.badge ?? '',
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>상품 관리</h1>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowDeleted((v) => !v)}>
          {showDeleted ? '활성 상품 보기' : '삭제된 상품 보기'}
        </Button>
      </div>

      {showDeleted ? (
        <div className={styles.tableWrap}>
          {isDeletedLoading ? (
            <div className={styles.empty}><Spinner /></div>
          ) : isDeletedError ? (
            <p className={`${styles.empty} ${styles.error}`}>삭제된 상품 목록을 불러오지 못했습니다.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>상품</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {deletedProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.emoji} {product.name}
                    </td>
                    <td>{product.category}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline"
                        isLoading={restoreMutation.isPending && restoreMutation.variables === product.id}
                        onClick={() => restoreMutation.mutate(product.id)}
                      >
                        복구
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isDeletedLoading && !isDeletedError && deletedProducts.length === 0 && (
            <p className={styles.empty}>삭제된 상품이 없습니다.</p>
          )}
        </div>
      ) : (
        <>
      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>전체 상품</span>
          <strong>{products.length}개</strong>
        </div>
        <div className={styles.statCard}>
          <span>세일 상품</span>
          <strong>{products.filter((p) => p.badge === 'SALE').length}개</strong>
        </div>
        <div className={styles.statCard}>
          <span>평균 평점</span>
          <strong>
            {products.length
              ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)
              : '0.0'}
          </strong>
        </div>
      </section>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          상품명
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="예: 오버핏 셔츠"
            required
          />
        </label>
        <label className={styles.field}>
          카테고리
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            {categoryNames.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          구단
          <select
            value={form.team}
            onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
          >
            {teamNames.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          가격
          <input
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            placeholder="39000"
            required
          />
        </label>
        <label className={styles.field}>
          정가(선택)
          <input
            type="number"
            min="0"
            value={form.originalPrice}
            onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
            placeholder="52000"
          />
        </label>
        <label className={styles.field}>
          아이콘
          <input
            value={form.emoji}
            onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
            placeholder="👕"
          />
        </label>
        <label className={styles.field}>
          뱃지
          <select
            value={form.badge ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value as Product['badge'] | '' }))}
          >
            <option value="">없음</option>
            <option value="NEW">NEW</option>
            <option value="SALE">SALE</option>
            <option value="BEST">BEST</option>
          </select>
        </label>
        <div className={styles.formActions}>
          <Button type="submit" isLoading={saveMutation.isPending}>
            {editingId !== null ? '수정 저장' : '상품 추가'}
          </Button>
          {editingId !== null && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              취소
            </Button>
          )}
        </div>
        {saveMutation.isError && <p className={styles.error}>저장에 실패했습니다.</p>}
      </form>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}><Spinner /></div>
        ) : isError ? (
          <p className={`${styles.empty} ${styles.error}`}>상품 목록을 불러오지 못했습니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>상품</th>
                <th>카테고리</th>
                <th>구단</th>
                <th>가격</th>
                <th>평점</th>
                <th>뱃지</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.emoji} {product.name}
                  </td>
                  <td>{product.category}</td>
                  <td>{product.team ?? '-'}</td>
                  <td>{formatPrice(product.price)}</td>
                  <td>⭐ {product.rating}</td>
                  <td>
                    {product.badge && (
                      <span className={`${styles.badge} ${styles[`badge${product.badge}`]}`}>
                        {product.badge}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(product)}>
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={deleteMutation.isPending && deleteMutation.variables === product.id}
                        onClick={() => handleDelete(product.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && !isError && products.length === 0 && (
          <p className={styles.empty}>등록된 상품이 없습니다.</p>
        )}
      </div>
        </>
      )}
    </>
  );
};

const ORDER_STATUS_FILTERS = ['전체', ...ORDER_STATUSES];

const OrdersPanel = () => {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
  });
  const [statusFilter, setStatusFilter] = useState('전체');
  const [keyword, setKeyword] = useState('');

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
  const trimmedKeyword = keyword.trim().toLowerCase();
  const filteredOrders = orders
    .filter((order) => statusFilter === '전체' || order.status === statusFilter)
    .filter((order) => {
      if (!trimmedKeyword) return true;
      const orderNumber = `#${order.id}`;
      const haystack = [
        orderNumber,
        String(order.id),
        order.buyerName,
        order.buyerEmail,
        ...order.items.map((item) => item.name),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(trimmedKeyword);
    });

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>주문 관리</h1>
      </div>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>전체 주문</span>
          <strong>{orders.length}건</strong>
        </div>
        <div className={styles.statCard}>
          <span>주문 총액</span>
          <strong>{formatPrice(totalRevenue)}</strong>
        </div>
      </section>

      <div className={styles.filterBar}>
        <SelectFilter options={ORDER_STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        <input
          type="search"
          className={styles.searchInput}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="주문번호, 주문자, 이메일, 상품명으로 검색"
          aria-label="주문 검색"
        />
      </div>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}><Spinner /></div>
        ) : isError ? (
          <p className={`${styles.empty} ${styles.error}`}>주문 목록을 불러오지 못했습니다.</p>
        ) : orders.length === 0 ? (
          <p className={styles.empty}>주문 내역이 없습니다.</p>
        ) : filteredOrders.length === 0 ? (
          <p className={styles.empty}>
            {trimmedKeyword ? `'${keyword}'에 대한 검색 결과가 없습니다.` : `'${statusFilter}' 상태의 주문이 없습니다.`}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문자</th>
                <th>상품</th>
                <th>금액</th>
                <th>주문일시</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    {order.buyerName}
                    <div className={styles.orderBuyerEmail}>{order.buyerEmail}</div>
                  </td>
                  <td>
                    {order.items.map((item, index) => (
                      <div key={index}>
                        {item.emoji} {item.name} × {item.quantity}
                      </div>
                    ))}
                  </td>
                  <td>{formatPrice(order.totalPrice)}</td>
                  <td>{new Date(order.createdAt).toLocaleString('ko-KR')}</td>
                  <td>
                    <select
                      value={order.status}
                      disabled={statusMutation.isPending && statusMutation.variables?.id === order.id}
                      onChange={(e) => statusMutation.mutate({ id: order.id, status: e.target.value })}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

const UsersPanel = () => {
  const { data: users, isLoading, isError } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  // 백엔드 목업이 실제로 신규 회원을 저장하지 않고 GET 응답도 고정값이라,
  // 새로 추가한 회원은 쿼리 캐시가 아닌 별도 상태로 보관해 뒤늦게 끝나는
  // 최초 조회 응답이 추가분을 덮어쓰지 않도록 한다.
  const [createdUsers, setCreatedUsers] = useState<User[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    // 💡 register()는 발급된 토큰을 함께 반환하지만, 여기서는 관리자가
    // 남 대신 계정을 만드는 것이므로 그 토큰으로 로그인 세션을 바꾸면 안 된다.
    // id/name/email만 취해 목록에 반영하고 토큰은 버린다.
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      register(payload.name, payload.email, payload.password),
    onSuccess: (newUser) => {
      setCreatedUsers((prev) => [...prev, { id: newUser.id, name: newUser.name, email: newUser.email }]);
      setName('');
      setEmail('');
      setPassword('');
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    mutation.mutate({ name: name.trim(), email: email.trim(), password });
  };

  const allUsers = [...(users ?? []), ...createdUsers];

  return (
    <>
      <h1>회원 관리</h1>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>전체 회원</span>
          <strong>{allUsers.length}명</strong>
        </div>
      </section>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          이름
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" required />
        </label>
        <label className={styles.field}>
          이메일
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hong@example.com"
            required
          />
        </label>
        <label className={styles.field}>
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={4}
            required
          />
        </label>
        <div className={styles.formActions}>
          <Button type="submit" isLoading={mutation.isPending}>
            회원 추가
          </Button>
        </div>
        {mutation.isError && <p className={styles.error}>회원 추가에 실패했습니다.</p>}
      </form>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}><Spinner /></div>
        ) : isError ? (
          <p className={`${styles.empty} ${styles.error}`}>회원 목록을 불러오지 못했습니다.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>이메일</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};
