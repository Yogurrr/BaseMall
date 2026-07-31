import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/Button/Button';
import { login, register } from '../api/authApi';
import { setToken } from '../api/authToken';
import styles from './Login.module.css';

type Mode = 'login' | 'register';

export const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = mode === 'login' ? await login(email, password) : await register(name, email, password);
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
            minLength={4}
            required
          />
        </label>

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
