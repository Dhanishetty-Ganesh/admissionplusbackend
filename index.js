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

const uri = process.env.mongo_uri;
const client = new MongoClient(uri);

const dbname = "Institutelist";
const instituteCollectionName = "Institutes";
const audioclipsCollectionName = "audioclips"; // New collection
const formSubmissionsCollectionName = "formSubmissions"; // New collection for form submissions
let instituteCollection;
let audioclipsCollection; // New collection variable
let formSubmissionsCollection; // New collection variable for form submissions

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log(`Connected to the ${dbname} database`);
    instituteCollection = client.db(dbname).collection(instituteCollectionName);
    audioclipsCollection = client.db(dbname).collection(audioclipsCollectionName); // Initialize audioclips collection
    formSubmissionsCollection = client.db(dbname).collection(formSubmissionsCollectionName); // Initialize form submissions collection
  } catch (err) {
    console.error(`Error connecting to the database: ${err}`);
  }
};

connectToDatabase();

// AWS S3 File Upload Code Snippet Starts
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
});

const storage = multer.memoryStorage({
  destination: function (req, file, callback) {
    callback(null, "");
  },
});
const upload = multer({ storage }).single("file");

app.post("/upload", upload, (req, res) => {
  let myFile = req.file.originalname.split(".");
  const fileType = myFile[myFile.length - 1];

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuidv4()}.${fileType}`,
    Body: req.file.buffer,
  };

  s3.upload(params, (error, data) => {
    if (error) {
      res.status(500).send({ Error: error });
    }
    res.status(200).send(data);
  });
});
// AWS S3 File Upload Code Snippet Ends

app.get("/", (req, res) => {
  res.send({ success: "Hello World" });
});

// Endpoint to fetch all institutes
app.get("/institutes", async (req, res) => {
  try {
    const result = await instituteCollection.find({}).toArray();
    res.send({ success: "Institutes sent successfully", result });
  } catch (err) {
    res.send({ failure: `Error occurred: ${err}` });
  }
});

// Endpoint to fetch a single institute by ID
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

// Endpoint to add a new institute
app.post("/institutes", async (req, res) => {
  try {
    console.log("I am institute post method");
    const newInstitute = req.body;
    const result = await instituteCollection.insertOne(newInstitute);
    res.send({ success: "Institute added successfully", result });
  } catch (err) {
    res.send({ failure: `Error occurred: ${err}` });
  }
});

// Endpoint to fetch all audioclips
app.get("/audioclips", async (req, res) => {
  try {
    const result = await audioclipsCollection.find({}).toArray();
    res.send({ success: "Audio clips sent successfully", result });
  } catch (err) {
    res.send({ failure: `Error occurred: ${err}` });
  }
});

// Endpoint to add a new audioclip
app.post("/audioclips", async (req, res) => {
  try {
    const newClip = req.body;
    const result = await audioclipsCollection.insertOne(newClip);
    res.send({ success: "Audio clip added successfully", result });
  } catch (err) {
    res.send({ failure: `Error occurred: ${err}` });
  }
});

// Endpoint to handle form submissions
app.post("/form", async (req, res) => {
  try {
    const { name, mobile, course } = req.body;
    const newSubmission = { name, mobile, course, date: new Date() };
    const result = await formSubmissionsCollection.insertOne(newSubmission);
    res.send({ success: "Form submitted successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err}` });
  }
});

app.listen(3001, () => {
  console.log("Server is running at http://localhost:3001");
});
