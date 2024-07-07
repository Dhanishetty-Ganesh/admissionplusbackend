const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

const uri = process.env.mongo_uri;
const client = new MongoClient(uri);

const dbname = "Institutelist";
const collection_name = "Institutes";
let instituteCollection;

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log(`Connected to the ${dbname} database`);
    instituteCollection = client.db(dbname).collection(collection_name);
  } catch (err) {
    console.error(`Error connecting to the database: ${err}`);
  }
};

app.get("/", (req, res) => {
  res.send({ success: "Hello World" });
});

app.get("/institutes", async (req, res) => {
  try {
    await connectToDatabase();
    const result = await instituteCollection.find({}).toArray();
    res.send({ success: "Institutes sent Successfully", result });
  } catch (Err) {
    res.send({ failure: `Error Occurred: ${Err}` });
  } finally {
    await client.close();
  }
});

app.post("/institutes", async (req, res) => {
  try {
    await connectToDatabase();
    const newInstitute = req.body;
    const result = await instituteCollection.insertOne(newInstitute);
    res.send({ success: "Institute added successfully", result });
  } catch (err) {
    res.send({ failure: `Error occurred: ${err}` });
  } finally {
    await client.close();
  }
});

app.listen(3001, () => {
  console.log("Server is Running at http://localhost:3001");
});
