import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class FileUploadService {
    private s3: S3Client;
    private readonly bucketName = 'sms-bucket';

    constructor() {
        this.s3 = new S3Client({
            region: 'us-east-1',
            endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
            credentials: {
                accessKeyId: process.env.MINIO_ACCESS_KEY || 'minio_user',
                secretAccessKey: process.env.MINIO_SECRET_KEY || 'minio_pass',
            },
            forcePathStyle: true,
        });
    }

    async uploadFile(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
        try {
            await this.s3.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: filename,
                    Body: buffer,
                    ContentType: mimetype,
                })
            );
            return filename;
        } catch (error) {
            console.error('S3 Upload Error:', error);
            throw new InternalServerErrorException('File upload failed');
        }
    }

    async getPresignedUrl(filename: string): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: filename,
            });
            return await getSignedUrl(this.s3, command, { expiresIn: 3600 });
        } catch (error) {
            throw new InternalServerErrorException('Could not generate presigned URL');
        }
    }
}
