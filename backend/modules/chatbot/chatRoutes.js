const router=require('express').Router();
const {authenticate,optionalAuthenticate}=require('../../middleware/authMiddleware');
const c=require('./chatController');
router.post('/message',optionalAuthenticate,c.rateLimit,c.send);
router.post('/conversations',authenticate,c.create);
router.get('/conversations',authenticate,c.list);
router.get('/conversations/:id/messages',authenticate,c.messages);
router.delete('/conversations/:id',authenticate,c.remove);
module.exports=router;
