import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import { Pagination } from '../../components/Pagination/Pagination';
import { UserDetailModal } from '../../components/UserDetailModal/UserDetailModal';
import { fetchUsers } from '../../api/userApi';
import { register } from '../../api/authApi';
import {
  PASSWORD_PATTERN,
  PASSWORD_RULE_MESSAGE,
} from '../../constants/validation';
import type { User } from '../../types/user';
import styles from './Admin.module.css';

const USERS_PAGE_SIZE = 10;

const newUserSchema = z
  .object({
    name: z.string().trim().min(1, '이름을 입력해주세요.'),
    email: z.email('올바른 이메일 형식이 아닙니다.'),
    password: z.string().min(1, '비밀번호를 입력해주세요.'),
  })
  .superRefine((values, ctx) => {
    if (!PASSWORD_PATTERN.test(values.password)) {
      ctx.addIssue({
        code: 'custom',
        path: ['password'],
        message: PASSWORD_RULE_MESSAGE,
      });
    }
  });

type NewUserFormValues = z.infer<typeof newUserSchema>;

const EMPTY_NEW_USER: NewUserFormValues = { name: '', email: '', password: '' };

export const AdminUsers = () => {
  const {
    data: users,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const [page, setPage] = useState(0);
  // 백엔드 목업이 실제로 신규 회원을 저장하지 않고 GET 응답도 고정값이라,
  // 새로 추가한 회원은 쿼리 캐시가 아닌 별도 상태로 보관해 뒤늦게 끝나는
  // 최초 조회 응답이 추가분을 덮어쓰지 않도록 한다.
  const [createdUsers, setCreatedUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const {
    register: registerField,
    handleSubmit,
    reset,
  } = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
    defaultValues: EMPTY_NEW_USER,
  });

  const mutation = useMutation({
    // 💡 register()는 발급된 토큰을 함께 반환하지만, 여기서는 관리자가
    // 남 대신 계정을 만드는 것이므로 그 토큰으로 로그인 세션을 바꾸면 안 된다.
    // id/name/email만 취해 목록에 반영하고 토큰은 버린다.
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      register(payload),
    onSuccess: (newUser) => {
      setCreatedUsers((prev) => [
        ...prev,
        { id: newUser.id, name: newUser.name, email: newUser.email },
      ]);
      reset(EMPTY_NEW_USER);
      toast.success('회원이 추가되었습니다.');
    },
    onError: () => toast.error('회원 추가에 실패했습니다.'),
  });

  const onSubmit = (values: NewUserFormValues) => {
    mutation.mutate({
      name: values.name,
      email: values.email,
      password: values.password,
    });
  };

  const onInvalid = (formErrors: FieldErrors<NewUserFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;
    toast.error(
      typeof firstMessage === 'string'
        ? firstMessage
        : '입력값을 확인해주세요.',
    );
  };

  const allUsers = [...(users ?? []), ...createdUsers];
  const totalPages = Math.max(1, Math.ceil(allUsers.length / USERS_PAGE_SIZE));
  // 💡 회원이 줄어 totalPages가 작아지면 그만큼 현재 페이지도 같이 줄여야 하는데,
  // 렌더링 중에 바로 계산하면 되는 값이라 별도 effect로 state를 동기화할 필요가 없다.
  const currentPage = Math.min(page, totalPages - 1);
  const pagedUsers = allUsers.slice(
    currentPage * USERS_PAGE_SIZE,
    currentPage * USERS_PAGE_SIZE + USERS_PAGE_SIZE,
  );

  return (
    <>
      <h1>회원 관리</h1>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>전체 회원</span>
          <strong>{allUsers.length}명</strong>
        </div>
      </section>

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        noValidate
      >
        <label className={styles.field}>
          이름
          <input {...registerField('name')} placeholder="홍길동" />
        </label>
        <label className={styles.field}>
          이메일
          <input
            type="email"
            {...registerField('email')}
            placeholder="hong@example.com"
          />
        </label>
        <label className={styles.field}>
          비밀번호
          <input type="password" {...registerField('password')} />
        </label>
        <div className={styles.formActions}>
          <Button type="submit" isLoading={mutation.isPending}>
            회원 추가
          </Button>
        </div>
      </form>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : isError ? (
          <p className={`${styles.empty} ${styles.error}`}>
            회원 목록을 불러오지 못했습니다.
          </p>
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
                <tr
                  key={user.id}
                  className={styles.clickableRow}
                  onClick={() =>
                    user.id !== undefined && setSelectedUserId(user.id)
                  }
                >
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
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onChange={setPage}
        />
      )}

      {selectedUserId !== null && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </>
  );
};
