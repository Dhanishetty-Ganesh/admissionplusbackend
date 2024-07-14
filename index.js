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
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const dbname = "Institutelist";
const instituteCollectionName = "Institutes";
const audioclipsCollectionName = "audioclips";
const formSubmissionsCollectionName = "studentsdbformSubmissions";
const marketingCampaignsCollectionName = "marketingcampaigns";
const marketingDataCollectionName = "marketingdata";
let instituteCollection;
let audioclipsCollection;
let formSubmissionsCollection;
let marketingCampaignsCollection;
let marketingDataCollection; 


const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log(`Connected to the ${dbname} database`);
    const db = client.db(dbname);
    instituteCollection = db.collection(instituteCollectionName);
    audioclipsCollection = db.collection(audioclipsCollectionName);
    formSubmissionsCollection = db.collection(formSubmissionsCollectionName);
    marketingCampaignsCollection = db.collection(marketingCampaignsCollectionName); // Add this line
    marketingDataCollection = db.collection(marketingDataCollectionName);
  } catch (err) {
    console.error(`Error connecting to the database: ${err}`);
    process.exit(1); // Exit process on database connection error
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
      return res.status(500).send({ failure: error.message });
    }
    res.status(200).send({ success: "File uploaded successfully", data });
  });
});
// AWS S3 File Upload Code Snippet Ends

app.get("/", (req, res) => {
  res.send({ success: "Hello World" });
});

// Endpoint to fetch all institutes
app.get("/institutes", async (req, res) => {
  try {
    if (!instituteCollection) {
      throw new Error("Institute collection is not initialized");
    }
    const result = await instituteCollection.find({}).toArray();
    res.status(200).send({ success: "Institutes fetched successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to fetch a single institute by ID
app.get("/institutes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const institute = await instituteCollection.findOne({ _id: new ObjectId(id) });
    if (institute) {
      res.status(200).send({ success: "Institute fetched successfully", result: institute });
    } else {
      res.status(404).send({ failure: "Institute not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to add a new institute
app.post("/institutes", async (req, res) => {
  try {
    const newInstitute = req.body;
    const result = await instituteCollection.insertOne(newInstitute);
    res.status(201).send({ success: "Institute added successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

app.get("/audioclips", async (req, res) => {
  try {
    const result = await audioclipsCollection.find({}).toArray();
    res.status(200).send({ success: "Audio clips fetched successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to add a new audioclip
app.post("/audioclips", async (req, res) => {
  try {
    const newClip = req.body;
    const result = await audioclipsCollection.insertOne(newClip);
    res.status(201).send({ success: "Audio clip added successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to fetch a single audioclip by ID
app.get("/audioclips/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const clip = await audioclipsCollection.findOne({ _id: new ObjectId(id) });
    if (clip) {
      res.status(200).send({ success: "Audio clip fetched successfully", result: clip });
    } else {
      res.status(404).send({ failure: "Audio clip not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to update an existing audioclip by ID
app.put("/audioclips/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedClip = req.body;
    const result = await audioclipsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedClip });
    if (result.matchedCount === 1) {
      res.status(200).send({ success: "Audio clip updated successfully" });
    } else {
      res.status(404).send({ failure: "Audio clip not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to delete an audioclip by ID
app.delete("/audioclips/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await audioclipsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.status(200).send({ success: "Audio clip deleted successfully" });
    } else {
      res.status(404).send({ failure: "Audio clip not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to handle form submissions
app.post("/form", async (req, res) => {
  try {
    const { date, name, mobile, email, course } = req.body;
    const newSubmission = { date, name, mobile, email, course, submittedAt: new Date() };
    const result = await formSubmissionsCollection.insertOne(newSubmission);
    res.status(201).send({ success: "Form submitted successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to fetch all form submissions
app.get("/form", async (req, res) => {
  try {
    const result = await formSubmissionsCollection.find({}).toArray();
    res.status(200).send({ success: "Form submissions fetched successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to fetch a single form submission by ID
app.get("/form/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const submission = await formSubmissionsCollection.findOne({ _id: new ObjectId(id) });
    if (submission) {
      res.status(200).send({ success: "Form submission fetched successfully", result: submission });
    } else {
      res.status(404).send({ failure: "Form submission not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to delete a form submission by ID
app.delete("/form/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await formSubmissionsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.status(200).send({ success: "Form submission deleted successfully" });
    } else {
      res.status(404).send({ failure: "Form submission not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to fetch all marketing entries
app.get("/marketing", async (req, res) => {
  try {
    const result = await marketingCampaignsCollection.find({}).toArray();
    res.status(200).send({ success: "Marketing entries fetched successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to fetch a single marketing entry by ID
app.get("/marketing/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const marketing = await marketingCampaignsCollection.findOne({ _id: new ObjectId(id) });
    if (marketing) {
      res.status(200).send({ success: "Marketing entry fetched successfully", result: marketing });
    } else {
      res.status(404).send({ failure: "Marketing entry not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to add a new marketing entry
app.post("/marketing", async (req, res) => {
  try {
    const newMarketing = req.body;
    const result = await marketingCampaignsCollection.insertOne(newMarketing);
    res.status(201).send({ success: "Marketing entry added successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to update an existing marketing entry by ID
app.put("/marketing/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedMarketing = req.body;
    const result = await marketingCampaignsCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedMarketing });
    if (result.matchedCount === 1) {
      res.status(200).send({ success: "Marketing entry updated successfully" });
    } else {
      res.status(404).send({ failure: "Marketing entry not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to delete a marketing entry by ID
app.delete("/marketing/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await marketingCampaignsCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.status(200).send({ success: "Marketing entry deleted successfully" });
    } else {
      res.status(404).send({ failure: "Marketing entry not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to fetch all marketing data entries
app.get("/marketingdata", async (req, res) => {
  try {
    const result = await marketingDataCollection.find({}).toArray();
    res.status(200).send({ success: "Marketing data entries fetched successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to fetch a single marketing data entry by ID
app.get("/marketingdata/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const marketingData = await marketingDataCollection.findOne({ _id: new ObjectId(id) });
    if (marketingData) {
      res.status(200).send({ success: "Marketing data entry fetched successfully", result: marketingData });
    } else {
      res.status(404).send({ failure: "Marketing data entry not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to add a new marketing data entry
app.post("/marketingdata", async (req, res) => {
  try {
    const newMarketingData = req.body;
    const result = await marketingDataCollection.insertOne(newMarketingData);
    res.status(201).send({ success: "Marketing data entry added successfully", result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to update an existing marketing data entry by ID
app.put("/marketingdata/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const updatedMarketingData = req.body;
    const result = await marketingDataCollection.updateOne({ _id: new ObjectId(id) }, { $set: updatedMarketingData });
    if (result.matchedCount === 1) {
      res.status(200).send({ success: "Marketing data entry updated successfully" });
    } else {
      res.status(404).send({ failure: "Marketing data entry not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to delete a marketing data entry by ID
app.delete("/marketingdata/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await marketingDataCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.status(200).send({ success: "Marketing data entry deleted successfully" });
    } else {
      res.status(404).send({ failure: "Marketing data entry not found" });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
