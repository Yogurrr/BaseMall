import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/Button/Button';
import { Spinner } from '../../components/Spinner/Spinner';
import { SelectFilter } from '../../components/SelectFilter/SelectFilter';
import { Pagination } from '../../components/Pagination/Pagination';
import { QnaDetailModal } from '../../components/QnaDetailModal/QnaDetailModal';
import { fetchAllQnas } from '../../api/qnaApi';
import { QNA_STATUSES } from '../../types/qna';
import type { AdminQna as AdminQnaItem } from '../../types/qna';
import styles from './Admin.module.css';

const STATUS_FILTERS = ['전체', ...QNA_STATUSES];
const QNA_PAGE_SIZE = 10;

export const AdminQna = () => {
  const { data: qnas = [], isLoading, isError } = useQuery({
    queryKey: ['qna', 'admin'],
    queryFn: fetchAllQnas,
  });
  const [statusFilter, setStatusFilter] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedQna, setSelectedQna] = useState<AdminQnaItem | null>(null);
  const [page, setPage] = useState(0);

  const trimmedKeyword = keyword.trim().toLowerCase();
  const filteredQnas = qnas
    .filter((qna) => statusFilter === '전체' || qna.status === statusFilter)
    .filter((qna) => {
      if (!trimmedKeyword) return true;
      const haystack = [`#${qna.id}`, qna.productName, qna.authorName, qna.authorEmail]
        .join(' ')
        .toLowerCase();
      return haystack.includes(trimmedKeyword);
    });

  const totalPages = Math.ceil(filteredQnas.length / QNA_PAGE_SIZE);
  const pagedQnas = filteredQnas.slice(page * QNA_PAGE_SIZE, page * QNA_PAGE_SIZE + QNA_PAGE_SIZE);

  const filterKey = `${statusFilter}|${trimmedKeyword}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(0);
  }

  const pendingCount = qnas.filter((qna) => qna.status === '답변대기').length;

  return (
    <>
      <div className={styles.panelHeader}>
        <h1>상품 Q&A 관리</h1>
      </div>

      <section className={styles.stats}>
        <div className={styles.statCard}>
          <span>전체 질문</span>
          <strong>{qnas.length}건</strong>
        </div>
        <div className={styles.statCard}>
          <span>답변대기</span>
          <strong>{pendingCount}건</strong>
        </div>
      </section>

      <div className={styles.filterBar}>
        <SelectFilter options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
        <input
          type="search"
          className={styles.searchInput}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="질문번호, 상품명, 작성자, 이메일로 검색"
          aria-label="Q&A 검색"
        />
      </div>

      <div className={styles.tableWrap}>
        {isLoading ? (
          <div className={styles.empty}><Spinner /></div>
        ) : isError ? (
          <p className={`${styles.empty} ${styles.error}`}>Q&A 목록을 불러오지 못했습니다.</p>
        ) : qnas.length === 0 ? (
          <p className={styles.empty}>등록된 질문이 없습니다.</p>
        ) : filteredQnas.length === 0 ? (
          <p className={styles.empty}>
            {trimmedKeyword ? `'${keyword}'에 대한 검색 결과가 없습니다.` : `'${statusFilter}' 상태의 질문이 없습니다.`}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>질문번호</th>
                <th>작성자</th>
                <th>상품명</th>
                <th>질문</th>
                <th>작성일시</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagedQnas.map((qna) => (
                <tr key={qna.id}>
                  <td>#{qna.id}</td>
                  <td>
                    {qna.authorName}
                    <div className={styles.orderBuyerEmail}>{qna.authorEmail}</div>
                  </td>
                  <td>{qna.productName}</td>
                  <td>{qna.question}</td>
                  <td>{new Date(qna.createdAt).toLocaleString('ko-KR')}</td>
                  <td>{qna.status}</td>
                  <td>
                    <Button size="sm" variant="outline" onClick={() => setSelectedQna(qna)}>
                      상세보기
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isLoading && !isError && filteredQnas.length > 0 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}

      {selectedQna && <QnaDetailModal qna={selectedQna} onClose={() => setSelectedQna(null)} />}
    </>
  );
};
