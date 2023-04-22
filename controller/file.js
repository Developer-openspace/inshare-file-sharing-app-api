const sendMail = require('../services/mailService');
const File = require('../models/file');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');

const download=async(req,res)=>{
    // Extract link and get file from storage send download stream 
    const file = await File.findOne({ uuid: req.params.uuid });
    // Link expired
    if(!file) {
         return res.render('download', { error: 'Link has been expired.'});
    } 
    const response = await file.save();
    const filePath = `${__dirname}/../${file.path}`;
    res.download(filePath);
}

const show=async(req,res)=>{
    try {
        const file = await File.findOne({ uuid: req.params.uuid });
        // Link expired
        if(!file) {
            return res.render('download', { error: 'Link has been expired.'});
        } 
        return res.render('download', { uuid: file.uuid, fileName: file.filename, fileSize: file.size, downloadLink: `${process.env.APP_BASE_URL}/files/download/${file.uuid}` });
    } catch(err) {
        return res.render('download', { error: 'Something went wrong.'});
    }
}

let storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/') ,
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
              cb(null, uniqueName)
    } ,
});
let upload = multer({ storage, limits:{ fileSize: 1000000 * 100 }, }).single('myfile'); //100mb
const uploadFile=async(req,res)=>{
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).send({ error: err.message });
      }
        const file = new File({
            filename: req.file.filename,
            uuid: uuidv4(),
            path: req.file.path,
            size: req.file.size
        });
        const response = await file.save();
        res.json({ file: `${process.env.APP_BASE_URL}/files/${response.uuid}` });
      });
}

const sendToEmail=async(req,res)=>{
    const { uuid, emailTo, emailFrom, expiresIn } = req.body;
    if(!uuid || !emailTo || !emailFrom) {
        return res.status(422).send({ error: 'All fields are required except expiry.'});
    }
    // Get data from db 
    try {
        const file = await File.findOne({ uuid: uuid });
        if(file.sender) {
            return res.status(422).send({ error: 'Email already sent once.'});
        }
        file.sender = emailFrom;
        file.receiver = emailTo;
        const response = await file.save();
        // send mail
        sendMail({
        from: emailFrom,
        to: emailTo,
        subject: 'inShare file sharing',
        text: `${emailFrom} shared a file with you.`,
        html: require('../services/emailTemplate')({
                    emailFrom, 
                    downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}?source=email` ,
                    size: parseInt(file.size/1000) + ' KB',
                    expires: '24 hours'
                })
        }).then(() => {
            return res.json({success: true});
        }).catch(err => {
            return res.status(500).json({error: 'Error in email sending.'});
        });
    } catch(err) {
        return res.status(500).send({ error: 'Something went wrong.'});
    }
}

module.exports={
    download,
    show,
    uploadFile,
    sendToEmail,
}
 