const express = require('express');
const router = express.Router();

const { runDetect, uploadImageForm, uploadFile, viewImages } = require('../controllers/detect')

router.get('/detect', runDetect );
router.get('/uploadimage', uploadImageForm );
router.get('/viewImages', viewImages );
router.post('/uploadFile', uploadFile );

module.exports = router;
