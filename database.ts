import request, { Options, RequestPromise } from "request-promise-native";
import mongoose, {Document, Types} from "mongoose";
import { URL } from "url";
import { SentMessage } from "./TelegramType";

// const mongoose = require('mongoose')
// const config = require('./config')
// const { URL } = require("url");
// const request = require("request-promise-native")
// const fs = require("fs");

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
// MongoDB

export const catalogCollName = "catalog";
export const optionCollName = "option";
export const currentCollName = "cache";

const optionSchema = new Schema({
	name: String,
	priority: Number,
	catalogId: { type: ObjectId, default: 0, index: true }
});

const catalogSchema = new Schema({
	name: String,
	note: String
});

export const currentListSchema = new Schema({
	chatId: { type: Number, index: true },
	catalogId: ObjectId,
	options: [optionSchema]
});

export const catalogListSchema = new Schema({
	chatId: { type: Number, index: true },
	catalogList: [catalogSchema]
}, { autoIndex: false });

export const optionsListSchema = new Schema({
	catalogId: { type: ObjectId, index: true },
	optionList: [optionSchema]
});

export interface CatalogInterface {
	name: string;
	note?: string;
}

export interface OptionInterface {
	name: string;
	priority: number;
}

export interface DBOptionListInterface {
	catalogId: Types.ObjectId;
	optionList?: Array<OptionInterface>
}

export interface DBCurrentListInterface {
	chatId: number;
	catalogId?: Types.ObjectId,
	options?: Array<OptionInterface>;
}

export interface DBCatalogListInterface {
	chatId: number;
	catalogList?: Array<CatalogDocInterface>;
}

export interface DBCurrentListDocInterface extends DBCurrentListInterface, Document { }
export interface DBCatalogListDocInterface extends DBCatalogListInterface, Document{ }
export interface DBOptionDocInterface extends  DBOptionListInterface, Document{ }
export interface CatalogDocInterface extends CatalogInterface, Document{ }


export class Database {
	private TOKEN = process.env.TOKEN || "abcdefghijklmnopqrstuvwxyz";
	private DB_NAME = process.env.DB_NAME || this.TOKEN;
	private MONGODB_ADDRESS = process.env.MONGODB_ADDRESS || "mongodb://localhost:27017/" + this.DB_NAME;

	public mongoInstance: mongoose.Connection = null;

	constructor() {
		if (process.env.NODE_ENV === 'development') {
			mongoose.set('debug', true);
		}
		mongoose.set('bufferCommands', false);
		// this.mongoInstance = this.connectMongoDB(this.MONGODB_ADDRESS);
	}

	public async connectMongoDB() {
		try {
			await mongoose.connect(this.MONGODB_ADDRESS, {
				useNewUrlParser: true,
				bufferMaxEntries: 0,
				autoReconnect: true,
				poolSize: 5
			});

			const db = mongoose.connection
			db.on('error', (error) => {
				console.log(`MongoDB connecting failed: ${error}`);
			});
			db.once('open', () => {
				console.log('MongoDB connecting succeeded');
			});
			this.mongoInstance = db;
			return Promise.resolve(db);
		} catch (error) {
			console.error(`MongoDB connecting failed: ${error}`);
			return Promise.reject(error);
		}
	}
}
