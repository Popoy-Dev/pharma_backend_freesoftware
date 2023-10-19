require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require("cors");
const Printer = require('node-thermal-printer');
const Order = require('./models/orders')

app.use(cors())
const app = express()
const PORT = process.env.PORT || 3000
const bodyParser = require('body-parser');
const Types = require("node-thermal-printer").types;
const electron = typeof process !== 'undefined' && process.versions && !!process.versions.electron;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const printer = new Printer.ThermalPrinter({
    type: Types.EPSON, // Printer type: 'star' or 'epson'
    interface: 'printer:XP-58 (copy 3)', // Printer
    // eslint-disable-next-line import/no-dynamic-require, global-require
    driver: require(electron ? 'electron-printer' : 'printer'),
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
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
    const { cartList, customerMoney, total } = req.body;

    const isConnected = await printer.isPrinterConnected();
    if (isConnected) {
      console.log('isConnected', isConnected)
      printer.openCashDrawer();
      printer.clear();

      cartList.map(async (item) => {
        console.log(item);
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

    try {
        await Order.insertMany(cartList)
    } catch (error) {
        console.log(error)
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