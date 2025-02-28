'use strict';
const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const StockModel = require('../models').Stock;
const crypto = require('crypto'); // For IP anonymization

async function getStock(stock) {
  try {
    const response = await fetch(
      `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`
    );
    const data = await response.json();
    if (!data || !data.symbol) throw new Error('Invalid stock symbol');
    return { symbol: data.symbol, latestPrice: data.latestPrice };
  } catch (error) {
    return null; // Return null if stock not found or API error
  }
}

module.exports = function (app) {
  app.route('/api/stock-prices').get(async function (req, res) {
    let { stock, like } = req.query;
    if (!stock) return res.status(400).json({ error: 'Stock query is required' });

    // Converting stock to an array (if one stock is provided, make it an array of one element)
    const stocks = Array.isArray(stock) ? stock : [stock];

    // Getting IP and hash it to anonymize
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');

    let stockData = [];

    for (let i = 0; i < stocks.length; i++) {
      const stockSymbol = stocks[i].toUpperCase(); // Ensuring uppercase consistency

      const stockInfo = await getStock(stockSymbol);
      if (!stockInfo) {
        return res.status(404).json({ error: 'Stock not found', stock: stockSymbol });
      }

      let stockDoc = await StockModel.findOne({ stock: stockSymbol });

      if (!stockDoc) {
        stockDoc = new StockModel({ stock: stockSymbol, likes: [] });
        await stockDoc.save();
      }

      // Handling likes (prevent duplicate likes from same IP)
      if (like === 'true' && !stockDoc.likes.includes(hashedIp)) {
        stockDoc.likes.push(hashedIp);
        await stockDoc.save();
      }

      stockData.push({
        stock: stockInfo.symbol,
        price: stockInfo.latestPrice,
        likes: stockDoc.likes.length,
      });
    }

    // If two stocks, calculating relative likes
    if (stockData.length === 2) {
      const rel_likes = stockData[0].likes - stockData[1].likes;
      stockData = [
        { stock: stockData[0].stock, price: stockData[0].price, rel_likes },
        { stock: stockData[1].stock, price: stockData[1].price, rel_likes: -rel_likes },
      ];
    }

    res.json({ stockData: stocks.length === 1 ? stockData[0] : stockData });
  });
};
