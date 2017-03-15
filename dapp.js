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

function requestBacking(centamount,cb) {
    var html="";
	html+='<div class="row">';
	html+='<div class="col-md-4">';
	html+="<h2>Einzahlung (Euro)</h2>";
	html+="<table class='table table-condensed'>";
	html+="<tr><th>Aktueller Kontostand</th><td align='right'><span class='sko_saldo'>-,--</span> €</td></tr>";
	html+="<tr><th>- Angeforderte Deckung</th><td align='right'><span class='sko_req'>-,--</span> €</td></tr>";
	html+="<tr><th>= </th><td align='right'><span class='sko_mis'>-,--</span> €</td></tr>";
	html+="</table>";	
	html+='</div>';
	html+='<div class="col-md-4">';
	html+="<h2>Guthaben (Ether)</h2>";
	html+="<table class='table table-condensed'>";
	html+="<tr><th>Ether Wallet</th><td align='right'><span class='eth_saldo'>-,--</span> ETH</td><td align='right'><span class='eth_eur'>-,--</span> €</td></tr>";	
	html+="<tr><th>Angeforderte Deckung</th><td align='right'><span class='eth_mis'>,-,--</span> ETH</td><td align='right'><span class='sko_mis'>,-,--</span> €</td></tr>";	
	html+="<tr><th>Transferbetrag</th><td align='right'><span class='eth_trans'>-,--</span> ETH</td><td align='right'><span clasS='sko_trans'>-,--</span> €</td></tr>";
	html+="</table>";
	html+="<button id='cancelTrans' class='btn btn-danger'>Abbruch</button>&nbsp;<button id='transSKO' class='btn btn-primary'></button>";
	html+='</div>';
	
	$('#app_connectState').html(html);
	renderSKOSaldo();
	$('.sko_req').html(convertCentToEur(centamount));
	$('.sko_mis').html(convertCentToEur(sko.saldo-centamount));
	web3.eth.getBalance(sko.account,function(err,o) {
			eth_cent=web3.fromWei(o, 'finney')/10;
			eth_wei=o.toString();
			$('.eth_saldo').html(convertCentToEur(eth_cent));
			sko.sci_xch.xrate(function(err,o) {					   				   
					var wei=o.toString();	
					var eur=(eth_wei/wei);
					$('.eth_eur').html(convertCentToEur(eur));
					var mis=Math.abs((sko.saldo-centamount)*(web3.fromWei(o, 'finney')/10));					
					$('.eth_mis').html(convertCentToEur(mis));
					var trans=eth_cent;
					var trans_eur=(sko.saldo-centamount);
					console.log(trans);
					if(trans>mis)  { 
						trans=mis;
						trans_eur=eur;
					}
					
					$('.eth_trans').html(convertCentToEur(trans));
					$('.sko_trans').html(convertCentToEur(trans_eur));					
					
					$('#transSKO').html("<strong>"+convertCentToEur(trans)+"</strong> ETH transferieren");
					$('#cancelTrans').click(function() {
								location.reload();
					});
					$('#transSKO').click(function() {
							var data = {
								value:web3.toWei(trans/100, 'ether'),
								from:sko.account
							};
							sko.sci_xch.buyEuro(wei,data,function(err,o) {
									console.log(err,o);
									// Do something cool... (Like User Feedback :) )
									// User Feedback via "o" = Has
									cb();
							});							
					});
			});
	});	
	cb();
}

var $_GET = getQueryParams(document.location.search);

