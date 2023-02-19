const fs = require('fs');
const axios = require('axios').default;
const { nanoid } = require('nanoid');
var AWS = require('aws-sdk');
const env = require('../environment');
AWS.config.update({
    region: env.AWS_DEFAULT_REGION,
    accessKeyId: env.AWS_ACCESS_KEY,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  });

const s3 = new AWS.S3({
  accessKeyId: env.AWS_ACCESS_KEY,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY
});

exports.uploadToResumeS3 = (req,res,next) => {
    // Read content from the file
    // let fileName = `${nanoid()}_${req.files.fileName.name}`;
    // const fileContent = req.files.fileName.data;

    const fileContent = fs.createReadStream('');

    // Setting up S3 upload parameters
    const params = {
        Bucket: 'r3sume-bucket',
        Key: `prabhav/Prabhav_Tewari_Resume.pdf`,
        Body: fileContent,
        ContentType: 'application/pdf',
        ACL: 'public-read'
    };

    // Uploading files to the bucket
    s3.upload(params, function(err, data) {
        if (err) {
            throw err;
        }
        console.log(data.Location);
        res.status(200).json({'url' : data.Location});
    });
};

exports.deleteFromResumeS3 = (req,res,next) => {
    // Read content from the file
    let url = req.body.url;
    var Object_key = (url.split("https://r3sume-bucket.s3.ap-south-1.amazonaws.com/").pop());

    var params = {  Bucket: 'r3sume-bucket', Key: Object_key };

    s3.deleteObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);  // error
        res.status(400).json({'error' : "Unable to delete"});
      }
      else     
      {
        console.log(data);
        res.status(200).json({'success' : "Deleted Object"});
      }    
    })
};