const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const AdvertisementSchema = new Schema({
  title: String,
  genericName: String,
  image: String,
  price: String,
  shopName: String,
  contact: String,
});

module.exports = mongoose.model('Advertisement', AdvertisementSchema);