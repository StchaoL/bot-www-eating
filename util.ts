import request, { Options, RequestPromise } from "request-promise-native";
import mongoose from "mongoose";
import { URL } from "url";

// const mongoose = require('mongoose')
// const config = require('./config')
// const { URL } = require("url");
// const request = require("request-promise-native")
// const fs = require("fs");

const TOKEN = process.env.TOKEN || "abcdefghijklmnopqrstuvwxyz";
const DB_NAME = process.env.DB_NAME || TOKEN;
const MONGODB_ADDRESS = process.env.MONGODB_ADDRESS || "mongodb://localhost:27017/" + DB_NAME;

const Schema = mongoose.Schema;

interface WebHookConf {
	url: string;
	// certificate?: string;
	max_connection?: number;
	allowed_updates?: Array<string>;
}

export const setWebhook = (conf: WebHookConf): RequestPromise<any> => {
	new URL(conf.url);
	let _opt: Options = {
		uri: `https://api.telegram.org/bot${TOKEN}/setWebhook`,
		formData: conf,
		// {
		// 	max_connection: conf.max_connection,
		// 	allowed_updates: conf.allowed_updates,
		// 	url: conf.url
		// 	// file: {
		// 	// 	value: fs.createReadStream(conf.certificate),
		// 	// 	options: {
		// 	// 		filename: 'test.jpg',
		// 	// 		contentType: 'image/jpg'
		// 	// 	}
		// 	// }
		// },
		headers: {
			'content-type': 'multipart/form-data' // Is set automatically
		}
	}
	return request(_opt)
}


if (process.env.NODE_ENV === 'development') {
	mongoose.set('debug', true)
}

mongoose.set('bufferCommands', false)

function connectMongoDB(address: string) {
	try {
		mongoose.connect(address, {
			useNewUrlParser: true,
			bufferMaxEntries: 0,
			autoReconnect: true,
			poolSize: 5
		})

		const db = mongoose.connection
		db.on('error', (error) => {
			console.log(`MongoDB connecting failed: ${error}`)
		})
		db.once('open', () => {
			console.log('MongoDB connecting succeeded')
		})
		return db
	} catch (error) {
		console.log(`MongoDB connecting failed: ${error}`)
	}
}

export const mongoInstance = connectMongoDB(MONGODB_ADDRESS);
export const botSchema = new Schema({
	id: Number
});
export interface MongoDBDocumentInterface {
	id: number;
};