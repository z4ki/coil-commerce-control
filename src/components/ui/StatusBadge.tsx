import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface StatusBadgeProps {
  status: 'paid' | 'unpaid' | 'overdue' | 'invoiced' | 'notInvoiced';
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const { t } = useLanguage();

  const getStatusStyle = () => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'invoiced':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'notInvoiced':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return '';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'paid':
        return t('status.paid');
      case 'unpaid':
        return t('status.unpaid');
      case 'overdue':
        return t('status.overdue');
      case 'invoiced':
        return t('status.invoiced');
      case 'notInvoiced':
        return t('status.notInvoiced');
      default:
        return '';
    }
  };

  return (
    <Badge className={cn(getStatusStyle(), className)} variant="outline">
      {getStatusLabel()}
    </Badge>
  );
};

export default StatusBadge;
