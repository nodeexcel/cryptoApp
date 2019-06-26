var express = require('express');
var router = express.Router();
var axios = require('axios');
var request = require('request');

let coins = [{
  coinName: 'Bitcoin',
  symbol: 'BTC',
  address: 'https://blockchain.coinmarketcap.com/api/addresses?start=1&limit=10',
}, {
  coinName: 'Litecoin',
  symbol: 'LTC',
  address: 'https://blockchain.coinmarketcap.com/api/addresses?start=1&limit=10',
}, {
  coinName: 'Ethereum',
  symbol: 'ETH',
  address: 'https://blockchain.coinmarketcap.com/api/addresses?start=1&limit=10',
}, {
  coinName: 'Bitcoin Cash',
  symbol: 'bitcoincash',
  balanceAddr: 'https://blockdozer.com/insight-api/addr/',
  trxAddr: 'https://blockdozer.com/insight-api/txs'
}, {
  coinName: 'Bitcoin SV',
  symbol: 'bitcoin-sv',
  balanceAddr: 'https://api.blockchair.com/{:chain}/dashboards/address/{:address}',
  trxAddr: 'https://api.blockchair.com/{:chain}/dashboards/transaction/{txhash}'
}, {
  coinName: 'Doge Coin',
  symbol: 'dogecoin',
  balanceAddr: 'https://api.blockchair.com/{:chain}/dashboards/address/{:address}',
  trxAddr: 'https://api.blockchair.com/{:chain}/dashboards/transaction/{txhash}'
}, {
  coinName: 'Dash',
  symbol: 'dash',
  balanceAddr: 'https://api.blockchair.com/{:chain}/dashboards/address/{:address}',
  trxAddr: 'https://api.blockchair.com/{:chain}/dashboards/transaction/{txhash}'
}, {
  coinName: 'Gro Estl Coin',
  symbol: 'groestlcoin',
  balanceAddr: 'https://api.blockchair.com/{:chain}/dashboards/address/{:address}',
  trxAddr: 'https://api.blockchair.com/{:chain}/dashboards/transaction/{txhash}'
}]
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { coins: coins, title: "Cypto App", information: null });
});

router.post('/fetchAddress', async (req, res, next) => {
  let coinSymbol = req.body.coinName;
  let address = req.body.address;
  let data = {}
  let details = coins.filter((val, key) => { return val.symbol == coinSymbol })[0];
  if (coinSymbol == 'bitcoincash') {
    let balanceAddr = details.balanceAddr + `${coinSymbol}:${address}?noTxList=1`;
    let trxAddr = details.trxAddr + `?address=${coinSymbol}:${address}&pageNum=0`;
    let trxResponse = await axios.get(trxAddr);
    trxResponse = trxResponse.data;
    let response = await axios.get(balanceAddr);
    response = response.data;
    data['balance'] = response.balanceSat;
    data['amountSent'] = response.totalSentSat;
    data['amountReceived'] = response.totalReceivedSat
    data['hash'] = trxResponse.txs[0].txid;
    data['date'] = trxResponse.txs[0].time;
    data['fee'] = trxResponse.txs[0].fees;
    data['from'] = address;
    data['to'] = trxResponse.txs[0].vin[0].addr;
  } else if (coinSymbol == 'groestlcoin' || coinSymbol == 'dash' || coinSymbol == 'dogecoin' || coinSymbol == 'bitcoin-sv') {
    let balanceAddr = details.balanceAddr.replace('{:chain}', coinSymbol).replace('{:address}', address);
    let balanceResponse = await axios(balanceAddr)
    balanceResponse = balanceResponse.data;
    if (balanceResponse.data[address].transactions.length) {
      let transactionId = balanceResponse.data[address].transactions[0];
      let trxAddr = details.trxAddr.replace('{:chain}', coinSymbol).replace('{txhash}', transactionId);
      let trxResponse = await axios.get(trxAddr);
      trxResponse = trxResponse.data;
      data = {
        balance: balanceResponse.data[address].address.balance,
        amountSent: balanceResponse.data[address].address.spent,
        amountReceived: balanceResponse.data[address].address.received,
        hash: trxResponse.data[transactionId].transaction.hash,
        date: trxResponse.data[transactionId].transaction.date,
        fee: trxResponse.data[transactionId].transaction.fee,
        from: address,
        to: trxResponse.data[transactionId].outputs[0].recipient
      }
    } else {
      data = {
        balance: balanceResponse.data[address].address.balance,
        amountSent: balanceResponse.data[address].address.spent,
        amountReceived: balanceResponse.data[address].address.received,
        hash: null,
        date: null,
        fee: null,
        from: null,
        to: null
      }
    }

  } else {
    let addressDetails = details.address + `&address=${address}&symbol=${coinSymbol}`;
    let response = await axios.get(addressDetails);
    response = response.data
    data = {
      balance: response.data.balance,
      amountSent: response.data.amountSent,
      amountReceived: response.data.amountReceived,
      hash: response.data.txs.length ? response.data.txs[0].hash : null,
      date: response.data.txs.length ? response.data.txs[0].timestamp : null,
      fee: response.data.txs.length ? response.data.txs[0].fee : null,
      from: response.data.txs.length ? response.data.txs[0].from : null,
      to: response.data.txs.length ? response.data.txs[0].to : null
    }
  }
  res.render('index', { coins: coins, title: "Crypto App", information: true, data: data });
})

module.exports = router;
