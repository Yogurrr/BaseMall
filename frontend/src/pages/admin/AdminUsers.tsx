import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import { Pagination } from '../../components/Pagination/Pagination';
import { fetchUsers } from '../../api/userApi';
import { register } from '../../api/authApi';
import type { User } from '../../types/user';
import styles from './Admin.module.css';

const USERS_PAGE_SIZE = 10;

export const AdminUsers = () => {
  const { data: users, isLoading, isError } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const [page, setPage] = useState(0);
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
  const totalPages = Math.max(1, Math.ceil(allUsers.length / USERS_PAGE_SIZE));
  const pagedUsers = allUsers.slice(page * USERS_PAGE_SIZE, page * USERS_PAGE_SIZE + USERS_PAGE_SIZE);

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages - 1));
  }, [totalPages]);

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
              {pagedUsers.map((user) => (
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

      {!isLoading && !isError && allUsers.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </>
  );
};
