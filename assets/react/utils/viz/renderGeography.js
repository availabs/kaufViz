
module.exports = {
	centroids:{},
	renderGeography:function(geo,inWidth,inHeight){
		var scope = this;
		if(geo.features.length > 0){
			var width = inWidth || 600,
			    height = inHeight || 600;

		  	var vis = d3.select("#zip_group")

		  	vis.selectAll("path").remove()
			
			var json = geo;
			  console.log(json);
	      
		      // create a first guess for he projection
		    var center = d3.geo.centroid(json),
		    	scale  = 150,
		    	offset = [width/2, height/2],
		    	projection = d3.geo.mercator().scale(scale).center(center)
		          .translate(offset);

		    // create the path
		    var path = d3.geo.path().projection(projection);

		    // using the path determine the bounds of the current map and use 
		    // these to determine better values for the scale and translation
		    var bounds  = path.bounds(json),
		      	hscale  = scale*width  / (bounds[1][0] - bounds[0][0]),
		      	vscale  = scale*height / (bounds[1][1] - bounds[0][1]),
		      	scale   = (hscale < vscale) ? hscale : vscale,
		      	offset  = [width - (bounds[0][0] + bounds[1][0])/2,
		                  height - (bounds[0][1] + bounds[1][1])/2];

		      // new projection
		    projection = d3.geo.mercator().center(center)
		        .scale(scale).translate(offset);
		    path = path.projection(projection);

		      
		    
		    json.features.forEach(function(feat){
		      	if(feat.properties.type !== 'metro'){
		      		scope.centroids[feat.properties.geoid] = path.centroid(feat);
		      	}
		    })
		      
		    vis.selectAll("path").data(json.features).enter().append("path")
		        .attr("d", path)
		        .style("fill", "none")
		        .style("stroke-width", function(d){
		        	if(d.properties.type === 'metro'){
		        		return 4
		        	}
		        	return 1;
		        })
		        .style("stroke", "black")
 
		}
	}
}