require('dotenv').config()
const express = require('express')
const dns = require('dns')
const mongoose = require('mongoose')
const cors = require("cors");
const Order = require('../models/orders')
const Ads = require('../models/ads')


const app = express()
const PORT = process.env.PORT || 5012
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({
    origin: '*', // Allow requests from any origin (for development/testing only)
}));


mongoose.set('strictQuery', false);
const checkInternetConnection = () => {
    return new Promise((resolve) => {
        dns.lookup('google.com', (err) => {
            if (err && err.code === "ENOTFOUND") {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
};

const checkDBConnection = async (req, res, next) => {
    const isInternetConnected = await checkInternetConnection();
    if (!isInternetConnected) {
        console.log('No internet')
        return res.status(200).json({ message: 'No internet connection, please try again later.' });
    }

    if (mongoose.connection.readyState !== 1) { // 1 means connected
        console.log('No internet')
        return res.status(200).json({ message: 'Service is currently offline, please try again later.' });
    }

    next();
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect("mongodb+srv://popoykua28:7pNUFGDof2Z041h9@cluster0.ouifla3.mongodb.net/", {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
};


app.post('/add', async (req, res, next) => {
    const currentDate = new Date();

    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Adding 1 to the month because months are zero-based.
    const day = currentDate.getDate().toString().padStart(2, '0');
    const year = currentDate.getFullYear();

    let hours = currentDate.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12; // Convert hours to 12-hour format.

    const minutes = currentDate.getMinutes().toString().padStart(2, '0');

    const formattedDate = `${month}/${day}/${year}`;
    const formattedTime = `${hours}:${minutes} ${ampm}`;


    const { cartList, customerMoney, total, totalRegularPrice, reprint, receiptDetails, id } = req.body;
    if (!reprint || reprint === undefined) {
        console.log('print here because its is new')
        // const product = new Order({
        //     cartList,
        // });
        // product.save().then(() => {
        //     console.log('Product saved successfully!');
        // }).catch((err) => {
        //     console.log(err);
        // });
    }
    const orderNumber = id.substring(id.length - 7)
    const escpos = require('escpos');
    escpos.USB = require('escpos-usb');
    // Select the adapter based on your printer type
    const device = new escpos.USB();
    const options = { encoding: "GB18030" /* default */ }

    const printer = new escpos.Printer(device, options);
    device.open(function (error) {
        console.log('error', error)
        printer
            .cashdraw()
            .font('B')
            .align('ct')
            .size(.18, .1)
            .text(` ${receiptDetails?.pharmacy}`)
        printer
            .size(.01, .01)
            .text('')
        printer
            .size(.065, .065)
            .align('ct')
            .text(` ${receiptDetails?.address}`)
            .text('-------------------------------------')

        printer
            .size(.065, .065)
            .align('LT')
            .text(`TIN #: ${receiptDetails?.tin_no}`)

        printer
            .size(.057, .057)
            .tableCustom(
                [
                    { text: `Cashier: ${receiptDetails?.cashierName}`, align: "LEFT", width: 0.43, style: 'A' },
                    { text: `#: ${orderNumber}`, align: "CENTER", width: 0.27, style: 'A' }
                ],
            )
        printer
            .align('RT')
            .size(.057, .057)
            .text(`${formattedDate} ${formattedTime}`)
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
            .size(.065, .065)
            .text('-------------------------------------')
            .align('ct')
            .text(`For inquiries, please reach out via Viber or give us a call. `)
            .text(`${receiptDetails?.cell_no}`)
            .text(`Acknowledge Receipt`)
            .text(`Jeremiah 29:11`)
        printer
            .font('B')
            .align('ct')
            .size(.065, .065)
            .text('-------------------------------------')
            .text('')
            .close();
    });
    res.json("Success")

})

app.get('/advertisements',checkDBConnection,  async (req, res) => {
    try {
        const advertisements = await Ads.find();
        if (advertisements.length > 0) {
            res.json(advertisements);
        } else {
            res.send("No advertisements found.");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Something went wrong.");
    }
});

app.get('/allOrder',checkDBConnection, async (req, res) => {

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