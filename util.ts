import request, { Options, RequestPromise } from "request-promise-native";
import mongoose, { Document } from "mongoose";
import { URL } from "url";
import { SentMessage } from "./TelegramType";

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
	};
	return request(_opt);
}

export const sendMessage = (message: SentMessage): RequestPromise<any> => {
	let _opt: Options = {
		uri: `https://api.telegram.org/bot${TOKEN}/sendMessage`,
		formData: message,
		headers: {
			'content-type': 'multipart/form-data' // Is set automatically
		}
	};
	return request(_opt);
}

// MongoDB

if (process.env.NODE_ENV === 'development') {
	mongoose.set('debug', true);
}

mongoose.set('bufferCommands', false);

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

export const optionSchema = new Schema({
	name: String,
	priority: Number
});

export const botSchema = new Schema({
	id: { type: Number, index: true },
	options: [optionSchema]
});

export interface MongoDBDocumentInterface {
	chatId: number;
	options?: Array<OptionInterface>;
};

export interface MongoDBModelInterface extends MongoDBDocumentInterface, Document { };

export interface OptionInterface {
	name: string;
	priority: number;
};

export interface ParsedOptionInterface extends OptionInterface {
	index: number;
}

export const parser = (str: string, addMode: boolean): ParsedOptionInterface => {
	// (/\d+\s*(=>|->|👉|→)\s*.+?\s*:\s*\d+.*/)
	// let _index = 0
	if (str.indexOf(":") < 0)
		str = str + ": 1";
	let ret: ParsedOptionInterface = {
		index: -1,
		name: "",
		priority: -1
	}
	let reg: RegExp;
	if (addMode) {
		str.replace(/(\d+)\s*(=>|->|👉|→)\s*(.+?)\s*:\s*(\d+).*/, (s, g1, g2, g3, g4) => {
			ret.index = Number.parseInt(g1);
			ret.name = g3;
			ret.priority = Number.parseInt(g4);
			return "";
		});
	} else {
		str.replace(/(.+?)\s*:\s*(\d+).*/, (s, g1, g2) => {
			ret.name = g1;
			ret.priority = Number.parseInt(g2);
			return "";
		});
	}
	return ret;
}
