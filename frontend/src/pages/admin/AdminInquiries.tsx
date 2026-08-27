import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import { SelectFilter } from '../../components/SelectFilter/SelectFilter';
import { Pagination } from '../../components/Pagination/Pagination';
import { InquiryDetailModal } from '../../components/InquiryDetailModal/InquiryDetailModal';
import { fetchAllInquiries } from '../../api/inquiryApi';
import { INQUIRY_STATUSES } from '../../types/inquiry';
import type { AdminInquiry } from '../../types/inquiry';
import { formatDateTime } from '../../utils/formatDate';
import styles from './Admin.module.css';

const STATUS_FILTERS = ['전체', ...INQUIRY_STATUSES];
const INQUIRIES_PAGE_SIZE = 10;

export const AdminInquiries = () => {
  const {
    data: inquiries = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['inquiries', 'admin'],
    queryFn: fetchAllInquiries,
  });
  const [statusFilter, setStatusFilter] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiry | null>(
    null,
  );
  const [page, setPage] = useState(0);

  const trimmedKeyword = keyword.trim().toLowerCase();
  const filteredInquiries = inquiries
    .filter(
      (inquiry) => statusFilter === '전체' || inquiry.status === statusFilter,
    )
    .filter((inquiry) => {
      if (!trimmedKeyword) return true;
      const haystack = [
        `#${inquiry.id}`,
        inquiry.title,
        inquiry.authorName,
        inquiry.authorEmail,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(trimmedKeyword);
    });

  const totalPages = Math.ceil(filteredInquiries.length / INQUIRIES_PAGE_SIZE);
  const pagedInquiries = filteredInquiries.slice(
    page * INQUIRIES_PAGE_SIZE,
    page * INQUIRIES_PAGE_SIZE + INQUIRIES_PAGE_SIZE,
  );

  const filterKey = `${statusFilter}|${trimmedKeyword}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(0);
  }

  const pendingCount = inquiries.filter(
    (inquiry) => inquiry.status === '답변대기',
  ).length;

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>문의 관리</h1>
      </div>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>전체 문의</span>
          <strong>{inquiries.length}건</strong>
        </div>
        <div className={styles.statCard}>
          <span>답변대기</span>
          <strong>{pendingCount}건</strong>
        </div>
      </section>

      <div className={styles.filterBar}>
        <SelectFilter
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <input
          type="search"
          className={styles.searchInput}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="문의번호, 제목, 작성자, 이메일로 검색"
          aria-label="문의 검색"
        />
      </div>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}>
            <Spinner />
          </div>
        ) : isError ? (
          <p className={`${styles.empty} ${styles.error}`}>
            문의 목록을 불러오지 못했습니다.
          </p>
        ) : inquiries.length === 0 ? (
          <p className={styles.empty}>문의 내역이 없습니다.</p>
        ) : filteredInquiries.length === 0 ? (
          <p className={styles.empty}>
            {trimmedKeyword
              ? `'${keyword}'에 대한 검색 결과가 없습니다.`
              : `'${statusFilter}' 상태의 문의가 없습니다.`}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>문의번호</th>
                <th>작성자</th>
                <th>카테고리</th>
                <th>제목</th>
                <th>작성일시</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedInquiries.map((inquiry) => (
                <tr key={inquiry.id}>
                  <td>#{inquiry.id}</td>
                  <td>
                    {inquiry.authorName}
                    <div className={styles.orderBuyerEmail}>
                      {inquiry.authorEmail}
                    </div>
                  </td>
                  <td>{inquiry.category}</td>
                  <td>{inquiry.title}</td>
                  <td>{formatDateTime(inquiry.createdAt)}</td>
                  <td>{inquiry.status}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedInquiry(inquiry)}
                    >
                      상세보기
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !isError && filteredInquiries.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}

      {selectedInquiry && (
        <InquiryDetailModal
          inquiry={selectedInquiry}
          mode="admin"
          onClose={() => setSelectedInquiry(null)}
        />
      )}
    </>
  );
};
