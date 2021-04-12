const express = require('express');
const app = express();
const port = process.env.PORT || 4000;
const bodyParser = require('body-parser');
const got = require('got');
app.use(bodyParser.json());
const cors = require('cors');
const corsOptions = {
    origin: ['http://localhost:3000'],
    optionsSuccessStatus: 200
};
const mercadoLibreAPI = {
    baseUrl: 'https://api.mercadolibre.com/',
    searchEndPoint: 'sites/MLA/search',
    itemsEndpoint: 'items'
}
app.use(cors(corsOptions));
//Server startup
app.listen(port, () => {
    console.log('Server started!')
});
//GET all items
app.route('/api/items').get(async (req, res) => {
    const queryParams = {query: req.query.q || '', limit: req.query.limit || 5}
    const callUrl = `${mercadoLibreAPI.baseUrl}${mercadoLibreAPI.searchEndPoint}?q=${queryParams.query}&limit=${queryParams.limit}`
    console.log(callUrl)
    try {
        const searchRes = await got(callUrl);
        const body = JSON.parse(searchRes.body)
        const results = body.results.map(
            ({
                 id,
                 title,
                 price,
                 currency_id,
                 thumbnail,
                 condition,
                 shipping,
                 sold_quantity,
                 address
             }) => ({
                id,
                title,
                price: {currency: currency_id, amount: price},
                picture: thumbnail,
                condition,
                free_shipping: shipping.free_shipping,
                sold_quantity,
                location: address.city_name
            }))
        const response = {...getBaseResponse(), items: results}
        res.send(response)
    } catch (e) {
        console.error('Exception', e)
        res.status(500).send({error: e, message: 'Hubo un error en el api'})
    }


});


//GET One Item
app.route('/api/items/:id').get(async (req, res) => {
    const itemId = String(req.params.id);
    const callUrl = `${mercadoLibreAPI.baseUrl}${mercadoLibreAPI.itemsEndpoint}/${itemId}`
    console.log(callUrl)
    try {
        let apiRes = await Promise.all([
            got(callUrl),
            got(`${callUrl}/description`)
        ]);
        const resItem = JSON.parse(apiRes[0].body)
        const resDesc = JSON.parse(apiRes[1].body)
        const item = {
            id: resItem.id,
            title: resItem.title,
            price: {currency: resItem.currency_id, amount: resItem.price},
            picture: resItem.thumbnail,
            condition: resItem.condition,
            free_shipping: resItem.shipping.free_shipping,
            sold_quantity: resItem.sold_quantity,
            description: resDesc.plain_text
        }
        const response = {...getBaseResponse(), item}
        res.send(response)
    } catch (e) {
        console.error('Exception', e)
        res.status(500).send({error: e, message: 'Hubo un error en el api'})
    }
});

function getBaseResponse() {
    return {
        author: {
            name: 'Santiago',
            lastName: 'Murillo'
        }
    }
}
