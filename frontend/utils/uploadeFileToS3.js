require('dotenv').config();
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_KEY,
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});


const uploadFileToS3 = async (file, key, contentType) => {
  try {
    const params = {
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read',
    };

    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully. URL: ${data.Location}`);
    return data.Location;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

module.exports = uploadFileToS3;
