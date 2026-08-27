import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import { ProductThumb } from '../../components/ProductThumb/ProductThumb';
import { useObjectUrlPreview } from '../../hooks/useObjectUrlPreview';
import {
  createBanner,
  deleteBanner,
  fetchAllBanners,
  updateBanner,
  updateBannerActive,
  uploadBannerImage,
} from '../../api/bannerApi';
import type { Banner, BannerInput } from '../../types/banner';
import styles from './Admin.module.css';

const GRADIENT_ANGLE = 120;
const DEFAULT_GRADIENT_FROM = '#f97316';
const DEFAULT_GRADIENT_TO = '#dc2626';

const buildGradient = (from: string, to: string) =>
  `linear-gradient(${GRADIENT_ANGLE}deg, ${from}, ${to})`;

// 💡 기존에 저장된 배너는 임의의 CSS 그라디언트 문자열이므로, 색상 선택기에 채워 넣기 위해
// 그 안에 들어있는 hex 색상 두 개를 추출한다. 못 찾으면 기본 색상으로 대체한다.
const parseGradientColors = (
  gradient: string,
): { from: string; to: string } => {
  const hexColors = gradient.match(/#[0-9a-fA-F]{3,8}/g);
  return {
    from: hexColors?.[0] ?? DEFAULT_GRADIENT_FROM,
    to: hexColors?.[1] ?? hexColors?.[0] ?? DEFAULT_GRADIENT_TO,
  };
};

const bannerFormSchema = z.object({
  eyebrow: z.string(),
  title: z.string().trim().min(1, '제목을 입력해주세요.'),
  description: z.string(),
  ctaLabel: z.string(),
  gradientFrom: z.string(),
  gradientTo: z.string(),
  sortOrder: z.string(),
});

type BannerFormValues = z.infer<typeof bannerFormSchema>;

const EMPTY_FORM: BannerFormValues = {
  eyebrow: '',
  title: '',
  description: '',
  ctaLabel: '',
  gradientFrom: DEFAULT_GRADIENT_FROM,
  gradientTo: DEFAULT_GRADIENT_TO,
  sortOrder: '0',
};

export const AdminBanners = () => {
  const queryClient = useQueryClient();

  const {
    data: banners = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['banners', 'admin'],
    queryFn: fetchAllBanners,
  });

  const { register, handleSubmit, watch, reset } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: EMPTY_FORM,
  });
  const gradientFrom = watch('gradientFrom');
  const gradientTo = watch('gradientTo');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const imagePreview = useObjectUrlPreview(imageFile, existingImageUrl || null);

  const resetForm = () => {
    reset(EMPTY_FORM);
    setEditingId(null);
    setExistingImageUrl('');
    setImageFile(null);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: BannerInput) =>
      editingId !== null
        ? updateBanner(editingId, payload)
        : createBanner(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast.success(
        editingId !== null
          ? '배너가 수정되었습니다.'
          : '배너가 추가되었습니다.',
      );
      resetForm();
    },
    onError: () => toast.error('저장에 실패했습니다.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBanner,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      if (editingId === id) resetForm();
    },
    onError: () => toast.error('삭제에 실패했습니다.'),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      updateBannerActive(id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
    onError: () => toast.error('노출 상태 변경에 실패했습니다.'),
  });

  const onSubmit = async (values: BannerFormValues) => {
    let imageUrl = existingImageUrl || undefined;
    if (imageFile) {
      setIsUploading(true);
      try {
        imageUrl = (await uploadBannerImage(imageFile)).imageUrl;
      } catch {
        toast.error('이미지 업로드에 실패했습니다.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    saveMutation.mutate({
      eyebrow: values.eyebrow.trim(),
      title: values.title.trim(),
      description: values.description.trim(),
      ctaLabel: values.ctaLabel.trim(),
      gradient: buildGradient(values.gradientFrom, values.gradientTo),
      imageUrl,
      sortOrder: Math.max(0, Math.floor(Number(values.sortOrder) || 0)),
      active:
        editingId !== null
          ? (banners.find((b) => b.id === editingId)?.active ?? true)
          : true,
    });
  };

  const onInvalid = (formErrors: FieldErrors<BannerFormValues>) => {
    const firstMessage = Object.values(formErrors)[0]?.message;
    toast.error(
      typeof firstMessage === 'string'
        ? firstMessage
        : '입력값을 확인해주세요.',
    );
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setImageFile(null);
    const { from, to } = parseGradientColors(banner.gradient);
    reset({
      eyebrow: banner.eyebrow,
      title: banner.title,
      description: banner.description,
      ctaLabel: banner.ctaLabel,
      gradientFrom: from,
      gradientTo: to,
      sortOrder: String(banner.sortOrder),
    });
    setExistingImageUrl(banner.imageUrl ?? '');
  };

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>배너 관리</h1>
      </div>

      <form
        className={styles.form}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        noValidate
      >
        <label className={styles.field}>
          작은 라벨(eyebrow)
          <input {...register('eyebrow')} placeholder="예: SEASON OPENING" />
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          제목
          <input
            {...register('title')}
            placeholder="예: 2026 시즌 개막 기념 할인"
          />
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          설명
          <input
            {...register('description')}
            placeholder="예: 내가 응원하는 구단 굿즈, 지금이 기회!"
          />
        </label>
        <label className={styles.field}>
          버튼 문구
          <input {...register('ctaLabel')} placeholder="예: 지금 쇼핑하기" />
        </label>
        <label className={styles.field}>
          배경 시작 색상
          <input type="color" {...register('gradientFrom')} />
        </label>
        <label className={styles.field}>
          배경 끝 색상
          <input type="color" {...register('gradientTo')} />
        </label>
        <div className={styles.field}>
          배경 미리보기
          <div
            className={styles.imagePreview}
            style={{
              background: buildGradient(gradientFrom, gradientTo),
            }}
          />
        </div>
        <label className={styles.field}>
          노출 순서
          <input type="number" min="0" {...register('sortOrder')} />
        </label>
        <label className={`${styles.field} ${styles.fieldWide}`}>
          배너 이미지
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className={styles.field}>
          미리보기
          <div className={styles.imagePreview}>
            <ProductThumb
              imageUrl={imagePreview}
              alt="배너 이미지 미리보기"
              size="lg"
            />
          </div>
        </div>
        <div className={styles.formActions}>
          <Button
            type="submit"
            isLoading={isUploading || saveMutation.isPending}
          >
            {editingId !== null ? '수정 저장' : '배너 추가'}
          </Button>
          {editingId !== null && (
            <Button type="button" variant="secondary" onClick={resetForm}>
              취소
            </Button>
          )}
        </div>
      </form>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : isError ? (
          <p className={`${styles.empty} ${styles.error}`}>
            배너 목록을 불러오지 못했습니다.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>배너</th>
                <th>배경색</th>
                <th>제목</th>
                <th>순서</th>
                <th>노출</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id}>
                  <td>
                    <ProductThumb
                      imageUrl={banner.imageUrl}
                      alt={banner.title}
                      size="sm"
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.3rem',
                        border: '0.05rem solid var(--border)',
                        background: banner.gradient,
                      }}
                    />
                  </td>
                  <td>
                    {banner.eyebrow && (
                      <div className={styles.orderBuyerEmail}>
                        {banner.eyebrow}
                      </div>
                    )}
                    {banner.title}
                  </td>
                  <td>{banner.sortOrder}</td>
                  <td>
                    <Button
                      size="sm"
                      variant={banner.active ? 'outline' : 'secondary'}
                      isLoading={
                        activeMutation.isPending &&
                        activeMutation.variables?.id === banner.id
                      }
                      onClick={() =>
                        activeMutation.mutate({
                          id: banner.id,
                          active: !banner.active,
                        })
                      }
                    >
                      {banner.active ? '노출중' : '숨김'}
                    </Button>
                  </td>
                  <td>
                    <div className={styles.rowActions}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(banner)}
                      >
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={
                          deleteMutation.isPending &&
                          deleteMutation.variables === banner.id
                        }
                        onClick={() => deleteMutation.mutate(banner.id)}
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
        {!isLoading && !isError && banners.length === 0 && (
          <p className={styles.empty}>등록된 배너가 없습니다.</p>
        )}
      </div>
    </>
  );
};
