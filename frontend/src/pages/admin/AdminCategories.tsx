import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import {
  createCategory,
  deleteCategory,
  fetchCategoryList,
  updateCategory,
} from '../../api/categoryApi';
import {
  createBadge,
  deleteBadge,
  fetchBadges,
  getBadgeGradient,
  updateBadge,
} from '../../api/badgeApi';
import type { Category } from '../../types/category';
import type { Badge, BadgeInput } from '../../types/badge';
import styles from './Admin.module.css';

const extractErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) && error.response?.data?.message
    ? error.response.data.message
    : fallback;

const categoryFormSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요.'),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

const badgeFormSchema = z.object({
  name: z.string().trim().min(1, '이름을 입력해주세요.'),
  colorFrom: z.string(),
  colorTo: z.string(),
});

type BadgeFormValues = z.infer<typeof badgeFormSchema>;

const DEFAULT_BADGE_FORM: BadgeFormValues = {
  name: '',
  colorFrom: '#2563eb',
  colorTo: '#38bdf8',
};

const onInvalid = (
  formErrors: FieldErrors<CategoryFormValues | BadgeFormValues>,
) => {
  const firstMessage = Object.values(formErrors)[0]?.message;
  toast.error(
    typeof firstMessage === 'string' ? firstMessage : '입력값을 확인해주세요.',
  );
};

