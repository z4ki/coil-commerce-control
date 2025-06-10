import React from 'react';
import { Button } from './button';
import { useApp } from '@/context/AppContext';
import { Cloud, CloudOff } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/context/LanguageContext';

export function BackupButton() {
  const { isOnline, performBackup, backupInProgress, lastBackup } = useApp();
  const { t } = useLanguage();

  const handleBackup = async () => {
    try {
      await performBackup();
      toast.success(t('settings.backup.success'));
    } catch (error) {
      toast.error(t('settings.backup.error'));
      console.error('Backup failed:', error);
    }
  };

  const getStatusText = () => {
    if (!isOnline) return t('settings.backup.offline');
    if (backupInProgress) return t('settings.backup.inProgress');
    if (lastBackup) {
      const lastBackupDate = new Date(lastBackup);
      return t('settings.backup.lastBackup').replace(
        '{0}',
        lastBackupDate.toLocaleString()
      );
    }
    return t('settings.backup.never');
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleBackup}
        disabled={!isOnline || backupInProgress}
        className="w-full sm:w-auto"
      >
        {isOnline ? (
          <Cloud className="mr-2 h-4 w-4" />
        ) : (
          <CloudOff className="mr-2 h-4 w-4" />
        )}
        {backupInProgress
          ? t('settings.backup.inProgress')
          : t('settings.backup.button')}
      </Button>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {getStatusText()}
      </p>
    </div>
  );
}
