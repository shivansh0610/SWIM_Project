const express = require('express');
const router = express.Router();

const { uploadToResumeS3, deleteFromResumeS3 } = require('../controllers/s3')

router.get('/uploadS3', uploadToResumeS3 );
router.post('/deleteS3', deleteFromResumeS3 );

module.exports = router;
