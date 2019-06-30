import { Handler, RequestBody } from "../main";
import { MongoDBDocumentInterface } from "../util";
import Mongoose from "mongoose"

const handler: Handler = (req, res, next, ctx) => {
	const body: RequestBody = req.body;
	const msg = body.message;
	const chat = body.message.chat;
	const model = Mongoose.model(chat.type, ctx.Schema)
	res.json({
		success: true
	});
	next();
}

export default handler