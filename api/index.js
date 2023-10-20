require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require("cors");
const Printer = require('node-thermal-printer');
const Order = require('../models/orders')


const app = express()
const PORT = process.env.PORT || 3000
const bodyParser = require('body-parser');
const Types = require("node-thermal-printer").types;
const electron = typeof process !== 'undefined' && process.versions && !!process.versions.electron;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: '*', // Allow requests from any origin (for development/testing only)
}));
const printer = new Printer.ThermalPrinter({
    type: Types.EPSON, // Printer type: 'star' or 'epson'
    interface: 'printer:XP-58 (copy 3)', // Printer
    // eslint-disable-next-line import/no-dynamic-require, global-require
    driver: require('electron-printer'),
});

mongoose.set('strictQuery', false);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
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

    const isConnected = await printer.isPrinterConnected();
    if (isConnected) {
        console.log('isConnected', isConnected)
        printer.openCashDrawer();
        printer.clear();

        cartList.map(async (item) => {
            printer.bold(false);
            printer.alignLeft();
            printer.print(String(`${item.product_name} (${item.quantity} x ${item.selling_price}) `));
            printer.bold(true);
            printer.print(String(`${item.quantity * item.selling_price}`));
            printer.newLine();
        });
        printer.alignRight();
        printer.print(String(`Customer Money: ${customerMoney}`));
        printer.newLine();
        printer.print(String(`Total: ${total}`));
        printer.newLine();
        await printer.execute();
        res.status(201).json({ msg: "Print successfully" });
    } else {
        res.status(500).json({ msg: "printer is not connected" })
    }

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