const mongoose = require("mongoose");
const URI = process.env.MONGO_URI;
const connect = mongoose.connect(URI);
module.exports = connect;
