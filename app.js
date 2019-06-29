var express = require('express');
var path = require('path');
// var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var defaultRouter = require('./routes/default');
// var usersRouter = require('./routes/users');

var app = express();

const TOKEN = process.env.TOKEN;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/bot_' + TOKEN, indexRouter);
app.use('/', defaultRouter);
// app.use('/users', usersRouter);

module.exports = app;
