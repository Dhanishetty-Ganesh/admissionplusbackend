const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const dbname = "Institutelist";
const collections = {};

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log(`Connected to the ${dbname} database`);
    const db = client.db(dbname);
    collections.institutes = db.collection("Institutes");
    collections.audioclips = db.collection("audioclips");
    collections.formSubmissions = db.collection("studentsdbformSubmissions");
    collections.marketingCampaigns = db.collection("marketingcampaigns");
    collections.marketingData = db.collection("marketingdata");
    collections.groups = db.collection("groups");
    collections.studentsdbgroupname = db.collection("studentsdbgroupname");
  } catch (err) {
    console.error(`Error connecting to the database: ${err}`);
    process.exit(1);
  }
};

connectToDatabase().catch(console.error);

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("file");

app.post("/upload", upload, (req, res) => {
  const fileType = req.file.originalname.split(".").pop();
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${uuidv4()}.${fileType}`,
    Body: req.file.buffer,
  };

  s3.upload(params, (error, data) => {
    if (error) {
      console.error(`S3 Upload Error: ${error.message}`);
      return res.status(500).send({ failure: error.message });
    }
    res.status(200).send({ success: "File uploaded successfully", data });
  });
});

app.get("/", (req, res) => {
  res.send({ success: "Hello World" });
});

// Utility function to handle async errors
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/institutes', asyncHandler(async (req, res) => {
  const result = await collections.institutes.find({}).toArray();
  res.status(200).send({ success: 'Institutes fetched successfully', result });
}));

app.get('/institutes/:id', asyncHandler(async (req, res) => {
  const institute = await collections.institutes.findOne({ _id: new ObjectId(req.params.id) });
  if (institute) {
    res.status(200).send({ success: 'Institute fetched successfully', result: institute });
  } else {
    res.status(404).send({ failure: 'Institute not found' });
  }
}));

app.post('/institutes', asyncHandler(async (req, res) => {
  const result = await collections.institutes.insertOne(req.body);
  res.status(201).send({ success: 'Institute added successfully', result });
}));

app.put('/institutes/:id', asyncHandler(async (req, res) => {
  const result = await collections.institutes.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (result.matchedCount === 1) {
    res.status(200).send({ success: 'Institute updated successfully' });
  } else {
    res.status(404).send({ failure: 'Institute not found' });
  }
}));

app.delete('/institutes/:id', asyncHandler(async (req, res) => {
  const result = await collections.institutes.deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 1) {
    res.status(200).send({ success: 'Institute deleted successfully' });
  } else {
    res.status(404).send({ failure: 'Institute not found' });
  }
}));

app.get('/audioclips', asyncHandler(async (req, res) => {
  const result = await collections.audioclips.find({}).toArray();
  res.status(200).send({ success: 'Audio clips fetched successfully', result });
}));

app.post('/audioclips', asyncHandler(async (req, res) => {
  const result = await collections.audioclips.insertOne(req.body);
  res.status(201).send({ success: 'Audio clip added successfully', result });
}));

app.get('/audioclips/:id', asyncHandler(async (req, res) => {
  const clip = await collections.audioclips.findOne({ _id: new ObjectId(req.params.id) });
  if (clip) {
    res.status(200).send({ success: 'Audio clip fetched successfully', result: clip });
  } else {
    res.status(404).send({ failure: 'Audio clip not found' });
  }
}));

app.put('/audioclips/:id', asyncHandler(async (req, res) => {
  const result = await collections.audioclips.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (result.matchedCount === 1) {
    res.status(200).send({ success: 'Audio clip updated successfully' });
  } else {
    res.status(404).send({ failure: 'Audio clip not found' });
  }
}));

app.delete('/audioclips/:id', asyncHandler(async (req, res) => {
  const result = await collections.audioclips.deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 1) {
    res.status(200).send({ success: 'Audio clip deleted successfully' });
  } else {
    res.status(404).send({ failure: 'Audio clip not found' });
  }
}));

app.post("/form", asyncHandler(async (req, res) => {
  const newSubmission = { ...req.body, submittedAt: new Date() };
  const result = await collections.formSubmissions.insertOne(newSubmission);
  res.status(201).send({ success: "Form submitted successfully", result });
}));

app.get("/form", asyncHandler(async (req, res) => {
  const result = await collections.formSubmissions.find({}).toArray();
  res.status(200).send({ success: "Form submissions fetched successfully", result });
}));

app.get("/form/:id", asyncHandler(async (req, res) => {
  const submission = await collections.formSubmissions.findOne({ _id: new ObjectId(req.params.id) });
  if (submission) {
    res.status(200).send({ success: "Form submission fetched successfully", result: submission });
  } else {
    res.status(404).send({ failure: "Form submission not found" });
  }
}));

app.delete("/form/:id", asyncHandler(async (req, res) => {
  const result = await collections.formSubmissions.deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 1) {
    res.status(200).send({ success: "Form submission deleted successfully" });
  } else {
    res.status(404).send({ failure: "Form submission not found" });
  }
}));

app.get("/marketing", asyncHandler(async (req, res) => {
  const result = await collections.marketingCampaigns.find({}).toArray();
  res.status(200).send({ success: "Marketing entries fetched successfully", result });
}));

app.get("/marketing/:id", asyncHandler(async (req, res) => {
  const marketing = await collections.marketingCampaigns.findOne({ _id: new ObjectId(req.params.id) });
  if (marketing) {
    res.status(200).send({ success: "Marketing entry fetched successfully", result: marketing });
  } else {
    res.status(404).send({ failure: "Marketing entry not found" });
  }
}));

app.post("/marketing", asyncHandler(async (req, res) => {
  const result = await collections.marketingCampaigns.insertOne(req.body);
  res.status(201).send({ success: "Marketing entry added successfully", result });
}));

app.put("/marketing/:id", asyncHandler(async (req, res) => {
  const result = await collections.marketingCampaigns.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (result.matchedCount === 1) {
    res.status(200).send({ success: "Marketing entry updated successfully" });
  } else {
    res.status(404).send({ failure: "Marketing entry not found" });
  }
}));

app.delete("/marketing/:id", asyncHandler(async (req, res) => {
  const result = await collections.marketingCampaigns.deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 1) {
    res.status(200).send({ success: "Marketing entry deleted successfully" });
  } else {
    res.status(404).send({ failure: "Marketing entry not found" });
  }
}));

app.get("/marketingdata", asyncHandler(async (req, res) => {
  const result = await collections.marketingData.find({}).toArray();
  res.status(200).send({ success: "Marketing data fetched successfully", result });
}));

app.get("/marketingdata/:id", asyncHandler(async (req, res) => {
  const marketingData = await collections.marketingData.findOne({ _id: new ObjectId(req.params.id) });
  if (marketingData) {
    res.status(200).send({ success: "Marketing data entry fetched successfully", result: marketingData });
  } else {
    res.status(404).send({ failure: "Marketing data entry not found" });
  }
}));

app.post("/marketingdata", asyncHandler(async (req, res) => {
  const result = await collections.marketingData.insertOne(req.body);
  res.status(201).send({ success: "Marketing data entry added successfully", result });
}));

app.put("/marketingdata/:id", asyncHandler(async (req, res) => {
  const result = await collections.marketingData.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (result.matchedCount === 1) {
    res.status(200).send({ success: "Marketing data entry updated successfully" });
  } else {
    res.status(404).send({ failure: "Marketing data entry not found" });
  }
}));

app.delete("/marketingdata/:id", asyncHandler(async (req, res) => {
  const result = await collections.marketingData.deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 1) {
    res.status(200).send({ success: "Marketing data entry deleted successfully" });
  } else {
    res.status(404).send({ failure: "Marketing data entry not found" });
  }
}));

app.get("/studentsdbgroupname", asyncHandler(async (req, res) => {
  const result = await collections.studentsdbgroupname.find({}).toArray();
  res.status(200).send({ success: "Student groups fetched successfully", result });
}));

app.get("/studentsdbgroupname/:id", asyncHandler(async (req, res) => {
  const group = await collections.studentsdbgroupname.findOne({ _id: new ObjectId(req.params.id) });
  if (group) {
    res.status(200).send({ success: "Student group fetched successfully", result: group });
  } else {
    res.status(404).send({ failure: "Student group not found" });
  }
}));

app.post("/studentsdbgroupname", asyncHandler(async (req, res) => {
  const result = await collections.studentsdbgroupname.insertOne(req.body);
  res.status(201).send({ success: "Student group added successfully", result });
}));

app.put("/studentsdbgroupname/:id", asyncHandler(async (req, res) => {
  const result = await collections.studentsdbgroupname.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: req.body }
  );
  if (result.matchedCount === 1) {
    res.status(200).send({ success: "Student group updated successfully" });
  } else {
    res.status(404).send({ failure: "Student group not found" });
  }
}));

app.delete("/studentsdbgroupname/:id", asyncHandler(async (req, res) => {
  const result = await collections.studentsdbgroupname.deleteOne({ _id: new ObjectId(req.params.id) });
  if (result.deletedCount === 1) {
    res.status(200).send({ success: "Student group deleted successfully" });
  } else {
    res.status(404).send({ failure: "Student group not found" });
  }
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