Number.prototype.format = function(n, x, s, c) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
        num = this.toFixed(Math.max(0, ~~n));

    return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
};
fnctConnectState=function() {
	var html="";
	if(sko.state==0) {
			html+='<div id="tablist" data-target="#connectStateTabs">';
			html+="<h2>Bewirtschaftung</h2>";
			html+='<ul class="nav nav-tabs" id="connectStateTabs" role="tablist">';
			html+='<li role="presentation" class="active"><a href="#cStrom" role="tab" data-toggle="tab">Stromlieferung (Entnahme)</a></li>';
			html+='<li role="presentation"><a href="#cEinspeisung" role="tab" data-toggle="tab">Einspeisung</a></li>';
			html+='<li role="presentation"><a href="#cHybridstrom" role="tab" data-toggle="tab">Hybridstrom</a></li>';
			html+='<li role="presentation"><a href="#cSonstiges" role="tab" data-toggle="tab">Sonstiges</a></li>';
			html+="</ul>";		
			html+="<div class='tab-content'>";
			html+="<div class='col-md-4'>";
			html+='<div class="tab-pane fade in active" role="tabpanel" id="cStrom" style="margin-top:10px;">';
			html+="<div class='input-group'>";
			html+="<span class='input-group-addon' id='desc-plz'>Postleitzahl</span> <input type='text' name='plz' id='plz' class='form-control'  aria-describedby='desc-plz'/><span class='input-group-btn'><button class='btn btn-primary' id='checkTarif' disabled='disabled'>abrufen</button></span>";
			html+="</div>  <div id='tarifInfo'></div>";
			//html+="</div>";
			html+="</div>";
			html+='<div class="tab-pane fade" role="tabpanel" id="cEinspeisung">';
			html+="<p>Einspeisung</p>";
			html+="</div>";
			html+="</div>";
	}

	setTimeout(function() {
		$.getJSON("https://gist.githubusercontent.com/zoernert/a7f0169dd9fcd170b2b5a9ad6f113074/raw/cf8f557e931916d078910d46262f8a8cfcc07048/stromdao_tarif.json",function(o) {
			sko.tarife=o;
			$('#checkTarif').removeAttr('disabled');
			$('#checkTarif').click(function(e) {
					var html="";
					var angebot={};
					if(typeof sko.tarife["p"+$('#plz').val()] != "undefined") {
							html+='<h4>Lieferant: <span style="color:#909090">StromDAO Ltd (Demo)</span></h4>';
							html+='<table class="table"><tr><th>Grundpreis:</th><td>'+convertCentToEur(sko.tarife["p"+$('#plz').val()].g*100)+'€</td><td> pro Jahr</td></tr><tr><th>Arbeitspreis:</th><td>0,'+(sko.tarife["p"+$('#plz').val()].a*100)+'€</td><td>je KWh</td></tr></table>';
							angebot.initLoad=Math.round(Math.round(((sko.tarife["p"+$('#plz').val()].g*100)/12)+(sko.tarife["p"+$('#plz').val()].a*10000))/100);
							html+="<button class='btn btn-primary' id='angebotSign'>Angebot annehmen (<strong>"+convertCentToEur(angebot.initLoad)+"€</strong> Deckung notwendig)</button>";
							angebot.a=sko.tarife["p"+$('#plz').val()].a;
							angebot.g=sko.tarife["p"+$('#plz').val()].g;
							angebot.plz=$('#plz').val();
							angebot.blk='0x9d9548d12FF9BaFE79cF3dD3191a9C8b42304347';						
					}
					$('#tarifInfo').html(html);
					$('#angebotSign').click(function() {
						requestBacking(angebot.initLoad,function() { console.log(angebot);});
					});
					e.preventDefault();
			});
			console.log("sko.tarife - Tarifinformationen geladen");
		});
	},100);

	$('#connectStateTabs a').click(function (e) {
	  e.preventDefault()
	  $(this).tab('show')
	})
	$('#app_connectState').html(html);
	if(sko.state==0) {
		$('#cStrom').tab('show');
	}

}
function convertCentToEur(t) {
   v=t.toString();
      
      v=v/100;
  return v.format(2,0,'.',',');
}



function loadETHtoSKO() {
	
	 // Kurs für einen EURO Cent
	sko.sci_xch.xrate(function(err,o) {	
	   // 0,05 ETH = 1 EUR 
	   
		var wei=o.toString();
		var data = {
			value:wei,
			from:sko.account
		};
		sko.sci_xch.buyEuro(wei,data,function(err,o) {console.log(err,o);});
	}		
	);
	
	
}

