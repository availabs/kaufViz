var React = require("react"),
	d3 = require('d3'),
	d3legend  = require('d3-svg-legend'),
	SelectBox = require('react-select'),
	Loading = require('react-loading'),

	//vis source
	map = require('../utils/viz/renderGeography'),
	bubble = require('../utils/viz/bubbleCharts'),
	sunburst = require('../utils/viz/sunburstChart'),
	colors = require('../utils/viz/colorScale'),

	
	//--data
	naicsLib = require('../utils/data/naicsKey'),
	metros = require('../utils/data/metroAreas').map(function(d){
		return {value:d.fips,label:d.name}
	}),
	years = d3.range(1998,2014).map(function(d){
		return {value:d,label:d}
	}).reverse(),
	centroids = [],
	nf = new Intl.NumberFormat();

var Header = React.createClass({
	
	getDefaultProps:function(){
		return{
			mapWidth:1200,
			mapHeight:700,
		}
	},

	getInitialState:function(){

		return {
			type:'fips',
			metroFips:'174',
			year:'2013',
			geo:{type:'FeatureCollection',features:[]},
			data:[],
			loading:true,
			options:{
				mode:'cluster',
				naics:{
					depth:0,
					code:undefined
				}
			}
		}
	},
	
	setMode:function(mode){
		if(mode !== this.state.options.mode){
			var newOptions = this.state.options;
			newOptions.mode = mode;
			this.setState({options:newOptions})
		}
	},

	setNaics:function(d){
		if(d.naics !== this.state.options.naics.code){
			var newOptions = this.state.options;
			newOptions.naics = {code:d.naics,name:d.name,depth:d.depth};
			this.setState({options:newOptions})
		}

	},

	updateMetro:function(val){

		console.log("Selected: " + val);
		
		this.setState({
			metroFips:val,
			data:[],
			loading:true
		});		
		this.getMetroData(val);
		d3.select("#zip_group").selectAll("path").remove(); // clear  map
		
	},
	
	updateYear:function(val){
	
		console.log("Selected: " + val);
		this.setState({
			data:[],
			year:val,
			loading:true
		});		
		this.getYearData();
	
	},

	getYearData:function(){
		var scope =this,
			api = 'http://zbp.availabs.org/';

		var fips  = {"type": "metro", "code": this.state.metroFips};
		  
		
		d3.json(api+'/details')
		.post(JSON.stringify({"fips":fips,"year":this.state.year}),function(err,response){
	  		
	  		var data = scope.getCircleArray(response.data);  	
	  		sunburst.renderSunburst(data,scope.setNaics);
		
	  		scope.setState({
	  			data:data,
	  			loading:false,
	  		});

	  	});
	
	},

	getMetroData:function(fipsCode){
		var scope =this,
			api = 'http://zbp.availabs.org';

		var fips  = {"type": "metro", "code": fipsCode};
		  
		d3.json(api+'/details')
		.post(JSON.stringify({"fips":fips,"year":this.state.year}),function(err,response){
	  		var data = scope.getCircleArray(response.data);  	
	  		scope.getGeography(fips,Object.keys(response.data),function(zips){
	  		
	  			map.renderGeography(zips,scope.props.mapWidth,scope.props.mapHeight);
				sunburst.renderSunburst(data,scope.setNaics);
		
		  		scope.setState({
		  			geo:zips,
		  			data:data,
		  			loading:false,
		  		})
	  		})
	  	});	
	},
	

	getLocalData:function(){

		var scope = this,
			api = '/tempData/',
			details = 'kc13details.json',
			geo = 'kcGeo.json';

		d3.json( api+details , function(err,response){
	  		var data = scope.getCircleArray(response.data);  	
	  		d3.json(api+geo , function(zips){
	  		
	  			map.renderGeography(zips,scope.props.mapWidth,scope.props.mapHeight);
				sunburst.renderSunburst(data,scope.setNaics);
		
		  		scope.setState({
		  			geo:zips,
		  			data:data
		  		})
	  		})
	  	});	

	},

	componentDidMount:function(){

		this.getMetroData(this.state.metroFips)
		bubble.drawLegends();
	  	//this.getLocalData();
	  	//metros = metros

	},


	

	getGeography:function(fips,zips,cb){

		var api = api = 'http://zbp.availabs.org/';
		d3.json(api+'/geozipcodes')
			.post(JSON.stringify({"zips":zips}),function(err,zipsData){
		  	
		  	d3.json(api+'/geozipcodes')
				.post(JSON.stringify({"fips":fips}),function(err,fipsData){

					//console.log('fipsData',fipsData)
					fipsData.features[0].properties.type='metro'
					zipsData.features = zipsData.features.concat(fipsData.features)
			  	
			  	cb(zipsData)
			});

		})
	},

	getCircleArray:function(data){
		var scope  = this,
			circleArray = []

		circleArray = Object.keys(data).map(function(zipkey){
			return Object.keys(data[zipkey]).map(function(naicsKey){
				return Object.keys(data[zipkey][naicsKey]).map(function(sizeKey){
					var cluster = naicsKey.substr(0,2)
					if(cluster !== '--' && naicsLib[cluster].part_of_range){
						cluster =  naicsLib[cluster].part_of_range;
					}
					//console.log('zipkey')
					return {
						cluster:cluster,
						naics:naicsKey,
						size:sizeKey.split('-')[0],
						radius:sizeKey.split('-')[0],
						count:+data[zipkey][naicsKey][sizeKey],
						zip:zipkey
					}
				})
			})
		})

		var flat1 = [],
			flat2 = [],
			flat3 = [];
		
		flat1 = flat1.concat.apply(flat1, circleArray);
		flat2 = flat2.concat.apply(flat2, flat1);

		circleArray = circleArray.map(function(d){
			var output = []
			for(var i = 0;i < d.count;i++){
				output.push(d);
			}
			return output;
		})
		
		flat3 = flat3.concat.apply(flat2, circleArray);

		circleArray = flat3.filter(function(d){
			return d.radius !== 'total' && d.count > 0 && d.naics.substr(0,2) !== '--';
		})

		circleArray = circleArray.map(function(d){
			if(d.radius === '1000+'){
				d.radius = 1000;
			}
			return d;
		})
		//console.log('num establishments:',circleArray.length)
		return circleArray;
	},

	

	componentDidUpdate:function(nextProps,nextState){
		
		bubble.renderBubbleChart(this.state.data,this.props.mapWidth,this.props.mapHeight,map.centroids,this.state.options);
		
	},

	renderIndustryAnalysis:function(){
		var scope = this,
			estCount = 0,
			estEmp = 0,
			indCount = 0,
			indEmp = 0,
			indCountPer = 0,
			indEmpPer = 0;


		if(this.state.options.naics.depth === 0){
			return <span />
		}
		else if(this.state.options.naics.depth === 1){

			var estCount = this.state.data.length,
				estEmp = this.state.data.reduce(function(a,b){ return parseInt(a) + parseInt(b.radius) },0);

			var filterData = scope.state.data.filter(function(d){
				return d.cluster === scope.state.options.naics.code;
			})
				
			indCount = filterData.length;
			indEmp = filterData.reduce(function(a,b){ return parseInt(a) + parseInt(b.radius) },0);
			indCountPer = Math.round((indCount / estCount)*100);
			indEmpPer = Math.round((indEmp / estEmp)*100);

		}
		else if(this.state.options.naics.depth > 1){

			estCount = this.state.data.length,
			estEmp = this.state.data.reduce(function(a,b){ return parseInt(a) + parseInt(b.radius) },0);

			var filterData = scope.state.data.filter(function(d){
				return d.naics.substr(0,scope.state.options.naics.code.length) === scope.state.options.naics.code;
			})

			indCount = filterData.length;
			indEmp = filterData.reduce(function(a,b){ return parseInt(a) + parseInt(b.radius) },0);
			indCountPer = Math.round((indCount / estCount)*100);
			indEmpPer = Math.round((indEmp / estEmp)*100);
		
		}
		
		return (
				<div>
					<div className='row'>
						<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:14}}>
							<strong>Establishments</strong>
						</div>
	
						<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:14}}>
							{nf.format(indCount)}
						</div>
						<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:14}}>
							{nf.format(indCountPer)}%
						</div>
					</div>
					<div className='row'>
						<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:14}}>
							<strong>Employment</strong>
						</div>
						<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:14}}>
							{nf.format(indEmp)}
						</div>
						<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:14}}>
							{nf.format(indEmpPer)}%
						</div>
					</div>
				</div>

		)
	},

	renderControls:function(){

		var zipcodeCount = '',
			estCount = '',
			estEmp = '',
			cluster =  this.state.options.mode === 'cluster' ? " active" : "",
			zips =  this.state.options.mode === 'zips' ? " active" : "";

		if(this.state.data.length > 0){
			zipcodeCount = this.state.geo.features.length -1,
			estCount = this.state.data.length,
			estEmp = this.state.data.reduce(function(a,b){ return parseInt(a) + parseInt(b.radius) },0)
			console.log('empEst', estEmp)
		}
			

		return (
			<div className='col-md-12'>
				<div className='row'>
					<div className='col-xs-12' style={{textAlign:'center',padding:6,fontSize:16}}>
						<strong>

							<SelectBox
							    name="metroarea"
							    value={this.state.metroFips}
							    options={metros}
							    onChange={this.updateMetro}/>

						</strong>
					</div>
				</div>
				<div className='row'>
					<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:14}}>
						<strong>Year</strong>
					</div>
					<div className='col-xs-8' style={{textAlign:'center',padding:6,fontSize:14}}>
						<SelectBox
						    name="datayear"
						    value={this.state.year}
						    options={years}
						    onChange={this.updateYear}/>
					</div>
				</div>
				<div className='row'>
					<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:14}}>
						<strong># Zipcodes</strong>
					</div>
					<div className='col-xs-8' style={{textAlign:'center',padding:6,fontSize:14}}>
						{nf.format(zipcodeCount)}
					</div>
				</div>
				<div className='row'>
					<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:14}}>
						<strong>Establishments</strong>
					</div>
					<div className='col-xs-8' style={{textAlign:'center',padding:6,fontSize:14}}>
						{nf.format(estCount)}
					</div>
				</div>
				<div className='row'>
					<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:14}}>
						<strong>~Employment</strong>
					</div>
					<div className='col-xs-8' style={{textAlign:'center',padding:6,fontSize:14}}>
						{nf.format(estEmp)}
					</div>
				</div>
				<div className='row'>
					<div className='col-xs-4' style={{textAlign:'center',padding:6,fontSize:16}}>
						<strong>Display:</strong>
					</div>
					<div className='col-xs-8'>
						<div className="btn-group" role="group" >
						  <button type="button" className={"btn btn-default " + cluster} onClick={this.setMode.bind(null,'cluster')}>Industry</button>
						  <button type="button" className={"btn btn-default " + zips} onClick={this.setMode.bind(null,'zips')}>Geography</button>
						</div>
					</div>
				</div>
			</div>
		)
	},

	renderSunburst:function(){
		var name = !this.state.options.naics.name || this.state.options.naics.name === 'zbp' ? 'All Industries' : this.state.options.naics.code+' - '+this.state.options.naics.name;

 		return (
			<div className='col-md-12' style={{textAlign:'center'}}>
				<h2>

				{name}

				</h2>
				<svg id='sunburst' style={{width:'300px',height:'300px'}} />
				{this.renderIndustryAnalysis()}
			</div>
		)
	},

	render:function(){
		
		var loading = (
			<div style={{position:'fixed',top:'50%',left:'50%'}}>
			 <Loading type='balls' color='#e3e3e3'  />
			</div>
		)

		if(!this.state.loading){
			loading = <span />
		}

		return (
			<div className="container main">
	            <h1>Zip Business Patterns</h1>
	            <div className="row">
	                <div className="col-md-12">
                	 	<div id="nytg-tooltip">
			                <div id="nytg-tooltipContainer">
			                    <div className="nytg-department"></div>
			                    <div className="nytg-rule"></div>
			                    <div className="nytg-name"></div>
			                    <div className="nytg-discretion"></div>
			                    <div className="nytg-valuesContainer">
			                        <span className="nytg-value"></span>
			                        <span className="nytg-change"></span>
			                    </div>
			                    <div className="nytg-chart"></div>
			                    <div className="nytg-tail"></div>
			                </div>
			            </div>

			            {loading}
			            <svg id='circles' style={{width:this.props.mapWidth,height:this.props.mapHeight}} >
			            	<g id='circle_group' />
			            	<g id='zip_group' />			            	
			            </svg>

			           	<div style={{position: 'fixed','top': 100,'left':40,width:330}}>
			           		<div className='row'>
			           			
					           	{this.renderControls()}
								
								{this.renderSunburst()}
			            	</div>
			            </div>

			            <div style={{position: 'fixed','top': 100,'right':40,width:330}}>
			           		<div className='row'>
			           			<svg id="circleLegend" style={{width:300,height:200}} />
			            	</div>
			            </div>

	            	</div>
	            </div>
	        </div>

		);
	}
});

module.exports = Header;


// (function(console){

//     console.save = function(data, filename){

//         if(!data) {
//             console.error('Console.save: No data')
//             return;
//         }

//         if(!filename) filename = 'console.json'

//         if(typeof data === "object"){
//             data = JSON.stringify(data, undefined, 4)
//         }

//         var blob = new Blob([data], {type: 'text/json'}),
//             e    = document.createEvent('MouseEvents'),
//             a    = document.createElement('a')

//         a.download = filename
//         a.href = window.URL.createObjectURL(blob)
//         a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
//         e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
//         a.dispatchEvent(e)
//     }
// })(console)