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
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log(`Mongodb Connected: ${conn.connection.host}`)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}


app.post('/add', async (req, res, next) => {

    const { cartList, customerMoney, total, totalRegularPrice } = req.body;

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
        console.log('error', error)
        printer
            .font('B')
            .align('ct')
            .size(.18, .1)
            .text('Fayne Pharmacy')
        printer
            .size(.01, .01)
            .text('')
        printer
            .size(.065, .065)
            .text('006 San Miguel Phase 3 Fortune')
            .text(' Marikina City')
            .text('-------------------------------------')

        cartList.map(async (item) => {
            const formattedValue = (item.quantity * item.selling_price).toFixed(2);

            printer
                .size(.07, .07)
                .tableCustom(
                    [
                        { text: `${item.product_name} (${item.quantity} x ${item.selling_price})  `, align: "LEFT", width: 0.43, style: 'A' },
                        { text: formattedValue, align: "CENTER", width: 0.27, style: 'A' }
                    ],
                )
            printer
                .size(.01, .01)
                .text('')

            

        })
        printer
        .size(.065, .065)
        .font('B')
        .text('-------------------------------------')
        printer
        .size(.07, .07)
        .tableCustom(
            [
                { text: `Items total`, align: "LEFT", width: 0.43, style: 'A' },
                { text: totalRegularPrice, align: "CENTER", width: 0.27, style: 'A' }
            ],
        )
        printer
        .tableCustom(
            [
                { text: `for senior discount`, align: "LEFT", width: 0.43, style: 'A' },
                { text: (totalRegularPrice - total).toFixed(2), align: "CENTER", width: 0.27, style: 'A' }
            ],
        )
        printer
        .size(.065, .065)
        .font('B')
        .text('-------------------------------------')
        printer
        .tableCustom(
            [
                { text: `Total Amount`, align: "LEFT", width: 0.43, style: 'B' },
                { text: total, align: "CENTER", width: 0.27, style: 'B' }
            ],
        )
        printer
        .size(.065, .065)
        .font('B')
        .text('-------------------------------------')
        printer
        .tableCustom(
            [
                { text: `Customer Money`, align: "LEFT", width: 0.43, style: 'A' },
                { text: customerMoney.toFixed(2), align: "CENTER", width: 0.27, style: 'A' }
            ],
        )
        printer
        .size(.07, .07)
        .tableCustom(
            [
                { text: `Change`, align: "LEFT", width: 0.43, style: 'A' },
                { text: (customerMoney.toFixed(2) - total).toFixed(2), align: "CENTER", width: 0.27, style: 'B', size: '.1' }
            ],
        )
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