export const AdminCategories = () => {
  const queryClient = useQueryClient();

  // ================= 카테고리 =================
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['categories', 'admin'],
    queryFn: fetchCategoryList,
  });

  const {
    register: registerCategory,
    handleSubmit: handleCategoryFormSubmit,
    reset: resetCategoryFormValues,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '' },
  });
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );

  const resetCategoryForm = () => {
    resetCategoryFormValues({ name: '' });
    setEditingCategoryId(null);
  };

  const categoryMutation = useMutation({
    mutationFn: (name: string) =>
      editingCategoryId !== null
        ? updateCategory(editingCategoryId, name)
        : createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(
        editingCategoryId !== null
          ? '카테고리가 수정되었습니다.'
          : '카테고리가 추가되었습니다.',
      );
      resetCategoryForm();
    },
    onError: (error) =>
      toast.error(extractErrorMessage(error, '저장에 실패했습니다.')),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (editingCategoryId === id) resetCategoryForm();
    },
    onError: (error) =>
      toast.error(extractErrorMessage(error, '삭제에 실패했습니다.')),
  });

  const onCategorySubmit = (values: CategoryFormValues) => {
    categoryMutation.mutate(values.name);
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    resetCategoryFormValues({ name: category.name });
  };

  // ================= 뱃지 =================
  const {
    data: badges = [],
    isLoading: isBadgesLoading,
    isError: isBadgesError,
  } = useQuery({ queryKey: ['badges'], queryFn: fetchBadges });

  const {
    register: registerBadge,
    handleSubmit: handleBadgeFormSubmit,
    watch: watchBadge,
    reset: resetBadgeFormValues,
  } = useForm<BadgeFormValues>({
    resolver: zodResolver(badgeFormSchema),
    defaultValues: DEFAULT_BADGE_FORM,
  });
  const badgeName = watchBadge('name');
  const badgeColorFrom = watchBadge('colorFrom');
  const badgeColorTo = watchBadge('colorTo');
  const [editingBadgeId, setEditingBadgeId] = useState<number | null>(null);

  const resetBadgeForm = () => {
    resetBadgeFormValues(DEFAULT_BADGE_FORM);
    setEditingBadgeId(null);
  };

  const badgeMutation = useMutation({
    mutationFn: (payload: BadgeInput) =>
      editingBadgeId !== null
        ? updateBadge(editingBadgeId, payload)
        : createBadge(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success(
        editingBadgeId !== null
          ? '뱃지가 수정되었습니다.'
          : '뱃지가 추가되었습니다.',
      );
      resetBadgeForm();
    },
    onError: (error) =>
      toast.error(extractErrorMessage(error, '저장에 실패했습니다.')),
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: deleteBadge,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (editingBadgeId === id) resetBadgeForm();
    },
    onError: (error) =>
      toast.error(extractErrorMessage(error, '삭제에 실패했습니다.')),
  });

  const onBadgeSubmit = (values: BadgeFormValues) => {
    badgeMutation.mutate({ ...values, name: values.name });
  };

  const handleBadgeEdit = (badge: Badge) => {
    setEditingBadgeId(badge.id);
    resetBadgeFormValues({
      name: badge.name,
      colorFrom: badge.colorFrom,
      colorTo: badge.colorTo,
    });
  };

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>카테고리 관리</h1>
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>카테고리</h2>

        <form
          className={styles.form}
          onSubmit={handleCategoryFormSubmit(onCategorySubmit, onInvalid)}
          noValidate
        >
          <label className={`${styles.field} ${styles.fieldWide}`}>
            이름
            <input {...registerCategory('name')} placeholder="예: 유니폼" />
          </label>
          <div className={styles.formActions}>
            <Button type="submit" isLoading={categoryMutation.isPending}>
              {editingCategoryId !== null ? '수정 저장' : '카테고리 추가'}
            </Button>
            {editingCategoryId !== null && (
              <Button
                type="button"
                variant="secondary"
                onClick={resetCategoryForm}
              >
                취소
              </Button>
            )}
          </div>
        </form>

        <div className={styles.tableWrap}>
          {isCategoriesLoading ? (
            <div className={styles.empty}>
              <Spinner />
            </div>
          ) : isCategoriesError ? (
            <p className={`${styles.empty} ${styles.error}`}>
              카테고리 목록을 불러오지 못했습니다.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCategoryEdit(category)}
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={
                            deleteCategoryMutation.isPending &&
                            deleteCategoryMutation.variables === category.id
                          }
                          onClick={() =>
                            deleteCategoryMutation.mutate(category.id)
                          }
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
          {!isCategoriesLoading &&
            !isCategoriesError &&
            categories.length === 0 && (
              <p className={styles.empty}>등록된 카테고리가 없습니다.</p>
            )}
        </div>
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>뱃지</h2>

        <form
          className={styles.form}
          onSubmit={handleBadgeFormSubmit(onBadgeSubmit, onInvalid)}
          noValidate
        >
          <label className={styles.field}>
            이름
            <input {...registerBadge('name')} placeholder="예: NEW" />
          </label>
          <label className={styles.field}>
            시작 색상
            <input type="color" {...registerBadge('colorFrom')} />
          </label>
          <label className={styles.field}>
            끝 색상
            <input type="color" {...registerBadge('colorTo')} />
          </label>
          <div className={styles.field}>
            미리보기
            <span
              className={styles.badge}
              style={{
                background: `linear-gradient(120deg, ${badgeColorFrom}, ${badgeColorTo})`,
              }}
            >
              {badgeName || '뱃지'}
            </span>
          </div>
          <div className={styles.formActions}>
            <Button type="submit" isLoading={badgeMutation.isPending}>
              {editingBadgeId !== null ? '수정 저장' : '뱃지 추가'}
            </Button>
            {editingBadgeId !== null && (
              <Button
                type="button"
                variant="secondary"
                onClick={resetBadgeForm}
              >
                취소
              </Button>
            )}
          </div>
        </form>

        <div className={styles.tableWrap}>
          {isBadgesLoading ? (
            <div className={styles.empty}>
              <Spinner />
            </div>
          ) : isBadgesError ? (
            <p className={`${styles.empty} ${styles.error}`}>
              뱃지 목록을 불러오지 못했습니다.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>미리보기</th>
                  <th>이름</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {badges.map((badge) => (
                  <tr key={badge.id}>
                    <td>
                      <span
                        className={styles.badge}
                        style={{
                          background: getBadgeGradient(badges, badge.name),
                        }}
                      >
                        {badge.name}
                      </span>
                    </td>
                    <td>{badge.name}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBadgeEdit(badge)}
                        >
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={
                            deleteBadgeMutation.isPending &&
                            deleteBadgeMutation.variables === badge.id
                          }
                          onClick={() => deleteBadgeMutation.mutate(badge.id)}
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
          {!isBadgesLoading && !isBadgesError && badges.length === 0 && (
            <p className={styles.empty}>등록된 뱃지가 없습니다.</p>
          )}
        </div>
      </div>
    </>
  );
};
