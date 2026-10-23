import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function uploadFileToS3(file: Buffer, fileName: string): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME || "holadashboard";
  const uniqueFileName = `${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueFileName,
    Body: file,
    ContentType: "image/jpg",
  });

  await s3Client.send(command);

  const fileUrl = `https://${bucketName}.s3.amazonaws.com/${uniqueFileName}`;
  return fileUrl;
}