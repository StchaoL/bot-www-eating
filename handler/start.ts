import { Handler, RequestBody } from "../main";
import { MongoDBDocumentInterface } from "../util";
import Mongoose from "mongoose"

const Model = Mongoose.Model

const handler: Handler = (req, res, next, ctx) => {
	const _body: RequestBody = req.body;

	res.json({
		success: true
	});
	next();
}

export default handler