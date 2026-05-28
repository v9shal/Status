const express=require('express');
const  router=express.Router();
const { getAllIncident, createIncident, getIncidentById, patchIncident, TimelinePost } = require('../services/incidentService');

router.get('/incidents',(req,res)=>{
    getAllIncident().then(incidents=>{
        res.json(incidents);
    })
    .catch(err=>{
        console.error(err);
        res.status(500).json({error:"Failed to fetch incidents"});
    });
    return;
})
router.post('/incidents',(req,res)=>{
    const {service_id,title,description}=req.body;
    if(!service_id || !title){
        return res.status(400).json({error:"Service ID and title are required"});
    }
    createIncident(service_id,title,description).then(incident=>{
        res.status(201).json(incident);
    }).catch(err=>{
        console.error(err);
        res.status(500).json({error:"Failed to create incident"});
    })
})
router.get('/incidents/:id',(req,res)=>{
    const {id}=req.params;  
    getIncidentById(id).then(incident=>{
        if(!incident){
            return res.status(404).json({error:"Incident not found"});
        }
        res.json(incident);
    }
    ).catch(err=>{
        console.error(err);
        res.status(500).json({error:"Failed to fetch incident"});
    }
    )})

router.patch('/incidents/:id/resolve',(req,res)=>{
    const {id}=req.params;
    const {description}=req.body;
patchIncident(id,null,description,'resolved',new Date()).then(incident=>{
        if(!incident){
            return res.status(404).json({error:"Incident not found"});
        }
        res.json(incident);
    }).catch(err=>{
        console.error(err);
        res.status(500).json({error:"Failed to update incident"});
    });
});
router.post('/incidents/:id/updates', (req,res)=>{
    const {id}=req.params;
    const {description,status}=req.body;
    const validStatuses = ['investigating', 'identified', 'monitoring', 'resolved']
if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
}
if (!description || !status) {
    return res.status(400).json({ error: 'description and status are required' })
}
TimelinePost(id,description,status).then(result=>{
    res.json(result);
}).catch(err=>{
    console.error(err);
    res.status(500).json({error:"Failed to post timeline update"});
})
})
module.exports=router;