import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import { InfoModal } from '../../components/InfoModal/InfoModal';
import { createCategory, deleteCategory, fetchCategoryList, updateCategory } from '../../api/categoryApi';
import { createBadge, deleteBadge, fetchBadges, getBadgeGradient, updateBadge } from '../../api/badgeApi';
import type { Category } from '../../types/category';
import type { Badge, BadgeInput } from '../../types/badge';
import styles from './Admin.module.css';

const extractErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError(error) && error.response?.data?.message ? error.response.data.message : fallback;

const DEFAULT_BADGE_FORM: BadgeInput = { name: '', colorFrom: '#2563eb', colorTo: '#38bdf8' };

export const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ================= 카테고리 =================
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({ queryKey: ['categories', 'admin'], queryFn: fetchCategoryList });

  const [categoryName, setCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const resetCategoryForm = () => {
    setCategoryName('');
    setEditingCategoryId(null);
    setCategoryError(null);
  };

  const categoryMutation = useMutation({
    mutationFn: (name: string) =>
      editingCategoryId !== null ? updateCategory(editingCategoryId, name) : createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSuccessMessage(editingCategoryId !== null ? '카테고리가 수정되었습니다.' : '카테고리가 추가되었습니다.');
      resetCategoryForm();
    },
    onError: (error) => setCategoryError(extractErrorMessage(error, '저장에 실패했습니다.')),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (editingCategoryId === id) resetCategoryForm();
    },
    onError: (error) => setCategoryError(extractErrorMessage(error, '삭제에 실패했습니다.')),
  });

  const handleCategorySubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    setCategoryError(null);
    categoryMutation.mutate(trimmed);
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryError(null);
  };

  // ================= 뱃지 =================
  const {
    data: badges = [],
    isLoading: isBadgesLoading,
    isError: isBadgesError,
  } = useQuery({ queryKey: ['badges'], queryFn: fetchBadges });

  const [badgeForm, setBadgeForm] = useState<BadgeInput>(DEFAULT_BADGE_FORM);
  const [editingBadgeId, setEditingBadgeId] = useState<number | null>(null);
  const [badgeError, setBadgeError] = useState<string | null>(null);

  const resetBadgeForm = () => {
    setBadgeForm(DEFAULT_BADGE_FORM);
    setEditingBadgeId(null);
    setBadgeError(null);
  };

  const badgeMutation = useMutation({
    mutationFn: (payload: BadgeInput) =>
      editingBadgeId !== null ? updateBadge(editingBadgeId, payload) : createBadge(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      setSuccessMessage(editingBadgeId !== null ? '뱃지가 수정되었습니다.' : '뱃지가 추가되었습니다.');
      resetBadgeForm();
    },
    onError: (error) => setBadgeError(extractErrorMessage(error, '저장에 실패했습니다.')),
  });

  const deleteBadgeMutation = useMutation({
    mutationFn: deleteBadge,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (editingBadgeId === id) resetBadgeForm();
    },
    onError: (error) => setBadgeError(extractErrorMessage(error, '삭제에 실패했습니다.')),
  });

  const handleBadgeSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = badgeForm.name.trim();
    if (!trimmed) return;
    setBadgeError(null);
    badgeMutation.mutate({ ...badgeForm, name: trimmed });
  };

  const handleBadgeEdit = (badge: Badge) => {
    setEditingBadgeId(badge.id);
    setBadgeForm({ name: badge.name, colorFrom: badge.colorFrom, colorTo: badge.colorTo });
    setBadgeError(null);
  };

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>카테고리 관리</h1>
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>카테고리</h2>

        <form className={styles.form} onSubmit={handleCategorySubmit}>
          <label className={`${styles.field} ${styles.fieldWide}`}>
            이름
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="예: 유니폼"
              required
            />
          </label>
          <div className={styles.formActions}>
            <Button type="submit" isLoading={categoryMutation.isPending}>
              {editingCategoryId !== null ? '수정 저장' : '카테고리 추가'}
            </Button>
            {editingCategoryId !== null && (
              <Button type="button" variant="secondary" onClick={resetCategoryForm}>
                취소
              </Button>
            )}
          </div>
          {categoryError && <p className={styles.error}>{categoryError}</p>}
        </form>

        <div className={styles.tableWrap}>
          {isCategoriesLoading ? (
            <div className={styles.empty}><Spinner /></div>
          ) : isCategoriesError ? (
            <p className={`${styles.empty} ${styles.error}`}>카테고리 목록을 불러오지 못했습니다.</p>
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
                        <Button size="sm" variant="outline" onClick={() => handleCategoryEdit(category)}>
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={deleteCategoryMutation.isPending && deleteCategoryMutation.variables === category.id}
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
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
          {!isCategoriesLoading && !isCategoriesError && categories.length === 0 && (
            <p className={styles.empty}>등록된 카테고리가 없습니다.</p>
          )}
        </div>
      </div>

      <div className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>뱃지</h2>

        <form className={styles.form} onSubmit={handleBadgeSubmit}>
          <label className={styles.field}>
            이름
            <input
              value={badgeForm.name}
              onChange={(e) => setBadgeForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="예: NEW"
              required
            />
          </label>
          <label className={styles.field}>
            시작 색상
            <input
              type="color"
              value={badgeForm.colorFrom}
              onChange={(e) => setBadgeForm((f) => ({ ...f, colorFrom: e.target.value }))}
            />
          </label>
          <label className={styles.field}>
            끝 색상
            <input
              type="color"
              value={badgeForm.colorTo}
              onChange={(e) => setBadgeForm((f) => ({ ...f, colorTo: e.target.value }))}
            />
          </label>
          <div className={styles.field}>
            미리보기
            <span
              className={styles.badge}
              style={{ background: `linear-gradient(120deg, ${badgeForm.colorFrom}, ${badgeForm.colorTo})` }}
            >
              {badgeForm.name || '뱃지'}
            </span>
          </div>
          <div className={styles.formActions}>
            <Button type="submit" isLoading={badgeMutation.isPending}>
              {editingBadgeId !== null ? '수정 저장' : '뱃지 추가'}
            </Button>
            {editingBadgeId !== null && (
              <Button type="button" variant="secondary" onClick={resetBadgeForm}>
                취소
              </Button>
            )}
          </div>
          {badgeError && <p className={styles.error}>{badgeError}</p>}
        </form>

        <div className={styles.tableWrap}>
          {isBadgesLoading ? (
            <div className={styles.empty}><Spinner /></div>
          ) : isBadgesError ? (
            <p className={`${styles.empty} ${styles.error}`}>뱃지 목록을 불러오지 못했습니다.</p>
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
                      <span className={styles.badge} style={{ background: getBadgeGradient(badges, badge.name) }}>
                        {badge.name}
                      </span>
                    </td>
                    <td>{badge.name}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button size="sm" variant="outline" onClick={() => handleBadgeEdit(badge)}>
                          수정
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={deleteBadgeMutation.isPending && deleteBadgeMutation.variables === badge.id}
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

      {successMessage && (
        <InfoModal message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
    </>
  );
};
