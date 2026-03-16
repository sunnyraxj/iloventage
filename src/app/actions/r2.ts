
'use server';

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrlBase = process.env.R2_PUBLIC_URL;

const isR2Configured = !!(endpoint && accessKeyId && secretAccessKey && bucketName && publicUrlBase);

let S3: S3Client | null = null;
if (isR2Configured) {
    S3 = new S3Client({
        region: "auto",
        endpoint: endpoint!,
        credentials: {
            accessKeyId: accessKeyId!,
            secretAccessKey: secretAccessKey!,
        },
    });
}

const generateFileName = (bytes = 16) => crypto.randomBytes(bytes).toString("hex");

export async function getR2SignedURL({ fileType, fileSize, extension }: { fileType: string; fileSize: number, extension: string }) {
    if (!S3 || !isR2Configured) {
        return { failure: { message: "Cloudflare R2 is not configured on the server." } };
    }
    
    const key = `${generateFileName()}.${extension}`;

    try {
        const signedUrl = await getSignedUrl(
            S3,
            new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: fileType, ContentLength: fileSize }),
            { expiresIn: 60 * 5 } // 5 minutes
        );

        const publicUrl = `${publicUrlBase}/${key}`;
        
        return { success: { signedUrl, publicUrl, key } };

    } catch (error) {
        console.error("Error generating signed R2 URL:", error);
        return { failure: { message: "Could not generate upload URL." } };
    }
}

export async function deleteR2Object(key: string) {
    if (!S3 || !isR2Configured) {
        return { failure: { message: "Cloudflare R2 is not configured on the server." } };
    }
    try {
        await S3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
        return { success: true };
    } catch (error) {
        console.error("Failed to delete R2 object:", error);
        return { failure: { message: "Failed to delete from R2." } };
    }
}

export async function getR2ConfigStatus() {
    return { isConfigured: isR2Configured, bucketName: bucketName || null };
}
