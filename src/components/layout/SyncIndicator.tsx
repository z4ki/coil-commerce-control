import React from 'react';
import { Button } from '../ui/button';
import { Loader2, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useSync } from '@/hooks/use-sync';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

export function SyncIndicator() {
  const { status, syncNow, isPending, pendingItems } = useSync();

  const getStatusIcon = () => {
    if (isPending) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (!status.isOnline) {
      return <CloudOff className="h-4 w-4 text-muted-foreground" />;
    }
    if (status.pendingChanges > 0) {
      return <RefreshCw className="h-4 w-4 text-yellow-500" />;
    }
    return <Cloud className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isPending) return 'Synchronizing...';
    if (!status.isOnline) return 'Offline mode';
    if (status.pendingChanges > 0) {
      return `${status.pendingChanges} changes pending sync`;
    }
    if (status.error) {
      return 'Sync error - click for details';
    }
    return status.lastSynced
      ? `Last synced ${formatDistanceToNow(status.lastSynced, { addSuffix: true })}`
      : 'All synced';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => status.isOnline && syncNow()}
            disabled={!status.isOnline || isPending}
          >
            {getStatusIcon()}
            <span className="hidden md:inline-block text-sm">
              {getStatusText()}
            </span>
            {status.pendingChanges > 0 && (
              <span className="inline-flex items-center justify-center h-5 w-5 text-xs rounded-full bg-yellow-500 text-white">
                {status.pendingChanges}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm space-y-1">
            <p>{status.isOnline ? 'Online mode' : 'Offline mode'}</p>
            {status.lastSynced && (
              <p>
                Last synced:{' '}
                {formatDistanceToNow(status.lastSynced, { addSuffix: true })}
              </p>
            )}
            {status.pendingChanges > 0 && (
              <p>{status.pendingChanges} changes waiting to sync</p>
            )}
            {status.error && (
              <p className="text-red-500">Error: {status.error}</p>
            )}
            {pendingItems.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <p className="font-semibold">Pending changes:</p>
                <ul className="list-disc list-inside">
                  {pendingItems.slice(0, 3).map((item) => (
                    <li key={item.id} className="text-xs truncate">
                      {item.operation} {item.table_name}: {item.id}
                    </li>
                  ))}
                  {pendingItems.length > 3 && (
                    <li className="text-xs">
                      ... and {pendingItems.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
