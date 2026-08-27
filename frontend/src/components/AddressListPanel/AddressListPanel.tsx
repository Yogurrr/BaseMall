import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../Button/Button';
import { StatusMessage } from '../StatusMessage/StatusMessage';
import { Spinner } from '../Spinner/Spinner';
import {
  deleteAddress,
  fetchMyAddresses,
  saveAddress,
  setDefaultAddress,
  updateAddress,
  type SaveAddressParams,
} from '../../api/addressApi';
import { AddressForm } from './AddressForm';
import styles from './AddressListPanel.module.css';

export const AddressListPanel = () => {
  const queryClient = useQueryClient();
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['addresses', 'me'],
    queryFn: fetchMyAddresses,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const saveMutation = useMutation({
    mutationFn: saveAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', 'me'] });
      setIsFormOpen(false);
      toast.success('배송지가 등록되었습니다.');
    },
    onError: () =>
      toast.error('배송지를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, params }: { id: number; params: SaveAddressParams }) =>
      updateAddress(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', 'me'] });
      setIsFormOpen(false);
      setEditingId(null);
      toast.success('배송지가 수정되었습니다.');
    },
    onError: () =>
      toast.error('배송지를 수정하지 못했습니다. 잠시 후 다시 시도해주세요.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: (updated) => {
      queryClient.setQueryData(['addresses', 'me'], updated);
    },
    onError: () => toast.error('배송지를 삭제하지 못했습니다.'),
  });

  const defaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', 'me'] });
    },
    onError: () => toast.error('기본 배송지 설정에 실패했습니다.'),
  });

  const openForm = () => {
    setEditingId(null);
    setIsFormOpen(true);
  };

  const openEditForm = (id: number) => {
    setEditingId(id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleFormSubmit = (params: SaveAddressParams) => {
    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, params });
    } else {
      saveMutation.mutate(params);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('이 배송지를 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner />
      </div>
    );
  }

  const editingAddress =
    editingId !== null
      ? addresses.find((item) => item.id === editingId)
      : undefined;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <p className={styles.count}>저장된 배송지 {addresses.length}개</p>
        {!isFormOpen && (
          <Button type="button" size="md" onClick={openForm}>
            새 배송지 추가
          </Button>
        )}
      </div>

      {isFormOpen && (
        <AddressForm
          key={editingId ?? 'new'}
          initialAddress={editingAddress}
          isEditing={editingId !== null}
          isSubmitting={saveMutation.isPending || updateMutation.isPending}
          onCancel={closeForm}
          onSubmit={handleFormSubmit}
        />
      )}

      {addresses.length === 0 ? (
        <div className={styles.empty}>
          <StatusMessage icon="📦">저장된 배송지가 없습니다.</StatusMessage>
        </div>
      ) : (
        <ul className={styles.list}>
          {addresses.map((item) => (
            <li key={item.id} className={styles.card}>
              <div className={styles.info}>
                <div className={styles.titleRow}>
                  {item.label && (
                    <span className={styles.labelBadge}>{item.label}</span>
                  )}
                  <span className={styles.recipient}>{item.recipientName}</span>
                  {item.isDefault && (
                    <span className={styles.defaultBadge}>기본 배송지</span>
                  )}
                </div>
                <p className={styles.phone}>{item.recipientPhone}</p>
                <p className={styles.address}>
                  ({item.zipCode}) {item.address} {item.addressDetail}
                </p>
              </div>
              <div className={styles.cardActions}>
                {!item.isDefault && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    isLoading={
                      defaultMutation.isPending &&
                      defaultMutation.variables === item.id
                    }
                    onClick={() => defaultMutation.mutate(item.id)}
                  >
                    기본으로 설정
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => openEditForm(item.id)}
                >
                  수정
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  isLoading={
                    deleteMutation.isPending &&
                    deleteMutation.variables === item.id
                  }
                  onClick={() => handleDelete(item.id)}
                >
                  삭제
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
