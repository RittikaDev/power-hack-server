const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// Mongo Connect

// powerHack mongo username
// 0rcp7Z04M2WU9iFe mongo pass

const uri =
	"mongodb+srv://powerHack:0rcp7Z04M2WU9iFe@cluster0.frdze.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});
async function run(req, res) {
	try {
		await client.connect();
		const billingCollection = client.db("powerHack").collection("billings");
		console.log("Mongo Running");
		// load bills
		app.get("/billing-list", async (req, res) => {
			// const id = req.params.id;
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
			// console.log(result);
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
