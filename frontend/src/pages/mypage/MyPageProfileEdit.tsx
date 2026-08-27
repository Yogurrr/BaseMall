import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/Button/Button';
import { DatePicker } from '../../components/DatePicker/DatePicker';
import { todayIso } from '../../utils/todayIso';
import { unlinkKakaoAccount, updateProfile } from '../../api/authApi';
import {
  PASSWORD_PATTERN,
  PASSWORD_RULE_MESSAGE,
  PHONE_PATTERN,
  PHONE_RULE_MESSAGE,
} from '../../constants/validation';
import { buildKakaoAuthorizeUrl } from '../../utils/kakaoAuth';
import type { UserInfo } from '../../types/user';
import styles from './MyPage.module.css';

const profileSchema = z
  .object({
    name: z.string().min(1, '이름을 입력해주세요.'),
    birthDate: z.string(),
    phoneNumber: z.string(),
    currentPassword: z.string(),
    newPassword: z.string(),
    newPasswordConfirm: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.phoneNumber && !PHONE_PATTERN.test(values.phoneNumber)) {
      ctx.addIssue({
        code: 'custom',
        path: ['phoneNumber'],
        message: PHONE_RULE_MESSAGE,
      });
    }
    if (values.newPassword && !PASSWORD_PATTERN.test(values.newPassword)) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: PASSWORD_RULE_MESSAGE,
      });
    }
    if (
      values.newPassword &&
      values.newPassword !== values.newPasswordConfirm
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['newPasswordConfirm'],
        message: '새 비밀번호가 일치하지 않습니다.',
      });
    }
  });

type ProfileFormValues = z.infer<typeof profileSchema>;

// 💡 카카오 디벨로퍼스 콘솔에 등록해둔 Redirect URI와 정확히 일치해야 하므로,
// MyPageKakaoCallback 라우트 경로와 이 값이 항상 같이 바뀌어야 한다.
const KAKAO_LINK_REDIRECT_PATH = '/mypage/kakao/callback';

export const MyPageProfileEdit = () => {
  const currentUser = useOutletContext<UserInfo>();
  const queryClient = useQueryClient();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  const { register, handleSubmit, control, reset } = useForm<ProfileFormValues>(
    {
      resolver: zodResolver(profileSchema),
      defaultValues: {
        name: currentUser.name,
        birthDate: currentUser.birthDate ?? '',
        phoneNumber: currentUser.phoneNumber ?? '',
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: '',
      },
    },
  );

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const updatedUser = await updateProfile({
        name: values.name,
        birthDate: values.birthDate || null,
        phoneNumber: values.phoneNumber || null,
        currentPassword: values.newPassword
          ? values.currentPassword
          : undefined,
        newPassword: values.newPassword || undefined,
      });

      queryClient.setQueryData(['me'], updatedUser);

      reset({
        name: values.name,
        birthDate: values.birthDate,
        phoneNumber: values.phoneNumber,
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: '',
      });
      toast.success('회원 정보가 수정되었습니다.');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : '회원 정보 수정 중 오류가 발생했습니다.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onInvalid = (formErrors: FieldErrors<ProfileFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;
    toast.error(
      typeof firstMessage === 'string'
        ? firstMessage
        : '입력값을 확인해주세요.',
    );
  };

  const handleUnlinkKakao = async () => {
    setIsUnlinking(true);
    try {
      const updatedUser = await unlinkKakaoAccount();
      queryClient.setQueryData(['me'], updatedUser);
      toast.success('카카오 연동이 해제되었습니다.');
    } catch {
      toast.error('카카오 연동 해제 중 오류가 발생했습니다.');
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <div className={styles.wishlistSection}>
      <p className={styles.comingSoonTitle}>회원 정보 수정</p>

      <form
        className={styles.profileForm}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        noValidate
      >
        <div className={styles.profileTable}>
          <div className={styles.profileRow}>
            <label className={styles.profileLabel} htmlFor="profile-name">
              이름
            </label>
            <div className={styles.profileValue}>
              <input id="profile-name" {...register('name')} />
            </div>
          </div>
          <div className={styles.profileRow}>
            <div className={styles.profileLabel}>이메일</div>
            <div className={styles.profileValue}>
              <span className={styles.profileStatic}>{currentUser.email}</span>
            </div>
          </div>
          <div className={styles.profileRow}>
            <label className={styles.profileLabel} htmlFor="profile-birthDate">
              생년월일
            </label>
            <div className={styles.profileValue}>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <DatePicker
                    id="profile-birthDate"
                    value={field.value}
                    onChange={field.onChange}
                    max={todayIso}
                    placeholder="생년월일 선택"
                  />
                )}
              />
            </div>
          </div>
          <div className={styles.profileRow}>
            <label
              className={styles.profileLabel}
              htmlFor="profile-phoneNumber"
            >
              휴대폰번호
            </label>
            <div className={styles.profileValue}>
              <input
                id="profile-phoneNumber"
                type="tel"
                {...register('phoneNumber')}
                placeholder="010-1234-5678"
              />
            </div>
          </div>
        </div>
        <p className={styles.profileHint}>이메일은 변경할 수 없습니다.</p>

        <p className={styles.profileSectionTitle}>비밀번호 변경 (선택)</p>
        <p className={styles.profileHint}>
          비밀번호를 바꾸지 않으려면 비워두세요.
        </p>

        <div className={styles.profileTable}>
          <div className={styles.profileRow}>
            <label
              className={styles.profileLabel}
              htmlFor="profile-currentPassword"
            >
              현재 비밀번호
            </label>
            <div className={styles.profileValue}>
              <input
                id="profile-currentPassword"
                type="password"
                {...register('currentPassword')}
                placeholder="새 비밀번호 입력 시 필수"
              />
            </div>
          </div>
          <div className={styles.profileRow}>
            <label
              className={styles.profileLabel}
              htmlFor="profile-newPassword"
            >
              새 비밀번호
            </label>
            <div className={styles.profileValue}>
              <input
                id="profile-newPassword"
                type="password"
                {...register('newPassword')}
                placeholder="영문/숫자/특수문자 중 2가지 이상, 8자 이상"
              />
            </div>
          </div>
          <div className={styles.profileRow}>
            <label
              className={styles.profileLabel}
              htmlFor="profile-newPasswordConfirm"
            >
              비밀번호 확인
            </label>
            <div className={styles.profileValue}>
              <input
                id="profile-newPasswordConfirm"
                type="password"
                {...register('newPasswordConfirm')}
              />
            </div>
          </div>
        </div>

        <div className={styles.profileActions}>
          <Button type="submit" isLoading={isSubmitting}>
            저장하기
          </Button>
        </div>
      </form>

      <p className={styles.profileSectionTitle}>카카오 알림 연동</p>
      <p className={styles.profileHint}>
        연동하면 주문 상태 변경, 운송장 등록 시 카카오톡으로 알림을 받을 수
        있습니다.
      </p>
      <div className={styles.profileActions}>
        {currentUser.kakaoLinked ? (
          <>
            <span className={styles.profileStatic}>연동됨</span>
            <Button
              type="button"
              variant="outline"
              isLoading={isUnlinking}
              onClick={handleUnlinkKakao}
            >
              연동 해제
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={() => {
              window.location.href = buildKakaoAuthorizeUrl(
                KAKAO_LINK_REDIRECT_PATH,
                'talk_message',
              );
            }}
          >
            카카오로 주문/배송 알림 받기
          </Button>
        )}
      </div>
    </div>
  );
};
