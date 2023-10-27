const mongoose = require('mongoose')

const Schema = mongoose.Schema;
const OrderSchema = new Schema({
    cartList: [
        {
          id: String,
          product_name: String,
          category: String,
          indication: String,
          manufacture_price: Number,
          selling_price: Number,
          isVat: String,
          stockTotal: Number,
          key: String,
          quantity: Number,
          senior_selling_price: String,
          ownerId: String
        },
      ],
})

module.exports = mongoose.model('Orders', OrderSchema)