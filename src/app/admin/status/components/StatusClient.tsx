
'use client';

import { useEffect, useState } from 'react';
import { getSystemStatus, type ServiceStatus } from '@/app/actions/status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Cloud, CreditCard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type StatusState = {
    r2: ServiceStatus | null;
    razorpay: ServiceStatus | null;
};

const StatusSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
        </Card>
        <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    </div>
);

const ServiceStatusCard = ({ title, icon, status }: { title: string, icon: React.ReactNode, status: ServiceStatus | null }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    {icon}
                    <span>{title}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                    <p className="font-medium">Configuration:</p>
                    {status?.isConfigured ? (
                        <Badge variant="success">Configured</Badge>
                    ) : (
                        <Badge variant="destructive">Not Configured</Badge>
                    )}
                </div>

                {status?.isConfigured && (
                    <div className="flex items-center gap-2">
                        <p className="font-medium">Connection:</p>
                        {status.isConnected ? (
                            <Badge variant="success" className="gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Connected
                            </Badge>
                        ) : (
                            <Badge variant="destructive" className="gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Failed
                            </Badge>
                        )}
                    </div>
                )}
                
                {status?.details && (
                    <div>
                        <p className="text-sm font-medium mb-2">Details:</p>
                        <div className="text-xs space-y-1 rounded-md border p-3 bg-secondary/50">
                            {Object.entries(status.details).map(([key, value]) => (
                                <div key={key} className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">{key}:</span>
                                    <span className="font-mono text-right break-all">{value ?? <span className="text-destructive font-sans font-medium">NOT SET</span>}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                 {status?.isConfigured === false && (
                    <Alert variant="destructive" className="text-xs">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Action Required</AlertTitle>
                        <AlertDescription>
                            One or more environment variables for this service are missing. Please add them in your hosting provider's settings.
                        </AlertDescription>
                    </Alert>
                )}

                {status?.error && (
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Connection Error</AlertTitle>
                        <AlertDescription>
                           {status.error}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};


export function StatusClient() {
    const [status, setStatus] = useState<StatusState>({ r2: null, razorpay: null });
    const [loading, setLoading] = useState(true);

    const checkStatus = async () => {
        setLoading(true);
        const systemStatus = await getSystemStatus();
        setStatus(systemStatus);
        setLoading(false);
    };

    useEffect(() => {
        checkStatus();
    }, []);

    if (loading && !status.r2) {
        return <StatusSkeleton />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={checkStatus} disabled={loading} variant="outline">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Refresh Status
                </Button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <ServiceStatusCard title="Cloudflare R2" icon={<Cloud />} status={status.r2} />
                <ServiceStatusCard title="Razorpay" icon={<CreditCard />} status={status.razorpay} />
            </div>
        </div>
    );
}
