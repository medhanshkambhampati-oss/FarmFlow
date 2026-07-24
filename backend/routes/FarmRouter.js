const express = require('express')
const verify = require('../middleware/jwtverification')
const {addfarm,cp,uptval,gafbyid,gfbid,dfbid,yp} = require('../controller/FarmController')
const router = express.Router();

router.post('/addfarm',verify,addfarm);
router.get('/getallfarmsbyid',verify,gafbyid)
router.get('/getsinglefarm/:id',verify,gfbid)
router.post('/cp',verify,cp);
router.post('/yp',verify,yp);
router.patch('/updatefarm',verify,uptval)
router.delete("/deletebyid",verify,dfbid);

module.exports = router;