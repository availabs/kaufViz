renderCanvas:function(){
		var data = this.getCircleArray();
		if(data.length > 0){
			var width = 960,
	    		height = 500,
	    		padding = 2.5, // separation between same-color nodes
			    clusterPadding = 6, // separation between different-color nodes
			    maxRadius = 20,
	     		rScale = d3.scale.pow().exponent(.3).domain([1,1000]).range([2,20]);;

			var canvas = d3.select(".canvasDiv").append("canvas")
			    .attr("width", width)
			    .attr("height", height);

		
			var context = canvas.node().getContext("2d");

			var clusters = {};

			var nodes = data.map(function(n) {
				var d = {cluster: n.cluster, radius: rScale(+n.radius)};
			  if (!clusters[d.cluster] || (d.radius > clusters[d.cluster].radius)) clusters[d.cluster] = d;
			  return d;
			});

			var twoDigitNaics = Object.keys(clusters).map(function(key){
					return  key
			}).sort().reduce(function(a, b){ if (b != a[0]) a.unshift(b); return a }, []).reverse()

	

			var iter = Math.floor(360 / twoDigitNaics.length-1),
					per =  Math.floor(100 / twoDigitNaics.length-1)
			var colors = twoDigitNaics.map(function(d,i){
				return 'hsla('+(i*iter)+', '+(100-(i*per))+'%, 50%, 1)'
			})

			var color = d3.scale.category20()
					.domain(twoDigitNaics);
		  // force
		  //     .nodes(graph.nodes)
		  //     .links(graph.links)
		  //     .on("tick", tick)
		  //     .start();

		  //Use the pack layout to initialize node positions.
			d3.layout.pack()
			    .sort(null)
			    .size([width, height])
			    .children(function(d) { 
			    	return d.values; 
			    })
			    .value(function(d) { return d.radius * d.radius; })
			    .nodes({values: d3.nest()
			      .key(function(d) { return d.cluster; })
			      .entries(nodes)});


			var force = d3.layout.force()
			    .nodes(nodes)
			    .size([width, height])
			    .gravity(0.05)
			    .charge(0)
			    .on("tick", tick)
			    .start();


			function tick(e) {
				console.time('tick')
				context.clearRect(0, 0, width, height);

				
				context.beginPath();
				context.fillStyle  = '#0ae'

				nodes.forEach(function(d) {
					collide(10 * e.alpha * e.alpha)(d);
		      cluster(.2)(d);
		      context.moveTo(d.x, d.y);
		      context.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
		      
		    });
		    context.fill();  
		    console.timeEnd('tick')
			}

			function cluster(alpha,d) {
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
			      //console.log('a',alpha,d, x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1)
			      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
			    });
			  };
			}
		  function lick() {
		    context.clearRect(0, 0, width, height);

		    // draw links
		    context.strokeStyle = "#ccc";
		    context.beginPath();
		    graph.links.forEach(function(d) {
		    	context.fillStyle 
		      context.moveTo(d.source.x, d.source.y);
		      context.lineTo(d.target.x, d.target.y);
		    });
		    context.stroke();

		    // draw nodes
		    context.fillStyle = "steelblue";
		    context.beginPath();
		    graph.nodes.forEach(function(d) {
		      context.moveTo(d.x, d.y);
		      context.arc(d.x, d.y, 4.5, 0, 2 * Math.PI);
		    });
		    context.fill();
		  }
		}
	},