import QRCode from "qrcode";

export async function genererQrCode(uuid: string): Promise<string> {
  const urlVerification = `${process.env.APP_URL || 'http://localhost:3000'}/verify/${uuid}`;
  
  const base64 = await QRCode.toDataURL(urlVerification, {
    width: 300,
    margin: 2,
  });

  return base64; // retourne "data:image/png;base64,..."
}