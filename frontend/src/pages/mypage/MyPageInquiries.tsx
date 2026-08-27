import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/Button/Button';
import { InquiryForm } from '../../components/InquiryForm/InquiryForm';
import { InquiryListPanel } from '../../components/InquiryListPanel/InquiryListPanel';
import { InquiryDetailModal } from '../../components/InquiryDetailModal/InquiryDetailModal';
import { fetchMyInquiries } from '../../api/inquiryApi';
import type { Inquiry } from '../../types/inquiry';
import styles from './MyPage.module.css';

export const MyPageInquiries = () => {
  const { data: inquiries = [] } = useQuery({
    queryKey: ['inquiries', 'me'],
    queryFn: fetchMyInquiries,
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  return (
    <div className={styles.wishlistSection}>
      <div className={styles.inquiryHeader}>
        {!isFormOpen && (
          <p className={styles.comingSoonTitle}>
            1:1 문의 내역 {inquiries.length}건
          </p>
        )}
        {!isFormOpen && (
          <Button type="button" size="md" onClick={() => setIsFormOpen(true)}>
            문의하기
          </Button>
        )}
      </div>

      {isFormOpen ? (
        <InquiryForm
          onCancel={() => setIsFormOpen(false)}
          onSuccess={() => setIsFormOpen(false)}
        />
      ) : (
        <InquiryListPanel inquiries={inquiries} onSelect={setSelectedInquiry} />
      )}

      {selectedInquiry && (
        <InquiryDetailModal
          inquiry={selectedInquiry}
          mode="user"
          onClose={() => setSelectedInquiry(null)}
        />
      )}
    </div>
  );
};