function renderSKOSaldo() {

	var sc_sko = web3.eth.contract([{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"},{"name":"_txt","type":"string"}],"name":"addTx","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_balancer","type":"address"}],"name":"setBalancer","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_owner","type":"address"}],"name":"transferOracleOwnership","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"oracles","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceHaben","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceSoll","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"BalancerOracle","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_oracle","type":"address"}],"name":"addOracle","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"balancer","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_oracle","type":"address"}],"name":"removeOracle","outputs":[],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_from","type":"address"},{"indexed":false,"name":"_to","type":"address"},{"indexed":false,"name":"_value","type":"uint256"},{"indexed":false,"name":"_txt","type":"string"}],"name":"Tx","type":"event"}]);
	
	var sci_sko = sc_sko.at('0xc3Ef562cc403c8f9Edf7c3826655fBF50F4ddDE8');
	sci_sko.balanceHaben(sko.account,function(err,o) {
		var haben = o.toString();
		sci_sko.balanceSoll(sko.account,function(err,o) { 
			var soll = o.toString();
			var saldo = haben-soll;
			$('.sko_saldo').html(convertCentToEur(saldo));
			sko.saldo=saldo;
		});	
	});	
	
}
function renderUI() {	
	if(typeof $_GET["a"] != undefined) {	
			sko.account=$_GET["a"];
	} else {
			sko.account=web3.eth.coinbase;
	}
	
	renderSKOSaldo();
	var html="";
	for(var i=0;i<web3.eth.accounts.length;i++) {
		html+="<li><a href='?a="+web3.eth.accounts[i]+"'>"+web3.eth.accounts[i]+"</a></li>";
	}
	html+="<li><form class='form-control' id='frmAccount'><input type='text' id='txtAccount' name='a'><button type='submit' class='btn btn-xsl' id='btnAccount'>öffnen</button></form></li>";
	$('#accountList').html(html);
	$('#btnAccount').click(function() {
		location.replace="?a="+$('#txtAccount').val();		
	});
	
	var cs_sko =  web3.eth.contract([{"constant":false,"inputs":[{"name":"target","type":"address"},{"name":"_state","type":"uint8"}],"name":"setState","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"stateOf","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"target","type":"address"},{"indexed":false,"name":"state","type":"uint8"}],"name":"stateChange","type":"event"}]);
	
	var csi_sko = cs_sko.at('0x4c62Fd28a0E3511bCaE4b6921645b67C60B63499');
	csi_sko.stateOf(sko.account,function(err,o) {
		var state = o.toString();
		sko.state=state;
		if(state==0) {
					$('#connectState').removeClass('btn-default');
					$('#connectState').addClass('btn-danger');
					$('#connectState').html("Kein Anschlussvertrag");
					disabled=true;
					for(var i=0;i<web3.eth.accounts.length;i++) {
						if(sko.account==web3.eth.accounts[i]) disabled=false;
					}					
					if(disabled) {
						$('#connectState').attr('disabled','disabled');
						$('#connectState').attr('title','Aktueller Account ist nicht unterschriftsberechtigt!');
					} else {
					$('#connectState').click(fnctConnectState);
					}
					
		}
		console.log(state);
	});	
}
function initBootstrap() {

sko.sc_xch =  web3.eth.contract([
		  {
			"constant": true,
			"inputs": [],
			"name": "stromkonto",
			"outputs": [
			  {
				"name": "",
				"type": "address"
			  }
			],
			"payable": false,
			"type": "function"
		  },
		  {
			"constant": true,
			"inputs": [],
			"name": "xrate",
			"outputs": [
			  {
				"name": "",
				"type": "uint256"
			  }
			],
			"payable": false,
			"type": "function"
		  },
		  {
			"constant": false,
			"inputs": [
			  {
				"name": "eurocentpereth",
				"type": "uint256"
			  }
			],
			"name": "setBuyPrice",
			"outputs": [],
			"payable": false,
			"type": "function"
		  },
		  {
			"constant": true,
			"inputs": [],
			"name": "owner",
			"outputs": [
			  {
				"name": "",
				"type": "address"
			  }
			],
			"payable": false,
			"type": "function"
		  },
		  {
			"constant": false,
			"inputs": [],
			"name": "buyEuro",
			"outputs": [],
			"payable": true,
			"type": "function"
		  },
		  {
			"constant": false,
			"inputs": [
			  {
				"name": "_stromkonto",
				"type": "address"
			  }
			],
			"name": "setStromkonto",
			"outputs": [],
			"payable": false,
			"type": "function"
		  },
		  {
			"constant": false,
			"inputs": [
			  {
				"name": "newOwner",
				"type": "address"
			  }
			],
			"name": "transferOwnership",
			"outputs": [],
			"payable": false,
			"type": "function"
		  },
		  {
			"inputs": [
			  {
				"name": "_stromkonto",
				"type": "address"
			  }
			],
			"payable": false,
			"type": "constructor"
		  }
		]);
			
sko.sci_xch = sko.sc_xch.at('0xf28fd834900Af9e42A611b07CD0FAfbb949c7f29');

renderUI();
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
				setTimeout(initBootstrap(),300);
			}
		}
	}	
	
}

$(document).ready(checkWeb3Ready());