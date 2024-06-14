const express=require("express");
const cors=require('cors');
const app=express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors());
app.use(express.json())
const port=3000;
const upload_Destination='uploads/'
const path=require(path)
const jwt=require('jsonwebtoken');
const uri = "mongodb+srv://osmangoni0827:UmIefQcU42X5AKwA@cluster0.65pglqj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const multer=require('multer');
const path = require("path/posix");
const createToken=(user)=>{
  const token= jwt.sign({
    email:user.email
  }, 'secret', { expiresIn: '7d' });
  return token;
}

const verifyToken=(req,res,next)=>{
  const token=req.headers.authorization?.split(" ")[1];
  const verify=jwt.verify(token,'secret')
  if(!verify?.email){
   return res.send("You are not authorized")
  }
  req.user=verify?.email;
  next()
}
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
const storage=multer.diskStorage({
  destination:((req,file,cv)=>{
    cv(null,upload_Destination)
  }),
  filename:((req,file,cv)=>{
    const fileExt=path.extname(file.originalname)
    const fileName=file.originalname().replace(fileExt,"").toLowerCase().slice(" ").
    join("_")+"_"+ Date.now()
    cv(null,fileName+fileExt)

  })
})
const upload = multer({
  storage: storage,
limits:{
  fileSize:1000000
},
fileFilter:(req,file,cb)=>{
  if(file.mimetype==="image/png"||file.mimetype==="image/jpeg"
  ||file.mimetype==="image/jpg"){
    cb(null,true)
  }
  else{
    cb(new Error("Only png, jpg, jpeg file allowed"))
  }
}
})



async function run() {

  app.use((err,req,res,next)=>{
    if(err){
      if(err instanceof multer.MulterError){
        res.status(500).send("There was an upload error")
      }
      else{
        res.status(500).send(err.message)
      }
    }
    res.send("success")
  })

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    const Taskdatabase= await client.db("TaskDB")
    const UserDatabase=await client.db("UserDB");
    const TaskList=await Taskdatabase.collection("TaskList")
    const UserCollection=await UserDatabase.collection("UserCollection");

   
    app.post('/user/upload_profile/:email', 
      upload.single('avatar'),
    async(req,res)=>{
      const email=req.params.email;
      console.log(email)
      res.send("Success Upload") 
      
    })

    app.get('/task', async(req,res)=>{
      const {searchValue,category}=req.query;
      console.log(searchValue,category)
      if(category==="today"||category==="date"){
        const result=await TaskList.find({
          task_deadline:searchValue}).toArray();
          return res.send(result)
      }
      if(category==="priority"){
        const result=await TaskList.find({
          task_priority:searchValue}).toArray();
          return res.send(result)
      }
      const result= await TaskList.find().toArray();
       return res.send(result);
    })
    app.get('/task/:id', async(req,res)=>{
        const id=req.params.id
        const result= await TaskList.findOne({_id: new ObjectId(id)});
        res.send(result);
    })
    app.post('/create_task', async(req,res)=>{
      
        const data= await req.body;
        const result= await TaskList.insertOne(data);
        res.send(result);
    })
    
    app.patch('/task/:id', async(req,res)=>{
     const UpdateData=req.body
     const id=req.params.id
     const result=await TaskList.updateOne({_id:new ObjectId(id)},
    {$set:UpdateData}
    )
    res.send(result)
    })
    app.delete('/task/:id', async(req,res)=>{
        const id=req.params.id
        const result= await TaskList.deleteOne({_id: new ObjectId(id)});
        res.send(result);
    })
    app.get('/user', async(req,res)=>{
      const email=req.params.id
      const result= await UserCollection.find().toArray();
      res.send(result); 
  })
  app.get('/user/:email', async(req,res)=>{
    const email=req.params.email
    const result= await UserCollection.findOne({email:email});
    res.send(result);
})
  

    app.post('/add_user', async(req,res)=>{
      const newUser=req.body;
     
      const token=createToken(newUser);
    
      const isExistUser= await UserCollection.findOne({email:newUser?.email})
      if(isExistUser){
        return res.send({
          status:"200",
          message:"Successfully LoggedIn",
          token
        })
      }
     await UserCollection.insertOne(newUser);
     console.log(newUser)
    return res.send({token})
    })
    app.patch('/user/:email', async(req,res)=>{
      const UpdateData=req.body;
      const email= req.params.email;
      console.log(UpdateData,email)
      const result= await UserCollection.updateOne({email:email},
      {$set:UpdateData}); 
    
      res.send(result);
  })
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.log);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port,()=>{
        console.log("Server Run in port ",port)
})