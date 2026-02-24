'use client';

import { useState } from 'react';
import { ClaimModal } from './ClaimModal';

interface ClaimButtonProps {
  itemId: string;
}

export function ClaimButton({ itemId }: ClaimButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full h-14 bg-[#003898] hover:bg-[#002266] text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98]"
      >
        Claim Item
      </button>

      {showModal && (
        <ClaimModal
          itemId={itemId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
