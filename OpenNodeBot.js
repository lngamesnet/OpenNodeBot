const opennode = require('opennode');
const TelegramBot = require('node-telegram-bot-api');

opennode.setCredentials('YOUR_OPENNODE_READONLY_API_KEY');

const telegram_token = process.env.TELEGRAM_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN'				// Your Telegram Bot Token.
const telegram_id = process.env.TELEGRAM_ID || 'YOUR_TELEGRAM_USER_ID'						// Your Telegram User ID.

const telegram_options = {
  polling: true
};

const bot = new TelegramBot(telegram_token, telegram_options);

var counter=0
const interval=60000 //milliseconds
const period=60		//period to send balance information.
var firstcheck=true
var previousbalance=0

function check_balance(){
	return new Promise(function(resolve,reject){
		counter++
		console.log("Counter: "+counter)
		opennode.getBalance()
			.then(balance => {
				console.log(balance.balance.BTC);
				if(firstcheck){
					previousbalance=balance.balance.BTC
					firstcheck=false
				}
				if(previousbalance!=balance.balance.BTC){
					var dif=balance.balance.BTC-previousbalance
					previousbalance=balance.balance.BTC
					var messsage_text='*OpenNode WARNING Balance:* '+balance.balance.BTC+' (dif: '+dif+')'
					bot.sendMessage(telegram_id, messsage_text,{parse_mode: 'Markdown'});
				}
				if(counter>=period){
					var messsage_text='*OpenNode Balance:* '+balance.balance.BTC
					bot.sendMessage(telegram_id, messsage_text,{parse_mode: 'Markdown'});
					counter=0					
				}
			})
			.catch(error => {
				console.error(error);
				var messsage_text='*OpenNode Balance:* ERROR!!!!'
				bot.sendMessage(telegram_id, messsage_text,{parse_mode: 'Markdown'});
			});
	})
}

setInterval(check_balance, interval);


bot.onText(/\/opennode/, (msg) => {
	if(msg.chat.id==telegram_id){ //only accepts commands from your telegram id.
		bot.sendMessage(msg.chat.id, '*OPENNODE BALANCES:*',{parse_mode: 'Markdown'});
		opennode.getBalance()
			.then(balance => {
				console.log(balance.balance);
				var messsage_text='*Balance:* '+balance.balance.BTC+' sats' 
				bot.sendMessage(msg.chat.id, messsage_text,{parse_mode: 'Markdown'});
				opennode.listCharges()
					.then(charges => {
						var charges_amt=0
						for(var i=0; i< charges.length; i++){
							charges_amt=charges_amt+charges[i].amount
						}
						console.log(charges_amt)
						var messsage_text='*Charges:* '+charges.length+ ' ('+charges_amt+' sats)' 
						bot.sendMessage(msg.chat.id, messsage_text,{parse_mode: 'Markdown'});			
						opennode.listWithdrawals()
							.then(withdrawals => {
								var with_amt=0
								for(var i=0; i< withdrawals.length; i++){
									with_amt=with_amt+withdrawals[i].amount
								}
								var messsage_text='*Withdrawals:* '+withdrawals.length+' ('+with_amt+' sats)' 
								bot.sendMessage(msg.chat.id, messsage_text,{parse_mode: 'Markdown'});
							})
							.catch(error => {
								console.error(error);
								var messsage_text='*OpenNode Charges:* ERROR!!!!'
								bot.sendMessage(telegram_id, messsage_text,{parse_mode: 'Markdown'});
							});

					})
					.catch(error => {
						console.error(error);
						var messsage_text='*OpenNode Charges:* ERROR!!!!'
						bot.sendMessage(telegram_id, messsage_text,{parse_mode: 'Markdown'});
					});
	
			})
			.catch(error => {
				console.error(error);
				var messsage_text='*OpenNode Balance:* ERROR!!!!'
				bot.sendMessage(telegram_id, messsage_text,{parse_mode: 'Markdown'});
			});
	}
})