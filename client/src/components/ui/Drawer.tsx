import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './Button';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position?: 'left' | 'right';
  showCloseButton?: boolean;
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  position = 'right',
  showCloseButton = true,
  className,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-80';
      case 'md':
        return 'w-96';
      case 'lg':
        return 'w-[32rem]';
      case 'xl':
        return 'w-[40rem]';
      default:
        return 'w-96';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-0';
      case 'right':
        return 'right-0';
      default:
        return 'right-0';
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      {/* Drawer */}
      <div
        className={clsx(
          'absolute top-0 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out',
          getSizeClasses(),
          getPositionClasses(),
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              {title && (
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              )}
              {showCloseButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="p-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
