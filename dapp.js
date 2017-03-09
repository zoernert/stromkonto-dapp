var web3;
var sko = {};

function getQueryParams(qs) {
    qs = qs.split("+").join(" ");
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])]
            = decodeURIComponent(tokens[2]);
    }

    return params;
}

var $_GET = getQueryParams(document.location.search);

Number.prototype.format = function(n, x, s, c) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
        num = this.toFixed(Math.max(0, ~~n));

    return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
};

function convertCentToEur(t) {
   v=t.toString();
      
      v=v/100;
  return v.format(2,0,'.',',');
}

function renderUI() {	
	if(typeof $_GET["a"] != undefined) {	
			sko.account=$_GET["a"];
	} else {
			sko.account=web3.eth.coinbase;
	}
	
	var sc_sko = web3.eth.contract([{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_txt","type":"string"}],"name":"addTx","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_balancer","type":"address"}],"name":"setBalancer","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_owner","type":"address"}],"name":"transferOracleOwnership","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"oracles","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceHaben","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceSoll","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"BalancerOracle","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_oracle","type":"address"}],"name":"addOracle","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"balancer","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_oracle","type":"address"}],"name":"removeOracle","outputs":[],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_from","type":"address"},{"indexed":false,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"},{"indexed":false,"name":"_txt","type":"string"}],"name":"Tx","type":"event"}]);
	
	var sci_sko = sc_sko.at('0xc3Ef562cc403c8f9Edf7c3826655fBF50F4ddDE8');
	sci_sko.balanceHaben(sko.account,function(err,o) {
		var haben = o.toString();
		sci_sko.balanceSoll(sko.account,function(err,o) { 
			var soll = o.toString();
			var saldo = haben-soll;
			$('.sko_saldo').html(convertCentToEur(saldo));
		});	
	});	
	var html="";
	for(var i=0;i<web3.eth.accounts.length;i++) {
		html+="<li><a href='?a="+web3.eth.accounts[i]+"'>"+web3.eth.accounts[i]+"</a></li>";
	}
	html+="<li><form class='form-control' id='frmAccount'><input type='text' id='txtAccount'></form></li>";
	$('#accountList').html(html);
	$('#frmAccount').submit(function(event) {
		location.replace="?a=".$('#txtAccount').val();
		event.preventDefault();
	});
}

function checkWeb3Ready() {
	if(typeof Web3 == "undefined") {
			console.log(".");
			setTimeout("checkWeb3Ready();",300);
	} else {	
		if(typeof web3 == "undefined") {
			web3 = new Web3(web3.currentProvider);
			setTimeout("checkWeb3Ready();",300);
		} else {
			if(web3.eth.accounts.length<1) {
				setTimeout("checkWeb3Ready();",300);	
			} else {
				setTimeout(renderUI(),300);
			}
		}
	}	
	
}

$(document).ready(checkWeb3Ready());