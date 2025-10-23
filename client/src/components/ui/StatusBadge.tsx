import React from 'react';
import { clsx } from 'clsx';
import { FlightStatus, TicketStatus, AircraftStatus } from '../../types';

interface StatusBadgeProps {
  status: FlightStatus | TicketStatus | AircraftStatus | string;
  type?: 'flight' | 'ticket' | 'aircraft';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
}) => {
  const getStatusClasses = (status: string) => {
    switch (status) {
      // Flight statuses
      case FlightStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case FlightStatus.BOARDING:
        return 'bg-yellow-100 text-yellow-800';
      case FlightStatus.DEPARTED:
        return 'bg-green-100 text-green-800';
      case FlightStatus.ARRIVED:
        return 'bg-emerald-100 text-emerald-800';
      case FlightStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case FlightStatus.DELAYED:
        return 'bg-orange-100 text-orange-800';
      
      // Ticket statuses
      case TicketStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case TicketStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case TicketStatus.USED:
        return 'bg-gray-100 text-gray-800';
      case TicketStatus.REFUNDED:
        return 'bg-purple-100 text-purple-800';
      
      // Aircraft statuses
      case AircraftStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case AircraftStatus.MAINTENANCE:
        return 'bg-yellow-100 text-yellow-800';
      case AircraftStatus.RETIRED:
        return 'bg-gray-100 text-gray-800';
      
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <span
      className={clsx(
        'status-badge',
        getStatusClasses(status),
        className
      )}
    >
      {formatStatus(status)}
    </span>
  );
};
