import { useSync } from '../../hooks/use-sync';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function SyncStatus() {
  const { status, syncNow, isPending } = useSync();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <div 
          className={cn(
            "w-2 h-2 rounded-full",
            status.isOnline ? "bg-green-500" : "bg-red-500"
          )}
        />
        <span className="text-sm text-muted-foreground">
          {status.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {status.lastSynced && (
        <span className="text-sm text-muted-foreground">
          Last synced {formatDistanceToNow(status.lastSynced, { addSuffix: true })}
        </span>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => syncNow()}
        disabled={!status.isOnline || isPending}
        className="ml-2"
      >
        <RefreshCw 
          className={cn(
            "h-4 w-4",
            isPending && "animate-spin"
          )}
        />
      </Button>
    </div>
  );
}
