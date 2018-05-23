var yard_1_open = 9;
var yard_1_close = 20;
var allow_pickup = new Boolean(false);

function check_avaliable(var time){
	if(time>yard_1_open&&time<yard_1_close){
		allow_pickup = true;
	}
	
	document.write(‘The truck can able to pick up or drop off right now’);
	//May be implement other function to allow dispatch manager operating on website
}

