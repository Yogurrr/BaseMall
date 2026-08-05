import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAddToCartModal = () => {
  const navigate = useNavigate();
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);

  const openAddToCartModal = () => setIsAddToCartModalOpen(true);
  const closeAddToCartModal = () => setIsAddToCartModalOpen(false);
  const goToCheckout = () => {
    setIsAddToCartModalOpen(false);
    navigate('/cart');
  };

  return { isAddToCartModalOpen, openAddToCartModal, closeAddToCartModal, goToCheckout };
};
