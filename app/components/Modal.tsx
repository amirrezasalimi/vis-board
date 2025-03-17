interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center">
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />
      <div className="z-50 relative bg-white shadow-lg p-6 border border-[#ffc885]/30 rounded-lg">
        {children}
      </div>
    </div>
  );
};
