const express = require("express");
const AWS = require("aws-sdk");

// Create express app
const app = express();
const PORT = process.env.PORT || 8080;

// AWS S3 config
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: "v4",
});

// endpoint to check if API is live
app.get("/", (req, res) => {
  return res.status(200).send("API is live! 🎉😎");
});

// Generate single presigned url to upload file
app.post("/generate-single-presigned-url",async(req,res)=>{
  try{

    const fileName = req.body.fileName;
    const fileType = req.body.fileType;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Expires: 60, // Expires in 60 seconds
      ContentType: fileType,
      ACL: "bucket-owner-full-control",
    };
  
    return s3.getSignedUrl("putObject", params);

  }catch(err){
    console.log(err)
    return res.status(500).json({ error: "Error generating presigned URL" });
  }
   
})


// endpoint to start multipart upload
app.post("/start-multipart-upload", async (req, res) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: req.body.fileName,
  };

  // add extra params if content type is video
  if (req.body.contentType == "VIDEO") {
    params.ContentDisposition = "inline";
    params.ContentType = "video/mp4";
  }

  try {
    const multipart = await s3.createMultipartUpload(params).promise();
    res.json({ uploadId: multipart.UploadId });
  } catch (error) {
    console.error("Error starting multipart upload:", error);
    return res.status(500).json({ error: "Error starting multipart upload" });
  }
});

// Generate presigned url for each multiparts
app.post("/generate-presigned-url", async (req, res) => {
  // get values from req body
  const { fileName, uploadId, partNumbers } = req.body;
  const totalParts = Array.from({ length: partNumbers }, (_, i) => i + 1);
  try {
    const presignedUrls = await Promise.all(
      totalParts.map(async (partNumber) => {
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: fileName,
          PartNumber: partNumber,
          UploadId: uploadId,
          Expires: 3600 * 3,
        };

        return s3.getSignedUrl("uploadPart", {
          ...params,
        });
      })
    );
    res.json({ presignedUrls });
  } catch (error) {
    console.error("Error generating pre-signed URLs:", error);
    return res.status(500).json({ error: "Error generating pre-signed URLs" });
  }
});

// Complete multipart upload
app.post("/complete-multipart-upload", async (req, res) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: req.body.fileName,
    UploadId: req.body.uploadId,

    MultipartUpload: {
      Parts: req.body.parts.map((part, index) => ({
        ETag: part.etag,
        PartNumber: index + 1,
      })),
    },
  };
  try {
    const data = await s3.completeMultipartUpload(params).promise();
    res.status(200).json({ fileData: data });
  } catch (error) {
    console.error("Error completing multipart upload:", error);
    return res.status(500).json({ error: "Error completing multipart upload" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} - http://localhost:${PORT}`);
});
