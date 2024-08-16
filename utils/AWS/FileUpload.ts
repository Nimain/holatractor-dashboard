import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
    region: "us-west-2",
    credentials: {
      accessKeyId: "AKIA4CU4DUD4YUI5TMNJ",
      secretAccessKey: "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"
    }
  })

  export async function uploadFileToS3(file: Buffer, fileName: string): Promise<string> {
    const uniqueFileName = `${Date.now()}-${fileName}`
    const command = new PutObjectCommand({
      Bucket: "holadashboard",
      Key: uniqueFileName,
      Body: file,
      ContentType: "image/jpg",
    })
  
    await s3Client.send(command)
  
    const fileUrl = `https://${"holadashboard"}.s3.amazonaws.com/${uniqueFileName}`
    return fileUrl
  }