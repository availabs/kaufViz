var naicsLib = require('../data/naicsKey');

module.exports = {
	getColor:function(naics){
		if(naics){
			var twoDigitNaics = ['11','22','23','31-33','42','44-45','48-49','51','52','53','54','55','56','61','62','71','72','81'],
				delta 	= 360 / twoDigitNaics.length,
				n 		= twoDigitNaics.length,
				offset 	= 0,
				c 		= 30,
				l 		= 70;

			var colors = twoDigitNaics.map(function(d,i){
				return d3.hcl((i*delta+offset)%360,c,l)
			})

			var color = d3.scale.category20()
				.domain(twoDigitNaics)
				

			var cluster = naics.substr(0,2)
			if(cluster !== '--' && naicsLib[cluster].part_of_range){
				cluster =  naicsLib[cluster].part_of_range;
			}
			

			var lumScale = d3.scale.linear()
			.domain([0,100])
			.range([0,40])


			//console.log('cluster',naics.length)
			var ind = d3.hcl(color(cluster))
			if(naics.length === 4){
					
				//ind.c =  chromScale(Math.round(naics.substr(2,2)))
				//ind. = lumScale(Math.round(naics.substr(2,2))*100)
				ind.c = ind.c+Math.round(naics.substr(2,2))


			}else if(naics.length === 6){

				//ind.c =  ind.c + Math.round(naics.substr(2,2))
				//console.log('l',Math.round(naics.substr(4,2))%100)
				ind.c = ind.c + Math.round(naics.substr(2,2))
				ind.l = ind.l + lumScale(Math.round(naics.substr(4,2))) 
				//ind.l = Number(naics.substr(4,6))
					
			}
			
			return ind
		}
		return '#fff'
	},
}