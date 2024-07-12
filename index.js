const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

const dbname = "Institutelist";
const instituteCollectionName = "Institutes";
const audioclipsCollectionName = "audioclips";
let instituteCollection;
let audioclipsCollection;

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log(`Connected to the ${dbname} database`);
    instituteCollection = client.db(dbname).collection(instituteCollectionName);
    audioclipsCollection = client.db(dbname).collection(audioclipsCollectionName);
  } catch (err) {
    console.error(`Error connecting to the database: ${err}`);
  }
};

connectToDatabase();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
});

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, '');
  }
});
const upload = multer({ storage }).single('file');

app.post("/upload", upload, (req, res) => {
  let myFile = req.file.originalname.split(".");
  const fileType = myFile[myFile.length - 1];

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuidv4()}.${fileType}`,
    Body: req.file.buffer
  };

  s3.upload(params, (error, data) => {
    if (error) {
      res.status(500).send({ Error: error });
    }
    res.status(200).send(data);
  });
});

app.get("/", (req, res) => {
  res.send({ success: "Hello World" });
});

app.get("/institutes", async (req, res) => {
  try {
    const result = await instituteCollection.find({}).toArray();
    res.send({ success: "Institutes sent successfully", result });
  } catch (err) {
    res.send({ failure: `Error occurred: ${err}` });
  }
});

app.get("/institutes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const institute = await instituteCollection.findOne({ _id: new ObjectId(id) });
    if (institute) {
      res.send({ success: "Institute fetched successfully", result: institute });
    } else {
      res.send({ failure: "Institute not found" });
    }
  } catch (err) {
    res.send({ failure: `Error occurred: ${err}` });
  }
});

app.post("/institutes", async (req, res) => {
  try {
    const newInstitute = req.body;
    console.log('Received new institute:', newInstitute); // Logging received data
    const result = await instituteCollection.insertOne(newInstitute);
    res.send({ success: "Institute added successfully", result: result.ops[0] });
  } catch (err) {
    console.error('Error inserting institute:', err); // Logging error
    res.send({ failure: `Error occurred: ${err}` });
  }
});

app.get("/audioclips", async (req, res) => {
  try {
    const result = await audioclipsCollection.find({}).toArray();
    res.send({ success: "Audio clips sent successfully", result });
  } catch (err) {
    res.send({ failure: `Error occurred: ${err}` });
  }
});

app.post("/audioclips", async (req, res) => {
  try {
    const newClip = req.body;
    const result = await audioclipsCollection.insertOne(newClip);
    res.send({ success: "Audio clip added successfully", result });
  } catch (err) {
    res.send({ failure: `Error occurred: ${err}` });
  }
});

app.listen(3001, () => {
  console.log("Server is running at http://localhost:3001");
});
