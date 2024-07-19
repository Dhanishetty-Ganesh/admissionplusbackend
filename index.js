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
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true,});

const dbname = "Institutelist";
const instituteCollectionName = "Institutes";
const formSubmissionsCollectionName = "studentsdbformSubmissions";
let instituteCollection;
let formSubmissionsCollection;


const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log(`Connected to the ${dbname} database`);
    const db = client.db(dbname);
    instituteCollection = db.collection(instituteCollectionName);
    formSubmissionsCollection = db.collection(formSubmissionsCollectionName);
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


const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/institutes', async (req, res) => {
  try {
    if (!instituteCollection) {
      throw new Error('Institute collection is not initialized');
    }
    const result = await instituteCollection.find({}).toArray();
    res.status(200).send({ success: 'Institutes fetched successfully', result });
  } catch (err) {
    console.error(`Error fetching institutes: ${err.message}`);
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});


// Endpoint to fetch a single institute by ID
app.get('/institutes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const institute = await instituteCollection.findOne({ _id: new ObjectId(id) });
    if (institute) {
      res.status(200).send({ success: 'Institute fetched successfully', result: institute });
    } else {
      res.status(404).send({ failure: 'Institute not found' });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to add a new institute
app.post('/institutes', async (req, res) => {
  try {
    const newInstitute = req.body;
    const result = await instituteCollection.insertOne(newInstitute);
    res.status(201).send({ success: 'Institute added successfully', result });
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to update an institute by ID
app.put('/institutes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ failure: 'Invalid ID format' });
    }
    const updatedInstitute = req.body;
    const result = await instituteCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedInstitute }
    );
    if (result.matchedCount === 1) {
      res.status(200).send({ success: 'Institute updated successfully' });
    } else {
      res.status(404).send({ failure: 'Institute not found' });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});

// Endpoint to delete an institute by ID
app.delete('/institutes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ failure: 'Invalid ID format' });
    }
    const result = await instituteCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      res.status(200).send({ success: 'Institute deleted successfully' });
    } else {
      res.status(404).send({ failure: 'Institute not found' });
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



// Helper functions for array operations in an institute
const addDataToArray = async (id, arrayName, newData) => {
  if (!ObjectId.isValid(id)) {
    return { status: 400, result: { failure: 'Invalid ID format' } };
  }

  const result = await instituteCollection.updateOne(
    { _id: new ObjectId(id) },
    { $push: { [arrayName]: newData } }
  );

  if (result.matchedCount === 1) {
    return { status: 201, result: { success: `${arrayName} added successfully`, newData } };
  } else {
    return { status: 404, result: { failure: 'Institute not found' } };
  }
};

const updateDataInArray = async (id, arrayName, dataId, updatedData) => {
  if (!ObjectId.isValid(id) || !ObjectId.isValid(dataId)) {
    return { status: 400, result: { failure: 'Invalid ID format' } };
  }

  const result = await instituteCollection.updateOne(
    { _id: new ObjectId(id), [`${arrayName}._id`]: new ObjectId(dataId) },
    { $set: { [`${arrayName}.$`]: updatedData } }
  );

  if (result.matchedCount === 1) {
    return { status: 200, result: { success: `${arrayName} updated successfully` } };
  } else {
    return { status: 404, result: { failure: 'Institute or data not found' } };
  }
};

const deleteDataFromArray = async (id, arrayName, dataId) => {
  if (!ObjectId.isValid(id) || !ObjectId.isValid(dataId)) {
    return { status: 400, result: { failure: 'Invalid ID format' } };
  }

  const result = await instituteCollection.updateOne(
    { _id: new ObjectId(id) },
    { $pull: { [arrayName]: { _id: new ObjectId(dataId) } } }
  );

  if (result.matchedCount === 1) {
    return { status: 200, result: { success: `${arrayName} deleted successfully` } };
  } else {
    return { status: 404, result: { failure: 'Institute or data not found' } };
  }
};


// Endpoints for managing data in arrays within an institute
app.post('/institutes/:id/:arrayName', asyncHandler(async (req, res) => {
  const { id, arrayName } = req.params;
  const newData = req.body;
  try {
    const response = await addDataToArray(id, arrayName, newData);
    res.status(response.status).send(response.result);
  } catch (error) {
    console.error(`Error adding data to ${arrayName}:`, error.message);
    res.status(500).send({ failure: 'Internal server error' });
  }
}));

app.put('/institutes/:id/:arrayName/:dataId', async (req, res) => {
  const { id, arrayName, dataId } = req.params;
  const updatedData = req.body;

  try {
    if (!ObjectId.isValid(id) || !ObjectId.isValid(dataId)) {
      return res.status(400).send({ failure: 'Invalid ID format' });
    }

    const result = await instituteCollection.updateOne(
      { _id: new ObjectId(id), [`${arrayName}._id`]: new ObjectId(dataId) },
      { $set: { [`${arrayName}.$`]: updatedData } }
    );

    if (result.matchedCount === 1) {
      res.status(200).send({ success: `${arrayName} updated successfully` });
    } else {
      res.status(404).send({ failure: 'Institute or data not found' });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});


app.delete('/institutes/:id/:arrayName/:dataId', async (req, res) => {
  const { id, arrayName, dataId } = req.params;
  try {
    if (!ObjectId.isValid(id) || !ObjectId.isValid(dataId)) {
      return res.status(400).send({ failure: 'Invalid ID format' });
    }
    const result = await instituteCollection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { [arrayName]: { _id: new ObjectId(dataId) } } }
    );
    if (result.matchedCount === 1) {
      res.status(200).send({ success: `${arrayName} deleted successfully` });
    } else {
      res.status(404).send({ failure: 'Institute or data not found' });
    }
  } catch (err) {
    res.status(500).send({ failure: `Error occurred: ${err.message}` });
  }
});


// GET endpoint to retrieve arrays (e.g., marketing, marketingdata) in an institute
app.get('/institutes/:id/:arrayName', asyncHandler(async (req, res) => {
  const { id, arrayName } = req.params;

  try {
    const institute = await instituteCollection.findOne({ _id: new ObjectId(id) }, { projection: { [arrayName]: 1 } });

    if (institute) {
      res.status(200).send(institute[arrayName] || []);
    } else {
      res.status(404).send({ failure: 'Institute not found' });
    }
  } catch (error) {
    console.error(`Error retrieving ${arrayName}:`, error.message);
    res.status(500).send({ failure: 'Internal server error' });
  }
}));


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
