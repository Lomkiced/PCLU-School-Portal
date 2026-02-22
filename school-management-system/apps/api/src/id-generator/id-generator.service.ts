import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { JwtService } from '@nestjs/jwt';
import PDFDocument = require('pdfkit');

@Injectable()
export class IdGeneratorService {
    constructor(private jwtService: JwtService) { }

    async generateQRCode(studentId: string): Promise<Buffer> {
        const payload = { studentId, type: 'ATTENDANCE_QR' };
        const token = this.jwtService.sign(payload, {
            secret: process.env.QR_SECRET || 'qr_secret',
            expiresIn: '1y',
        });

        return QRCode.toBuffer(token, {
            errorCorrectionLevel: 'H',
            type: 'png',
            margin: 1,
            width: 300,
        });
    }

    async generateCredentialSlipPdf(name: string, username: string, tempPass: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ size: 'A4', margin: 50 });
                const buffers: Buffer[] = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    resolve(Buffer.concat(buffers));
                });

                doc.fontSize(20).text('School Management System', { align: 'center' });
                doc.moveDown();
                doc.fontSize(16).text('Login Credentials', { align: 'center' });
                doc.moveDown(2);
                doc.fontSize(12).text(`Name: ${name}`);
                doc.text(`Username: ${username}`);
                doc.text(`Temporary Password: ${tempPass}`);
                doc.moveDown();
                doc.text('Please log in and change your password immediately.');

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}
