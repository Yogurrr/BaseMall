import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/Button/Button';
import { DatePicker } from '../components/DatePicker/DatePicker';
import { todayIso } from '../utils/todayIso';
import { login, register } from '../api/authApi';
import { setToken } from '../api/authToken';
import {
  PASSWORD_INPUT_PATTERN,
  PASSWORD_PATTERN,
  PASSWORD_RULE_MESSAGE,
  PHONE_INPUT_PATTERN,
  PHONE_PATTERN,
  PHONE_RULE_MESSAGE,
} from '../constants/validation';
import styles from './Login.module.css';

type Mode = 'login' | 'register';

export const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (mode === 'register' && !PASSWORD_PATTERN.test(password)) {
      setError(PASSWORD_RULE_MESSAGE);
      return;
    }

    if (mode === 'register' && phoneNumber && !PHONE_PATTERN.test(phoneNumber)) {
      setError(PHONE_RULE_MESSAGE);
      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        mode === 'login'
          ? await login(email, password)
          : await register({
              name,
              email,
              password,
              birthDate: birthDate || null,
              phoneNumber: phoneNumber || null,
            });
      setToken(result.token);
      navigate('/');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '요청 처리 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1>{mode === 'login' ? '로그인' : '회원가입'}</h1>

        {mode === 'register' && (
          <label className={styles.field}>
            이름
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label className={styles.field}>
          이메일
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kim@example.com"
            required
          />
        </label>
        <label className={styles.field}>
          비밀번호
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={mode === 'register' ? 8 : undefined}
            pattern={mode === 'register' ? PASSWORD_INPUT_PATTERN : undefined}
            title={mode === 'register' ? PASSWORD_RULE_MESSAGE : undefined}
            placeholder={mode === 'register' ? '영문/숫자/특수문자 중 2가지 이상, 8자 이상' : undefined}
            required
          />
        </label>

        {mode === 'register' && (
          <>
            <label className={styles.field}>
              생년월일
              <DatePicker value={birthDate} onChange={setBirthDate} max={todayIso} placeholder="생년월일 선택" />
            </label>
            <label className={styles.field}>
              휴대폰번호
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                pattern={PHONE_INPUT_PATTERN}
                title={PHONE_RULE_MESSAGE}
                placeholder="010-1234-5678"
              />
            </label>
          </>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'login' ? '로그인' : '회원가입'}
        </Button>

        <button
          type="button"
          className={styles.toggle}
          onClick={() => {
            setMode((m) => (m === 'login' ? 'register' : 'login'));
            setError(null);
          }}
        >
          {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>

        <Link to="/" className={styles.backLink}>
          ← 쇼핑몰로 돌아가기
        </Link>
      </form>
    </div>
  );
};
