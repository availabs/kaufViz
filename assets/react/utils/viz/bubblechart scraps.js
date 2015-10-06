renderCircle:function(){
		var data = this.getCircleArray(),
				treeData = this.createTree(),
				scope = this;

		if(data.length > 0){
				var width = this.props.mapWidth,
			    height = this.props.mapHeight,
			    padding = 3.5, // separation between same-color nodes
			    clusterPadding = 8, // separation between different-color nodes
			    maxRadius = 20,
			    rScale = data.length > 10000 ? d3.scale.pow().exponent(.5).domain([1,1000]).range([1,10]) : d3.scale.pow().exponent(.5).domain([1,1000]).range([2,20]);
			    // rScale = d3.scale.quantize()
			    // 	.domain()
			    // 	.range([1,2,4,8,12,14,16,18,25]);

			var clusters = {};

			var nodes = data.map(function(n) {
				var d = {cluster: n.cluster,zip:n.zip, radius: rScale(+n.radius),naics:n.naics,size:+n.radius};
			  if (!clusters[d.cluster] || (d.radius > clusters[d.cluster].radius)) clusters[d.cluster] = d;
			  return d;
			});

			var twoDigitNaics = Object.keys(clusters).map(function(key){
					return  key
			}).sort().reduce(function(a, b){ if (b != a[0]) a.unshift(b); return a }, []).reverse()

			//console.log('twoDigitNaics',twoDigitNaics)

			//Use the pack layout to initialize node positions.

			var treePack = d3.layout.pack()
    		.size([width, height])
    		.value(function(d) { return d.size; });

			var mode = 'zips'
			var nestedNodes = [];
			if(mode === 'cluster'){
				nestedNodes = d3.nest()
				      .key(function(d) { return d.cluster })//
							//.key(function(d) { return d.cluster })
							//.rollup(function(d) { return { values:d.length, radius:d.length })
							//.key(function(d) { return d.naics; })
				      .entries(nodes)

				d3.layout.pack()
			    .sort(function(a,b){return b.naics - a.naics})
			    .size([width, height])
			    .children(function(d,i) {
			    	return d.values; 
			    })
			    .value(function(d){return d.radius * d.radius; })
			    .nodes({values:nestedNodes });

			}else if(mode === 'zips'){
				
				var diff = {}
				nestedNodes = d3.nest()
		      .key(function(d) { return d.zip })//
					.entries(nodes)

				d3.layout.pack()
			    .sort(function(a,b){return b.naics - a.naics})
			    .size([width, height])
			    .children(function(d,i) {
			    	return d.values; 
			    })
			    .value(function(d){return d.radius * d.radius; })
			    .nodes({values:nestedNodes });
		

				nestedNodes.forEach(function(d){
					diff[d.key] = [centroids[d.key][0] - d.x,centroids[d.key][1] - d.y ]
				})
	
				nodes.forEach(function(n){
					n.x += diff[n.zip][0];
					n.y += diff[n.zip][1];
				})
			
			}

			//console.log(nestedNodes,nodes);

			


			

    	//var treeNodes = treePack.pack(nodes);
    	

			

			 var svg = d3.select("#circle_group")


			// var force = d3.layout.force()
			//     .nodes(nodes)
			//     .size([width, height])
			//     .gravity(0.1)
			//     .friction(0.9)
			//     .charge(defaultCharge)
			//     .on("tick", tick)
			    //.start();
			

			var node = svg.selectAll("circle")
			    .data(nodes)
			  .enter().append("circle")
			    .style("fill", function(d) { return scope.getColor(d.naics) })
			    .attr('class',function(d){
			    	return 'n2_'+d.cluster+' n4_'+d.naics.substr(0,4)+' n6_'+d.naics;
			    })
			    .attr('cx',function(d){
			    	return d.x
			    })
			     .attr('cy',function(d){
			    	return d.y
			    })
			    //.style('fill-opacity',0.7)
			    .on('mouseover',function(d,i){
			    	var el = d3.select(this);
			    	var xpos = Number(el.attr('cx'))+10
         	 	var ypos = (el.attr('cy') - d.radius - 10)
         	 	//console.log(xpos,ypos)
			    	el.style("stroke","#000").style("stroke-width",3);
			    	d3.select("#nytg-tooltip").style('top',ypos+"px").style('left',xpos+"px").style('display','block') 
          	d3.select("#nytg-tooltip .nytg-name").html(
          		'<strong>'+d.zip+'</strong><br>'+
          		d.naics+' - '+naicsLib[d.naics].title

          		)
          	//d3.select("#nytg-tooltip .nytg-discretion").text(that.discretionFormat(d.discretion))
          	d3.select("#nytg-tooltip .nytg-department").text(naicsLib[d.cluster].title)
          	d3.select("#nytg-tooltip .nytg-value").html(d.size)
			    	
			    })
			    .on('mouseout',function(){
			    	var el = d3.select(this);
			    	el.style("stroke","#000").style("stroke-width",0);
			    	d3.select("#nytg-tooltip").style('display','none');
			    })
			    //.call(force.start);

			node.transition()
			    .duration(750)
			    .delay(function(d, i) { return 1; })
			    .attrTween("r", function(d) {
			      var i = d3.interpolate(0, d.radius);
			      return function(t) { return d.radius = i(t); };
			    });

			function tick(e) {
				console.log('tick');

			  node
			      .each(cluster(10 * e.alpha * e.alpha))
			      .each(collide(.15))
			      .attr("cx", function(d) { return d.x; })
			      .attr("cy", function(d) { return d.y; });
			  //console.timeEnd('tick')
			}

			function defaultCharge(d){
        if (d.radius < 0) {
          return 0
        } else {
          return -Math.pow(d.radius,2.0)/8 
        }
      }

			// Move d to be adjacent to the cluster node.
			function cluster(alpha) {
			  return function(d) {
			    var cluster = clusters[d.cluster];
			    if (cluster === d) return;
			    var x = d.x - cluster.x,
			        y = d.y - cluster.y,
			        l = Math.sqrt(x * x + y * y),
			        r = d.radius + cluster.radius;
			    if (l != r) {
			      l = (l - r) / l * alpha;
			      d.x -= x *= l;
			      d.y -= y *= l;
			      cluster.x += x;
			      cluster.y += y;
			    }
			  };
			}

			// Resolves collisions between d and all other circles.
			function collide(alpha) {
			  var quadtree = d3.geom.quadtree(nodes);
			  return function(d) {
			  	//console.log(d,alpha)
			    var r = d.radius + maxRadius + Math.max(padding, clusterPadding),
			        nx1 = d.x - r,
			        nx2 = d.x + r,
			        ny1 = d.y - r,
			        ny2 = d.y + r;
			    quadtree.visit(function(quad, x1, y1, x2, y2) {
			      if (quad.point && (quad.point !== d)) {
			        var x = d.x - quad.point.x,
			            y = d.y - quad.point.y,
			            l = Math.sqrt(x * x + y * y),
			            r = d.radius + quad.point.radius + (d.cluster === quad.point.cluster ? padding : clusterPadding);
			        if (l < r) {
			          l = (l - r) / l * alpha;
			          d.x -= x *= l;
			          d.y -= y *= l;
			          quad.point.x += x;
			          quad.point.y += y;
			        }
			      }
			      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
			    });
			  };
			}
			//----------- draw legends

			var linearSize = d3.scale.log()

			svg.append("g")
			  .attr("class", "legendSize")
			  .attr("transform", "translate(20,20)");

			var legendSize = d3.legend.size()
			  .scale(rScale)
			  .shape('circle')
			  .shapePadding(15)
			  .labelOffset(20)
			  .orient('horizontal');

			svg.select(".legendSize")
			  .call(legendSize);

			var ordinal = d3.scale.category20c()
			  .domain(twoDigitNaics);

			svg.append("g")
			  .attr("class", "legendOrdinal")
			  .attr("transform", "translate(1060,60)");

			var twoDigitNaicsNames = Object.keys(clusters).map(function(key){
					return  key+' - '+naicsLib[key].title;
			}).sort().reduce(function(a, b){ if (b != a[0]) a.unshift(b); return a }, []).reverse()
			
			var colorNames = d3.scale.category20()
					.domain(twoDigitNaicsNames);

			var legendOrdinal = d3.legend.color()
			  .shape("path", d3.svg.symbol().type("circle").size(150)())
			  .shapePadding(10)
			  .scale(colorNames);

			svg.select(".legendOrdinal")
			  .call(legendOrdinal);


		}
	},