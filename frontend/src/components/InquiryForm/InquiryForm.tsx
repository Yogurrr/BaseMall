import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../Button/Button';
import { ProductImageUploader } from '../ProductImageUploader/ProductImageUploader';
import { useObjectUrlPreview } from '../../hooks/useObjectUrlPreview';
import { createInquiry, uploadInquiryImage } from '../../api/inquiryApi';
import { fetchMyOrders } from '../../api/orderApi';
import { INQUIRY_CATEGORIES } from '../../types/inquiry';
import styles from './InquiryForm.module.css';

interface InquiryFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const InquiryForm = ({ onCancel, onSuccess }: InquiryFormProps) => {
  const queryClient = useQueryClient();
  const { data: orders = [] } = useQuery({ queryKey: ['orders', 'me'], queryFn: fetchMyOrders });

  const [category, setCategory] = useState<string>(INQUIRY_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [orderId, setOrderId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const imagePreview = useObjectUrlPreview(imageFile, null);

  const createMutation = useMutation({
    mutationFn: createInquiry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'me'] });
      onSuccess();
    },
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    if (!trimmedTitle || !trimmedContent) return;

    let imageUrl: string | undefined;
    if (imageFile) {
      setUploadError(null);
      setIsUploading(true);
      try {
        imageUrl = (await uploadInquiryImage(imageFile)).imageUrl;
      } catch {
        setUploadError('이미지 업로드에 실패했습니다.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    createMutation.mutate({
      category,
      title: trimmedTitle,
      content: trimmedContent,
      imageUrl,
      orderId: orderId ? Number(orderId) : undefined,
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <label className={styles.field}>
          <span>카테고리</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {INQUIRY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>관련 주문(선택)</span>
          <select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
            <option value="">선택 안 함</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                #{order.id} · {new Date(order.createdAt).toLocaleDateString('ko-KR')}
              </option>
            ))}
          </select>
        </label>
      </div>

      <input
        className={styles.titleInput}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        maxLength={200}
        required
      />

      <textarea
        className={styles.textarea}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="문의하실 내용을 입력해주세요."
        maxLength={2000}
        rows={10}
        required
      />

      <div className={styles.attachRow}>
        <span>이미지 첨부(선택)</span>
        <ProductImageUploader imagePreview={imagePreview} onFileChange={setImageFile} />
      </div>

      {uploadError && <p className={styles.error}>{uploadError}</p>}
      {createMutation.isError && <p className={styles.error}>문의 등록에 실패했습니다.</p>}

      <div className={styles.actions}>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" size="sm" isLoading={isUploading || createMutation.isPending}>
          문의 등록
        </Button>
      </div>
    </form>
  );
};
