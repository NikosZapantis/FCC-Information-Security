const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
 // Testing for single stock price request
 test('Stock price with valid stock symbol', function(done) {
    chai.request(server)
      .get('/api/stock-prices?stock=AAPL') // Replacing 'AAPL' with a valid stock symbol
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'stockData');
        assert.property(res.body.stockData, 'stock');
        assert.property(res.body.stockData, 'price');
        assert.isNumber(res.body.stockData.price);
        done();
      });
  });

  // Testing for multiple stocks request
  test('Stock prices with multiple stock symbols', function(done) {
    chai.request(server)
      .get('/api/stock-prices?stock=AAPL&stock=GOOG') // Replacing with valid stock symbols
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body.stockData);
        assert.equal(res.body.stockData.length, 2);
        assert.property(res.body.stockData[0], 'stock');
        assert.property(res.body.stockData[1], 'stock');
        assert.property(res.body.stockData[0], 'price');
        assert.property(res.body.stockData[1], 'price');
        done();
      });
  });

  // Testing for stock price with 'like' query parameter
  test('Stock price with "like" functionality', function(done) {
    chai.request(server)
      .get('/api/stock-prices?stock=AAPL&like=true') // Replacing with a valid stock symbol
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body.stockData, 'likes');
        assert.isNumber(res.body.stockData.likes);
        done();
      });
  });

  // Testing for invalid stock symbol
  test('Stock price with invalid stock symbol', function(done) {
    chai.request(server)
      .get('/api/stock-prices?stock=INVALID') // Invalid stock symbol
      .end(function(err, res) {
        assert.equal(res.status, 404);
        assert.property(res.body, 'error');
        assert.equal(res.body.error, 'Stock not found');
        done();
      });
  });

  // Testing for "like" from the same IP
  test('Stock "like" functionality with duplicate IP', function(done) {
    chai.request(server)
      .get('/api/stock-prices?stock=AAPL&like=true') // Replacing with a valid stock symbol
      .end(function(err, res) {
        assert.equal(res.status, 200);
        const firstLikeCount = res.body.stockData.likes;
        
        // Try liking again from the same IP
        chai.request(server)
          .get('/api/stock-prices?stock=AAPL&like=true')
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.body.stockData.likes, firstLikeCount); // Like count should not increase
            done();
          });
      });
  });
});
