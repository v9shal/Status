const express=require('express');
const  router=express.Router();
const { createSubscriber, confirmSubscriber, deleteSubscriber } = require('../services/subscriberService');
router.post('/subscriber',(req,res)=>{
   const {email,service_id}=req.body;
    if(!email || !service_id){
        return res.status(400).json({error:"Email and service ID are required"});
    }
    createSubscriber(email,service_id).then(subscriber=>{
        res.status(201).json(subscriber);
    }).catch(err=>{
        console.error(err);
        res.status(500).json({error:"Failed to create subscriber"});
    })
})

router.get('/subscriber/confirm',(req,res)=>{
    const {token}=req.query;
    if(!token){
        return res.status(400).json({error:"Token is required"});
    }
    confirmSubscriber(token).then(result=>{
        res.status(200).json(result);
    }).catch(err=>{
        console.error(err);
        res.status(400).json({error:err.message});
    })
})

router.delete('/subscriber/unsubscribe',(req,res)=>{
    const {email,service_id}=req.body;
    if(!email || !service_id){
        return res.status(400).json({error:"Email and service ID are required"});
    }
    deleteSubscriber(email,service_id).then(result=>{
        res.status(200).json(result);
    }).catch(err=>{
        console.error(err);
        res.status(500).json({error:"Failed to unsubscribe"});
    })
})

module.exports=router;