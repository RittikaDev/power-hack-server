const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

app.use("/auth", require("./routes/auth"));
// app.use("/posts", require("./routes/posts"));

// Mongo Connect

// powerHack mongo username
// 0rcp7Z04M2WU9iFe mongo pass

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.frdze.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run(req, res) {
  try {
    await client.connect();
    const billingCollection = client.db("powerHack").collection("billings");
    const userCollection = client.db("powerHack").collection("users");
    console.log("Mongo Running");
    // load bills
    app.get("/billing-list", async (req, res) => {
      const query = {};
      const cursor = await billingCollection.find(query);
      const items = await cursor.toArray();
      res.send(items);
    });
    // add bills
    app.post("/add-billing", async (req, res) => {
      const newBill = req.body;
      console.log("added", newBill);
      const result = await billingCollection.insertOne(newBill);
      res.send([result, newBill]);
    });
    // Delete An Order
    app.delete("/delete-billing/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const filter = { _id: ObjectId(id) };
      const result = await billingCollection.deleteOne(filter);
      res.send(result);
      // console.log(result);
    });
    // pagination
    app.get("/items", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = billingCollection.find(query);
      let items;
      if (page || size) {
        items = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        items = await cursor.toArray();
      }
      res.send(items);
      // }
    });
    app.get("/itemcount", async (req, res) => {
      // const query = {};
      const count = await billingCollection.estimatedDocumentCount();
      res.send({ count });
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running Power Hack ");
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
