
'use server';

import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import Razorpay from 'razorpay';

export interface ServiceStatus {
    isConfigured: boolean;
    isConnected: boolean;
    error?: string;
    details?: Record<string, string | null>;
}

async function getR2Status(): Promise<ServiceStatus> {
    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME;
    const publicUrlBase = process.env.R2_PUBLIC_URL;

    const isConfigured = !!(endpoint && accessKeyId && secretAccessKey && bucketName && publicUrlBase);

    if (!isConfigured) {
        return {
            isConfigured: false,
            isConnected: false,
            details: {
                Endpoint: endpoint || null,
                'Access Key ID': accessKeyId ? '**********' : null,
                'Bucket Name': bucketName || null,
                'Public URL': publicUrlBase || null,
            }
        };
    }

    try {
        const S3 = new S3Client({
            region: "auto",
            endpoint: endpoint,
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            },
        });
        
        await S3.send(new HeadBucketCommand({ Bucket: bucketName }));
        
        return {
            isConfigured: true,
            isConnected: true,
            details: {
                Endpoint: endpoint,
                'Access Key ID': '**********' + accessKeyId.slice(-4),
                'Bucket Name': bucketName,
                'Public URL': publicUrlBase,
            }
        };

    } catch (error: any) {
        let errorMessage = 'An unknown error occurred.';
        if (error.name === 'NotFound') {
            errorMessage = `Bucket "${bucketName}" not found. Please check your bucket name.`;
        } else if (error.name === 'Forbidden' || error.Code === 'AccessDenied') {
            errorMessage = `Access Denied. Check your R2 Access Key ID, Secret Access Key, and bucket permissions.`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return {
            isConfigured: true,
            isConnected: false,
            error: errorMessage,
            details: {
                Endpoint: endpoint,
                'Access Key ID': '**********' + accessKeyId.slice(-4),
                'Bucket Name': bucketName,
                'Public URL': publicUrlBase,
            }
        };
    }
}


async function getRazorpayStatus(): Promise<ServiceStatus> {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const isConfigured = !!(keyId && keySecret && webhookSecret);

    if (!isConfigured) {
        return {
            isConfigured: false,
            isConnected: false,
            details: {
                'Key ID': keyId ? '**********' : null,
                'Key Secret': keySecret ? '**********' : null,
                'Webhook Secret': webhookSecret ? '**********' : null,
            }
        };
    }

    try {
        const razorpay = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        // Use Promise.all to fetch orders and webhooks concurrently
        const [orders, webhooks] = await Promise.all([
            razorpay.orders.all({ count: 1 }),
            razorpay.webhooks.all()
        ]);
        
        const hasActiveWebhook = webhooks.items.some(hook => hook.active && hook.events.includes('order.paid'));

        return {
            isConfigured: true,
            isConnected: true,
            details: {
                'Key ID': '**********' + keyId.slice(-4),
                'Key Secret': '**********',
                'Webhook Secret': '**********',
                'Webhook Status': hasActiveWebhook ? 'Enabled' : 'Disabled or Not Found'
            }
        };
    } catch (error: any) {
        let errorMessage = 'An unknown error occurred.';
        if (error.statusCode === 401) {
            errorMessage = 'Authentication failed. Your Razorpay Key ID or Key Secret is invalid.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return {
            isConfigured: true,
            isConnected: false,
            error: errorMessage,
            details: {
                'Key ID': '**********' + keyId.slice(-4),
                'Key Secret': '**********',
                'Webhook Secret': '**********',
                'Webhook Status': 'Could not check'
            }
        };
    }
}


export async function getSystemStatus() {
    const [r2, razorpay] = await Promise.all([
        getR2Status(),
        getRazorpayStatus()
    ]);
    
    return { r2, razorpay };
}
