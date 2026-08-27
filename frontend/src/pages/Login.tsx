import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/Button/Button';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { todayIso } from '../utils/todayIso';
import { login, register } from '../api/authApi';
import { setToken } from '../api/authToken';
import {
  PASSWORD_PATTERN,
  PASSWORD_RULE_MESSAGE,
  PHONE_PATTERN,
  PHONE_RULE_MESSAGE,
} from '../constants/validation';
import { buildKakaoAuthorizeUrl } from '../utils/kakaoAuth';
import styles from './Login.module.css';

// 💡 카카오 디벨로퍼스 콘솔의 Redirect URI, App.tsx의 라우트와 항상 같이 맞춰야 한다.
// 로그인 화면이라 talk_message까지 함께 동의받아, 이 경로로 가입/로그인한 계정은
// 별도 연동 없이 바로 주문 알림을 받을 수 있게 한다.
const KAKAO_LOGIN_REDIRECT_PATH = '/login/kakao/callback';
const KAKAO_LOGIN_SCOPE = 'profile_nickname account_email talk_message';

type Mode = 'login' | 'register';

// 💡 로그인/회원가입이 같은 폼 상태를 공유하므로(모드 전환 시 입력값 유지),
// zod 스키마도 단일 shape을 두고 mode에 따라 superRefine으로 회원가입 전용 규칙만 추가한다.
const buildSchema = (mode: Mode) =>
  z
    .object({
      name: z.string(),
      email: z.email('올바른 이메일 형식이 아닙니다.'),
      password: z.string().min(1, '비밀번호를 입력해주세요.'),
      birthDate: z.string(),
      phoneNumber: z.string(),
    })
    .superRefine((values, ctx) => {
      if (mode !== 'register') return;
      if (!values.name.trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['name'],
          message: '이름을 입력해주세요.',
        });
      }
      if (!PASSWORD_PATTERN.test(values.password)) {
        ctx.addIssue({
          code: 'custom',
          path: ['password'],
          message: PASSWORD_RULE_MESSAGE,
        });
      }
      if (values.phoneNumber && !PHONE_PATTERN.test(values.phoneNumber)) {
        ctx.addIssue({
          code: 'custom',
          path: ['phoneNumber'],
          message: PHONE_RULE_MESSAGE,
        });
      }
    });

type LoginFormValues = z.infer<ReturnType<typeof buildSchema>>;

export const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = useMemo(() => buildSchema(mode), [mode]);

  const {
    register: registerField,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      birthDate: '',
      phoneNumber: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const result =
        mode === 'login'
          ? await login(values.email, values.password)
          : await register({
              name: values.name,
              email: values.email,
              password: values.password,
              birthDate: values.birthDate || null,
              phoneNumber: values.phoneNumber || null,
            });
      setToken(result.token);
      navigate('/');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '요청 처리 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <form
        className={styles.card}
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <h1>{mode === 'login' ? '로그인' : '회원가입'}</h1>

        {mode === 'register' && (
          <label className={styles.field}>
            이름
            <input {...registerField('name')} />
            {errors.name && (
              <p className={styles.error}>{errors.name.message}</p>
            )}
          </label>
        )}
        <label className={styles.field}>
          이메일
          <input
            type="email"
            {...registerField('email')}
            placeholder="kim@example.com"
          />
          {errors.email && (
            <p className={styles.error}>{errors.email.message}</p>
          )}
        </label>
        <label className={styles.field}>
          비밀번호
          <input
            type="password"
            {...registerField('password')}
            placeholder={
              mode === 'register'
                ? '영문/숫자/특수문자 중 2가지 이상, 8자 이상'
                : undefined
            }
          />
          {errors.password && (
            <p className={styles.error}>{errors.password.message}</p>
          )}
        </label>

        {mode === 'register' && (
          <>
            <label className={styles.field}>
              생년월일
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    max={todayIso}
                    placeholder="생년월일 선택"
                  />
                )}
              />
            </label>
            <label className={styles.field}>
              휴대폰번호
              <input
                type="tel"
                {...registerField('phoneNumber')}
                placeholder="010-1234-5678"
              />
              {errors.phoneNumber && (
                <p className={styles.error}>{errors.phoneNumber.message}</p>
              )}
            </label>
          </>
        )}

        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'login' ? '로그인' : '회원가입'}
        </Button>

        <div className={styles.divider}>또는</div>

        <button
          type="button"
          className={styles.kakaoButton}
          onClick={() => {
            window.location.href = buildKakaoAuthorizeUrl(
              KAKAO_LOGIN_REDIRECT_PATH,
              KAKAO_LOGIN_SCOPE,
            );
          }}
        >
          카카오로 시작하기
        </button>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => setMode((m) => (m === 'login' ? 'register' : 'login'))}
        >
          {mode === 'login'
            ? '계정이 없으신가요? 회원가입'
            : '이미 계정이 있으신가요? 로그인'}
        </button>

        <Link to="/" className={styles.backLink}>
          ← 쇼핑몰로 돌아가기
        </Link>
      </form>
    </div>
  );
};
