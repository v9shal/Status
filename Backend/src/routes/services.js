const express=require('express');
const  router=express.Router();
const { getAllServices, createService, getServiceById, updateService } = require('../services/serviceService.js')
router.get('/services',(req,res)=>{
    getAllServices().then(services=>{
        res.json(services);
    }).catch(err=>{
        console.error(err);
        res.status(500).json({error:"Failed to fetch services"});
    });
    return;
})
router.post('/services',(req,res)=>{
    const {name,description}=req.body;
    if(!name){
        return res.status(400).json({error:"Name is required"});
    }
    createService(name,description).then(service=>{
        res.status(201).json(service);
    }).catch(err=>{
        console.error(err);
        res.status(500).json({error:"Failed to create service"});
    } )  
})
router.get('/services/:id',(req,res)=>{
    const {id}=req.params;
    getServiceById(id).then(service=>{
        if(!service){
            return res.status(404).json({error:"Service not found"});
        }
        res.json(service);
    }).catch(err=>{
        console.error(err);
        res.status(500).json({error:"Failed to fetch service"});
    }
    )})

    router.patch('/services/:id',(req,res)=>{
        const {id}=req.params;
        
        const {name,description,status}=req.body;
        const validStatuses = ['operational', 'degraded', 'partial_outage', 'major_outage']
if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' })
}
        updateService(id,name,description,status).then(service=>{
            if(!service){
                return res.status(404).json({error:"Service not found"});
            }
            res.json(service);
        }).catch(err=>{
            console.error(err);
            res.status(500).json({error:"Failed to update service"});
        }   
            )
    })
module.exports=router;