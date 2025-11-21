import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const uploadFileToS3 = async (file: any, folder: string): Promise<string> => {
  if (!process.env.AWS_S3_BUCKET) {
      console.warn("AWS_S3_BUCKET não definido. Upload simulado.");
      return `https://fake-s3-url.com/${file.originalname}`;
  }

  const fileName = `${folder}/${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    await s3Client.send(command);
    return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${fileName}`;
  } catch (error) {
    console.error("Erro S3:", error);
    throw new Error("Falha no upload para S3.");
  }
};