require('dotenv').config();
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY,
  secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_KEY,
  region: process.env.NEXT_PUBLIC_AWS_REGION,
});


const uploadProfileImageToS3 = async (file, key, contentType) => {
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
    console.error('Error profile image uploading file:', error);
    throw error;
  }
};

const uploadFileToS3 = async (file, key, contentType) => {
  const params = {
    Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
    Key: key,
    Body: file,
    ContentType: contentType,
    ACL: 'public-read',
  };

  try {
    const upload = s3.upload(params);
    upload.on('httpUploadProgress', (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted); // 진행률 업데이트
      }
    });
    const data = await upload.promise();
    return data.Location;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

module.exports = {
  uploadProfileImageToS3,
  uploadFileToS3,
};

