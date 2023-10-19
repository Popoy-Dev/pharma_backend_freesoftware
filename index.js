require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const Order = require('./models/orders')

const app = express()
const PORT = process.env.PORT || 3000

mongoose.set('strictQuery', false);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`Mongodb Connected: ${conn.connection.host}`)
    }catch(error) {
    console.log(error)
    process.exit(1)
    }
}


app.post('/add',  async (req, res) => {
    const ordersData = [
        {
          category: "Branded",
          id: "02e9fa7c-b1fe-47a0-b356-48d5c9c10916",
          indication: "e",
          isVat: "Vat",
          key: "02e9fa7c-b1fe-47a0-b356-48d5c9c10916-0.32742251638409914",
          manufacture_price: 4,
          product_name: "et",
          quantity: 1,
          selling_price: 5,
          senior_selling_price: null,
          stockTotal: 2224
        }
      ];
    try {
        await Order.insertMany(ordersData)
    }catch(error) {
        console.log
    }
    res.send({title: 'Books'})
})
app.get('/allOrder',async (req, res) => {
   const orders =  await Order.find()
    if(orders) {
        res.json(orders)
    }else {
    res.send("Something went wrong.")
}
})


connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Listen on port ${PORT}`)
    })

})