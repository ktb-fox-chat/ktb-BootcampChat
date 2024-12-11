const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_KEY: process.env.AWS_SECRET_KEY,
  AWS_REGION: process.env.AWS_REGION,
});

const uploadFileToS3 = async (file, key, contentType) => {
  try {
    const params = {
      Bucket: AWS_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'public-read',
    };

    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully. URL: ${data.Location}`);
    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

module.exports = uploadFileToS3;
