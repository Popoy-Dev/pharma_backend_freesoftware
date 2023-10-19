const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const OrderSchema = new Schema({
    orders: { type: [String], required: true }
})

module.exports = mongoose.model('Orders', OrderSchema)