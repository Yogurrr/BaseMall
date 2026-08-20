import { useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '../../components/Button/Button';
import { DatePicker } from '../../components/DatePicker/DatePicker';
import { todayIso } from '../../utils/todayIso';
import { updateProfile } from '../../api/authApi';
import {
  PASSWORD_INPUT_PATTERN,
  PASSWORD_PATTERN,
  PASSWORD_RULE_MESSAGE,
  PHONE_INPUT_PATTERN,
  PHONE_PATTERN,
  PHONE_RULE_MESSAGE,
} from '../../constants/validation';
import type { UserInfo } from '../../types/user';
import styles from './MyPage.module.css';

export const MyPageProfileEdit = () => {
  const currentUser = useOutletContext<UserInfo>();
  const queryClient = useQueryClient();

  const [name, setName] = useState(currentUser.name);
  const [birthDate, setBirthDate] = useState(currentUser.birthDate ?? '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser.phoneNumber ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (phoneNumber && !PHONE_PATTERN.test(phoneNumber)) {
      setError(PHONE_RULE_MESSAGE);
      return;
    }

    if (newPassword && !PASSWORD_PATTERN.test(newPassword)) {
      setError(PASSWORD_RULE_MESSAGE);
      return;
    }

    if (newPassword && newPassword !== newPasswordConfirm) {
      setError('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await updateProfile({
        name,
        birthDate: birthDate || null,
        phoneNumber: phoneNumber || null,
        currentPassword: newPassword ? currentPassword : undefined,
        newPassword: newPassword || undefined,
      });

      queryClient.setQueryData(['me'], updatedUser);

      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setSuccess('회원 정보가 수정되었습니다.');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '회원 정보 수정 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>회원 정보 수정</p>

      <form className={styles.profileForm} onSubmit={handleSubmit}>
        <div className={styles.profileTable}>
          <div className={styles.profileRow}>
            <div className={styles.profileLabel}>이름</div>
            <div className={styles.profileValue}>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          </div>
          <div className={styles.profileRow}>
            <div className={styles.profileLabel}>이메일</div>
            <div className={styles.profileValue}>
              <span className={styles.profileStatic}>{currentUser.email}</span>
            </div>
          </div>
          <div className={styles.profileRow}>
            <div className={styles.profileLabel}>생년월일</div>
            <div className={styles.profileValue}>
              <DatePicker value={birthDate} onChange={setBirthDate} max={todayIso} placeholder="생년월일 선택" />
            </div>
          </div>
          <div className={styles.profileRow}>
            <div className={styles.profileLabel}>휴대폰번호</div>
            <div className={styles.profileValue}>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                pattern={PHONE_INPUT_PATTERN}
                placeholder="010-1234-5678"
                title={PHONE_RULE_MESSAGE}
              />
            </div>
          </div>
        </div>
        <p className={styles.profileHint}>이메일은 변경할 수 없습니다.</p>

        <p className={styles.profileSectionTitle}>비밀번호 변경 (선택)</p>
        <p className={styles.profileHint}>비밀번호를 바꾸지 않으려면 비워두세요.</p>

        <div className={styles.profileTable}>
          <div className={styles.profileRow}>
            <div className={styles.profileLabel}>현재 비밀번호</div>
            <div className={styles.profileValue}>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="새 비밀번호 입력 시 필수"
              />
            </div>
          </div>
          <div className={styles.profileRow}>
            <div className={styles.profileLabel}>새 비밀번호</div>
            <div className={styles.profileValue}>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                pattern={PASSWORD_INPUT_PATTERN}
                placeholder="영문/숫자/특수문자 중 2가지 이상, 8자 이상"
                title={PASSWORD_RULE_MESSAGE}
              />
            </div>
          </div>
          <div className={styles.profileRow}>
            <div className={styles.profileLabel}>비밀번호 확인</div>
            <div className={styles.profileValue}>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                minLength={8}
              />
            </div>
          </div>
        </div>

        {error && <p className={styles.profileError}>{error}</p>}
        {success && <p className={styles.profileSuccess}>{success}</p>}

        <div className={styles.profileActions}>
          <Button type="submit" isLoading={isSubmitting}>
            저장하기
          </Button>
        </div>
      </form>
    </div>
  );
};
