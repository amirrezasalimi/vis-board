import React, { useEffect, useRef, type ReactNode, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children: ReactNode;
}

const modalStack: (() => void)[] = [];

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  size = "md",
  className = "",
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      if (modalStack.length > 0) {
        const topModalClose = modalStack[modalStack.length - 1];
        topModalClose();
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      modalStack.push(onClose);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      const index = modalStack.indexOf(onClose);
      if (index > -1) {
        modalStack.splice(index, 1);
      }
    };
  }, [isOpen, onClose, handleEscape]);

  if (!isOpen) return null;

  const sizeClasses: Record<"sm" | "md" | "lg" | "xl", string> = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="z-50 absolute inset-0 flex justify-center items-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg w-full shadow-lg ${sizeClasses[size]} ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
