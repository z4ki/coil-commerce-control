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

export function SyncIndicator() {
  const { status, syncChanges, isPending, pendingItems } = useSync();

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
    return 'All changes synced';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => status.pendingChanges > 0 && syncChanges()}
            disabled={isPending || (!status.isOnline && status.pendingChanges === 0)}
            className={
              status.error 
                ? 'text-destructive' 
                : status.pendingChanges > 0 
                  ? 'text-yellow-500' 
                  : ''
            }
          >
            {getStatusIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getStatusText()}</p>
          {status.lastSyncedAt && (
            <p className="text-xs text-muted-foreground">
              Last synced: {status.lastSyncedAt.toLocaleTimeString()}
            </p>
          )}
          {status.error && (
            <p className="text-xs text-destructive">
              Error: {status.error}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
