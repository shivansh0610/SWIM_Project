const fs = require('fs');
const axios = require('axios').default;
const { nanoid } = require('nanoid');
var AWS = require('aws-sdk');
const util = require('util');
const path = require('path');
const exec = util.promisify(require('child_process').exec);
const env = require('../environment');
const { Console } = require('console');
AWS.config.update({
    region: env.AWS_DEFAULT_REGION,
    accessKeyId: env.AWS_ACCESS_KEY,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  });

const docClient = new AWS.DynamoDB.DocumentClient();

const s3 = new AWS.S3({
  accessKeyId: env.AWS_ACCESS_KEY,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY
});

exports.runDetect = async (req,res,next) => {
    const { stdout, stderr } = await exec('cd ../yolov5 && python detect.py --weights runs/train/Trained_SolidWaste2/weights/best.pt --source g1.jpg --conf 0.2 --name g1 --save-txt --save-conf');
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);
    res.status(200).json({'success' : stderr});
};

exports.viewImages = async (req,res,next) => {
  let scanParams = {
    TableName : "SWIM_Uploads",
    ScanIndexForward : false,
    KeyConditionExpression : "pk = :a",
    ExpressionAttributeValues : {
      ':a' : "SWIM_Upload"
    }
  }
  try {
    let data = await docClient.query(scanParams).promise();
    res.render('images',{images : data.Items});
  }
  catch(err)
  {
    res.status(200).json({err : err});
  }
};

exports.uploadImageForm = async (req,res,next) => {
  res.render('upload');
};

exports.uploadFile = async (req,res,next) => {
  console.log(req.files);
  let targetFile = req.files['file-upload'];
  console.log(targetFile)

  //mv(path, CB function(err))
  targetFile.mv(path.join(__dirname,"..","..","yolov5","data","images",targetFile.name), async (err) => {
      if (err)
          return res.status(500).send(err);
      else {
        // Setting up S3 upload parameters
        const params = {
            Bucket: 'swim-detect-images',
            Key: Date.now().toString()+targetFile.name,
            Body: targetFile.data,
            ContentType: targetFile.mimetype,
            ACL: 'public-read'
        };

        // Uploading files to the bucket
        s3.upload(params, async function(err, data) {
            if (err) {
                throw err;
            }
            // console.log(data.Location);
            else {
              let original_URL = data.Location;
              let tmnow = Date.now().toString();
              const { stdout, stderr } = await exec(`cd ../yolov5 && python detect.py --weights runs/train/Trained_SWIM/weights/best.pt --source data/images/"${targetFile.name}" --name "${tmnow+targetFile.name}" --save-txt --save-conf`);
              // console.log('stdout:', stdout);
              // console.error('stderr:', stderr);
              const fileContent = fs.createReadStream(path.join(__dirname,"..","..","yolov5","runs","detect",tmnow+targetFile.name,targetFile.name));
              // Setting up S3 upload parameters
                const params = {
                  Bucket: 'swim-inference-images',
                  Key: Date.now().toString()+targetFile.name,
                  Body: fileContent,
                  ContentType: targetFile.mimetype,
                  ACL: 'public-read'
              };

              // Uploading files to the bucket
              s3.upload(params, async function(err, data) {
                  if (err) {
                      throw err;
                  }
                  else {
                    // console.log(data.Location);
                    let detected_URL = data.Location;
                    let createParams = {
                      TableName: "SWIM_Uploads",
                      Item: {
                        pk : "SWIM_Upload",
                        timestamp : Date.now().toString(),
                        original_URL : original_URL,
                        detected_URL : detected_URL,
                        filename : targetFile.name,
                      },
                    };
                    try { 
                      await docClient.put(createParams).promise();
                      res.redirect('/detect/viewImages');
                    }
                    catch(err) {
                      res.status(200).json({err : err});
                    }
                  }
              });
            }
        });
      }
  });
};