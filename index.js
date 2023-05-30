const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const app = express()
var cors = require('cors')
const port =process.env.PORT|| 5000
app.use(cors())
require('dotenv').config()
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f7zs7lw.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT=(req,res,next)=>{
const authorization=req.headers.authorization

if(!authorization){
  return res.status(401).send({error:true,message:'unauthorized acess'})
  
}
const token=authorization.split(' ')[1]
jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(error, decoded) {
  if(error){
    return res.status(403).send({error:true,message:'unauthorized access'})
  }
req.decoded=decoded
  next()
});
}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const jobCategory = client.db("jobCategoryDB").collection("jobCategoryCollections");

    const jobs = client.db("jobsDB").collection("jobsCollections");

    const appliedJobs = client.db("appliedJobsDB").collection("appliedJobsCollections");


    app.post('/jwt', async(req, res) => {
        const user=req.body
        const token=jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h'});
        res.send({token})
      
      })


    
   app.post('/appliedjobs', async(req, res) => {
  const appliedjob=req.body
  const result= await appliedJobs.insertOne(appliedjob)
  res.send(result)
  
  })
  
  app.get('/appliedjobs',verifyJWT, async(req, res) => {
    const decoded=req.decoded.email
    if(req.query.email!==decoded){
      return res.status(403).send({error:true,message:'Forbiden access'})
    }
    let query={}
    if(req.query?.email){
      query={useremail:req.query.email}
    }
  
    const result= await appliedJobs.find(query).toArray()
    res.send(result)
    
    })
    




   app.post('/jobs', async(req, res) => {

        const job=req.body
        const result= await jobs.insertOne(job)
        res.send(result)
      })
      


      app.get('/jobs', async (req, res) => {
        
        
        const { category, jobType, location, search,email,sort } = req.query;
    
        const filter = {};
      
        if (category) {
          filter.category = category;
        }
        if (jobType) {
          filter.type = jobType;
        }
        if (location) {
          filter.location = location;
        }
        if (search) {
          filter.jobtitle = { $regex: search, $options: 'i' };
        }
       if (email) {
          filter.email = email
        }
        const options = {
          // sort matched documents in descending order by rating
          sort: { "salary": sort==='asc'?1:-1 },
          // Include only the `title` and `imdb` fields in the returned document
  
        };
     
        const result = await jobs.find(filter, options).toArray();
        res.send(result);
      });
      
      app.get('/jobs/:id', async(req, res) => {

        const id=req.params.id;
        const query={_id: new ObjectId(id)}

        const result= await jobs.findOne(query)
        res.send(result)
      })

















      app.put('/jobs/:id', async(req, res) => {

        const id=req.params.id;
        const query={_id: new ObjectId(id)}
          const job=req.body
          const options = { upsert: true };

          const updateDoc = {
            $set: {
              companyimg:job.companyimg,
      name:job.name,
      email:job.email,
      jobtitle:job.jobtitle,
      location:job. location,
      category:job.category,
      salary:job.salary,
      type:job.type,
      vacancy:job.vacancy,
      description:job.description,
      requirements:job.requirements,
            },
          };
        const result= await jobs.updateOne(query,updateDoc,options)
        res.send(result)
      })



      app.delete('/jobs/:id', async(req, res) => {

        const id=req.params.id
        const query={_id: new ObjectId(id)}
        const result= await jobs.deleteOne(query)
        res.send(result)
      })

      app.delete('/appliedjobs/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await appliedJobs.deleteOne(query);
        res.send(result);
      });



    app.get('/categories', async(req, res) => {
        const result=  await jobCategory.find().toArray()
        res.send(result)
      })
      



     
   



    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Job portal Servers')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})