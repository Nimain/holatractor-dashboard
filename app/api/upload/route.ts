import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

// Ensure AWS credentials are loaded from .env if not yet in process.env
function getAwsCredentials() {
  let accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  let region = process.env.AWS_REGION || "us-west-2";
  let bucketName = process.env.AWS_S3_BUCKET_NAME || "holadashboard";

  if (!accessKeyId || !secretAccessKey) {
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, "utf8").split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
            const idx = trimmed.indexOf("=");
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
            if (key === "AWS_ACCESS_KEY_ID" && !accessKeyId) accessKeyId = val;
            if (key === "AWS_SECRET_ACCESS_KEY" && !secretAccessKey) secretAccessKey = val;
            if (key === "AWS_REGION" && !process.env.AWS_REGION) region = val;
            if (key === "AWS_S3_BUCKET_NAME" && !process.env.AWS_S3_BUCKET_NAME) bucketName = val;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to read .env for AWS credentials:", e);
    }
  }

  return { accessKeyId, secretAccessKey, region, bucketName };
}

export async function POST(req: NextRequest) {
  try {
    const { accessKeyId, secretAccessKey, region, bucketName } = getAwsCredentials();

    if (!accessKeyId || !secretAccessKey) {
      console.error("AWS credentials missing on server");
      return NextResponse.json(
        { error: "AWS credentials not configured on server" },
        { status: 500 }
      );
    }

    let fileBuffer: Buffer | null = null;
    let fileName = `file-${Date.now()}.jpg`;
    let contentType = "image/jpeg";

    const contentTypeHeader = req.headers.get("content-type") || "";

    if (contentTypeHeader.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileName = file.name || fileName;
      contentType = file.type || contentType;
    } else {
      // JSON payload containing base64 data
      const json = await req.json();
      if (json.data) {
        // Base64 string, potentially with data URL prefix
        const base64Data = json.data.replace(/^data:([A-Za-z-+\/]+);base64,/, "");
        fileBuffer = Buffer.from(base64Data, "base64");
        if (json.fileName) fileName = json.fileName;
        if (json.contentType) contentType = json.contentType;
      } else {
        return NextResponse.json({ error: "Invalid upload payload" }, { status: 400 });
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: "Empty file payload" }, { status: 400 });
    }

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueFileName = `${Date.now()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const fileUrl = `https://${bucketName}.s3.amazonaws.com/${uniqueFileName}`;
    console.log("✅ Successfully uploaded to S3:", fileUrl);

    return NextResponse.json({ success: true, url: fileUrl }, { status: 200 });
  } catch (error: any) {
    console.error("❌ S3 upload error in /api/upload:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        detail: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
