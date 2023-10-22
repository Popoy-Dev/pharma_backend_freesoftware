require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require("cors");
const Order = require('../models/orders')


const app = express()
const PORT = process.env.PORT || 3000
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: '*', // Allow requests from any origin (for development/testing only)
}));


mongoose.set('strictQuery', false);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb+srv://popoykua28:7pNUFGDof2Z041h9@cluster0.ouifla3.mongodb.net/', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
        console.log(`Mongodb Connected: ${conn.connection.host}`)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}


app.post('/add', async (req, res, next) => {

    const { cartList, customerMoney, total } = req.body;

    const product = new Order({
        cartList,
    });

    product.save().then(() => {
        console.log('Product saved successfully!');
    }).catch((err) => {
        console.log(err);
    });

    const escpos = require('escpos');
    escpos.USB = require('escpos-usb');
    // Select the adapter based on your printer type
    const device = new escpos.USB();
    const options = { encoding: "GB18030" /* default */ }

    const printer = new escpos.Printer(device, options);
    device.open(function (error) {
        res.send("Something went wrong.", error)
        console.log('error', error)
        printer
            .font('B')
            .align('ct')
            .size(.1, .1)
            .text('Fayne Pharmacy')
        cartList.map(async (item) => {
            printer
                .table([`${item.product_name} (${item.quantity} x ${item.selling_price})  `, ` ${item.quantity * item.selling_price}`])
                .size(.1, .1)


        })
        printer
            .font('B')
            .align('ct')
            .size(2, 1)
            .text('')
            .text('')
            .close();
    });

})

app.get('/allOrder', async (req, res) => {

    const orders = await Order.find()
    if (orders) {
        res.json(orders)
    } else {
        res.send("Something went wrong.")
    }
})


connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Listen on port ${PORT}`)
    })

})