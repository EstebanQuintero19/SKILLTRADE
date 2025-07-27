require('dotenv').config();
const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const URI = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@adso2873441.ex6dvxq.mongodb.net/${process.env.DB_NAME}`;

mongoose.connect(URI);

module.exports = mongoose;  