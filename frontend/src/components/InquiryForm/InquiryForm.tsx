import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '../Button/Button';
import { ProductImageUploader } from '../ProductImageUploader/ProductImageUploader';
import { useObjectUrlPreview } from '../../hooks/useObjectUrlPreview';
import { createInquiry, uploadInquiryImage } from '../../api/inquiryApi';
import { fetchMyOrders } from '../../api/orderApi';
import { INQUIRY_CATEGORIES } from '../../types/inquiry';
import { formatDate } from '../../utils/formatDate';
import styles from './InquiryForm.module.css';

const inquirySchema = z.object({
  category: z.string(),
  title: z.string().trim().min(1, '제목을 입력해주세요.').max(200),
  content: z.string().trim().min(1, '내용을 입력해주세요.').max(2000),
  orderId: z.string(),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

interface InquiryFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const InquiryForm = ({ onCancel, onSuccess }: InquiryFormProps) => {
  const queryClient = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ['orders', 'me'],
    queryFn: fetchMyOrders,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const imagePreview = useObjectUrlPreview(imageFile, null);

  const { register, handleSubmit } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      category: INQUIRY_CATEGORIES[0],
      title: '',
      content: '',
      orderId: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: createInquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'me'] });
      toast.success('문의가 등록되었습니다.');
      onSuccess();
    },
    onError: () => toast.error('문의 등록에 실패했습니다.'),
  });

  const onSubmit = async (values: InquiryFormValues) => {
    let imageUrl: string | undefined;
    if (imageFile) {
      setIsUploading(true);
      try {
        imageUrl = (await uploadInquiryImage(imageFile)).imageUrl;
      } catch {
        toast.error('이미지 업로드에 실패했습니다.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    createMutation.mutate({
      category: values.category,
      title: values.title.trim(),
      content: values.content.trim(),
      imageUrl,
      orderId: values.orderId ? Number(values.orderId) : undefined,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className={styles.row}>
        <label className={styles.field}>
          <span>카테고리</span>
          <select {...register('category')}>
            {INQUIRY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>관련 주문(선택)</span>
          <select {...register('orderId')}>
            <option value="">선택 안 함</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                #{order.id} · {formatDate(order.createdAt)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <input
        className={styles.titleInput}
        {...register('title')}
        placeholder="제목을 입력하세요"
        maxLength={200}
      />

      <textarea
        className={styles.textarea}
        {...register('content')}
        placeholder="문의하실 내용을 입력해주세요."
        maxLength={2000}
        rows={10}
      />

      <div className={styles.attachRow}>
        <span>이미지 첨부(선택)</span>
        <ProductImageUploader
          imagePreview={imagePreview}
          onFileChange={setImageFile}
        />
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button
          type="submit"
          size="sm"
          isLoading={isUploading || createMutation.isPending}
        >
          문의 등록
        </Button>
      </div>
    </form>
  );
};
