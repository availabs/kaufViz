var naicsLib = require('../data/naicsKey'),
	colors = require('./colorScale');


module.exports = {

	renderSunburst:function(data,cb,inWidth,inHeight){
		var data = this.createTree(data),
			scope = this;

		
		var width = inWidth || 300,
		    height = inHeight || 290,
		    radius = Math.min(width, height) / 2;

		var x = d3.scale.linear()
		    .range([0, 2 * Math.PI]);

		var y = d3.scale.sqrt()
		    .range([0, radius]);

		var color = d3.scale.category20c();

		var svg = d3.select("#sunburst")
		  .append("g")
		    .attr("transform", "translate(" + width / 2 + "," + (height / 2 + 10) + ")");

		var partition = d3.layout.partition()
		    .value(function(d) { return d.size; });

		var arc = d3.svg.arc()
		    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
		    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
		    .innerRadius(function(d) { return Math.max(0, y(d.y)); })
		    .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

		
		var root = data;
			//console.log('svg',svg,svg.node())
		var path = svg.selectAll("path")
		    	.data(partition.nodes(root))
			.enter().append("path")
		      	.attr("d", arc)
		      	.style("fill", function(d) { return colors.getColor(d.naics); })
		      	.on("click", click)
		      	.on("mouseover",function(d){
		      	    var el = d3.select(this);  	
				    if(d.naics){
					    el.style("stroke","#000").style("stroke-width",2);
					    var cluster = d.naics.substr(0,2)
						if(cluster !== '--' && naicsLib[cluster].part_of_range){
							cluster =  naicsLib[cluster].part_of_range;
						}

				      	var xpos = Number(el.node().getBBox().x)+120
			     	 	var ypos = (el.node().getBBox().y - 10)+410
			     	 	if(d.naics.length === 6){
			     	 		d3.selectAll('.n6_'+d.naics).style("stroke","#000").style("stroke-width",3);
			     	 	}else if(d.naics.length === 4){
			     	 		d3.selectAll('.n4_'+d.naics).style("stroke","#000").style("stroke-width",3);
			     	 	}else{
			     	 		d3.selectAll('.n2_'+cluster).style("stroke","#000").style("stroke-width",3);
			     	 	}

			         	el.style("stroke","#000").style("stroke-width",3);
						d3.select("#nytg-tooltip").style('top',ypos+"px").style('left',xpos+"px").style('display','block') 
			          	d3.select("#nytg-tooltip .nytg-name").html(d.naics+' '+naicsLib[d.naics].title)
			          	
			          	//d3.select("#nytg-tooltip .nytg-discretion").text(that.discretionFormat(d.discretion))
			          	d3.select("#nytg-tooltip .nytg-department").text(naicsLib[cluster].title)
			          	d3.select("#nytg-tooltip .nytg-value").html(d.value)
			        }
			 	})
		      	.on("mouseout",function(d){
			      	var el = d3.select(this);
			      	el.style("stroke-width",0);
			      	d3.select("#nytg-tooltip").style('display','none');
			      	
			      	if( d.naics ){
				      	
				      	if( d.naics.length === 6){
		         	 		d3.selectAll('.n6_'+d.naics).style("stroke-width",0);
		         	 	}else if(d.naics.length === 4){
		         	 		d3.selectAll('.n4_'+d.naics).style("stroke-width",0);
		         	 	}else{
		         	 		d3.selectAll('.n2_'+d.naics).style("stroke-width",0);
		         	 	}
		         	
		         	}
			    
			    });

		function click(d) {
			cb(d)
		    path.transition()
		      .duration(750)
		      .attrTween("d", arcTween(d));
		}
			
		d3.select(self.frameElement).style("height", height + "px");

			// Interpolate the scales!
		function arcTween(d) {
		  var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]),
		      yd = d3.interpolate(y.domain(), [d.y, 1]),
		      yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
		  return function(d, i) {
		    return i
		        ? function(t) { return arc(d); }
		        : function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); return arc(d); };
		  };
		}
	
	},

	createTree:function(data){
		if(data.length <= 0){ return {} };
		
		var tree = {name:'zbp',children:[]}
		var naicsCounts = data.reduce(function(a,b){
			if(!a[b.naics]){ a[b.naics] = 0}
			a[b.naics] += +b.radius;
			return a;
		},{})

		tree.children = Object.keys(naicsCounts).map(function(naics){
			var cluster = naics.substr(0,2)
			if(cluster !== '--' && naicsLib[cluster].part_of_range){
				cluster =  naicsLib[cluster].part_of_range;
			}
			return cluster

		}).sort().reduce(function(a, b){ if (b != a[0]) a.unshift(b); return a }, [])//remove 
		.map(function(d){

			var children = Object.keys(naicsCounts).filter(function(naics){
				var cluster = naics.substr(0,2)
				if(cluster !== '--' && naicsLib[cluster].part_of_range){
					cluster =  naicsLib[cluster].part_of_range;
				}
				return cluster === d;

			}).map(function(naics){
				var cluster = naics.substr(0,4)
				if(cluster !== '--' && naicsLib[cluster].part_of_range){
					cluster =  naicsLib[cluster].part_of_range;
				}
				return cluster
			}).sort().reduce(function(a, b){ if (b != a[0]) a.unshift(b); return a }, [])

			children = children.map(function(f){

				var lowChildren =  Object.keys(naicsCounts).filter(function(naics){
					var cluster = naics.substr(0,4)
					if(cluster !== '--' && naicsLib[cluster].part_of_range){
						cluster =  naicsLib[cluster].part_of_range;
					}
					return cluster === f;
				}).map(function(g){
					return {name:naicsLib[g].title,naics:g,size:naicsCounts[g] }
				}).sort(function(a,b){
					return b.naics.substr(4,2) - a.naics.substr(4,2)
				})

				return {name:naicsLib[f].title,naics:f,children:lowChildren}
			}).sort(function(a,b){
				return b.naics.substr(2,2) - a.naics.substr(2,2)
			})

			return {name:naicsLib[d].title,naics:d,children:children}
		})
		//console.log('createTree',tree);
		return tree;
		
	}
}