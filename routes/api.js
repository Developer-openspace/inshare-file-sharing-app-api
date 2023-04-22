const express=require("express")
const Router=express.Router();
const {
    download,
    show,
    uploadFile,
    sendToEmail,
}=require("../controller/file")

Router.post("/",uploadFile);
Router.post("/send",sendToEmail);
Router.get("/files/download/:uuid",download);
Router.get("/files/:uuid",show);

module.exports=Router