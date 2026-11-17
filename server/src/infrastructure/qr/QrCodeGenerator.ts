import QRCode from 'qrcode';

/** Turns a ticket code into a QR image (PNG data URL) the browser can show directly. */
export class QrCodeGenerator {
  toDataUrl(content: string): Promise<string> {
    return QRCode.toDataURL(content, { errorCorrectionLevel: 'M', margin: 1, width: 240 });
  }
}
