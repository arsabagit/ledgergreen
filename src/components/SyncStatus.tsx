import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, RotateCw } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { supabase } from '@/lib/supabase';

export function SyncStatus() {
    const isSyncing = useFinanceStore((state) => state.isSyncing);
    const sync = useFinanceStore((state) => state.sync);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        // Initial check
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            sync(); // Auto-sync when back online
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [sync]);

    if (!isOnline) {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 rounded-full text-xs font-medium border border-gray-200 dark:border-zinc-700">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                Offline
            </div>
        );
    }

    if (isSyncing) {
        return (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-100 dark:border-blue-800">
                <RotateCw className="w-3 h-3 animate-spin" />
                Syncing...
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs font-medium border border-green-100 dark:border-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Synced
        </div>
    );
}
