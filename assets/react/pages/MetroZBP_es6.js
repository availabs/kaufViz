var React = require("react"),
    d3 = require("d3"),
    d3legend = require("d3-svg-legend"),
    SelectBox = require("react-select"),
    Loading = require("react-loading"),

    // custom components
    map = require("../utils/viz/renderGeography"),
    bubble = require("../utils/viz/bubbleCharts"),
    sunburst = require("../utils/viz/sunburstChart"),
    colors = require("../utils/viz/colorScale"),

    // data
    naicsLib = require("../utils/data/naicsKey"),
    metros = require("../utils/data/metroAreas").map((d) => {
        return { value: d.fips, label: d.name };
    }),
    years = d3.range(1998, 2014).map((d) => {
        return { value: d, label: d};
    }).reverse(),
    centroids = [],
    nf = new Intl.NumberFormat();

require("d3.promise");

var Header = React.createClass({
    getDefaultProps() {
        return {
            mapWidth: 1200,
            mapHeight: 700
        };
    },

    getInitialState() {
        return {
            type: "fips",
            metroFips: "174", // Chattanooga
            year: "2013",
            year2: "1998",
            geo: {
                type: "FeatureCollection",
                features: []
            },
            data: [],
            loading: true,
            options: {
                mode: "cluster",
                naics: {
                    depth: 0,
                    code: null
                }
            }
        };
    },

    setMode(mode) {
        if(mode !== this.state.options.mode) {
            let newOptions = this.state.options;
            newOptions.mode = mode;
            this.setState({
                options: newOptions
            });
        }
    },

    setNaics(d) {
        if(d.naics !== this.state.options.naics.code) {
            let newOptions = this.state.options;
            newOptions.naics = {
                code: d.naics,
                name: d.name,
                depth: d.depth
            };
            this.setState({
                options: newOptions
            });
        }
    },

    updateMetro(val) {
        console.log("Selected: " + val);

        this.setState({
            metroFips: val,
            data: [],
            loading: true
        });
        this.getMetroData(val);
        d3.select("#zip_group").selectAll("path").remove();// clears map
    },

    updateYear(val) {
        console.log("Selected: " + val);

        this.setState({
            data: [],
            year: val,
            laoding: true
        });
        this.getYearData();
    },

    getYearData() {
        var scope = this,
            api = "http://zbp.availabs.org",

            fips = {
                "type": "metro",
                "code": this.state.metroFips
            };

        let getDetails = d3.promise.json(api + "/details").post(JSON.stringify({
            fips,
            "year": this.state.year
        }));
        getDetails.then((res) => {
            var data = scope.getCircleArray(res.data);
            sunburst.renderSunburst(data, scope.setNaics);

            scope.setState({
                data,
                loading: false
            });
        },
        (err) => {

        });
    },

    getMetroData(fipsCode) {
        let scope = this,
            api = "http://zbp.availabs.org";

        let fips = { "type": "metro", "code": fipsCode };

        let getData = d3.promise.json(api + "/details").post(JSON.stringify({
            "type": "metro",
            "code": fipsCode
        }));

        getData.then((res) => {
            let data = scope.getCircleArray(res.data);

            scope.getGeography(fips, Object.keys(response.data), (zips) => {
                map.renderGeography(zips, scope.props.mapWidth, scope.props.mapHeight);
                sunburst.renderSunburst(data, scope);

                scope.setState({
                    geo: zips,
                    data,
                    loading: false
                });
            })

        })
    },

    getLocalData() {
        // unneeded for now
    },

    componentDidMount() {
        this.getMetroData(this.state.metroFips);
        buble.drawLegends();
    },

    getGeography(fips, zips, cb) {
        let api = "http://zbp.availabs.org";
        let getZips = d3.promise.json(api + "/geozipcodes").post(JSON.stringify({
            zips
        }));
        let getFips = d3.promise.json(api + "/geozipcodes").post(JSON.stringify({
            fips
        }));

        getZips.then((zipsData) => {
            getFips.then((fipsData) => {
                fipsData.features[0].properties.type="metro"
                zipsData.features = zipsData.features.concat(fipsData.features)

                cb(zipsData)
            });
        });
    },

    getCircleArray(data) {
        let scope = this,
            circleArray = [];

        circleArray = Object.keys(data).map((zipKey) => {
            return Object.keys(data[zipKey]).map((naicsKey) => {
                return Object.keys(data[zipKey][naicsKey]).map((sizeKey) => {
                    let cluster = naicsKey.substr(0, 2);
                    if(cluster !== "--" && naicsLib[cluster].part_of_range) {
                        cluster = naicsLib[cluster].part_of_range;
                    }

                    return {
                        cluster,
                        naics: naicsKey,
                        size: sizeKey.split("-")[0],
                        radius: sizeKey.split("-")[0],
                        count: +data[zipKey][naicsKey][sizeKey],
                        zip: zipKey
                    };
                });
            });
        });

        let flat1 = [],
            flat2 = [],
            flat3 = [];

        flat1 = flat1.concat.apply(flat1, circleArray);
        flat2 = flat2.concat.apply(flat2, flat1);

        circleArray = circleArray.map((d) => {
            let output = []
            for(let i = 0;i < d.count;i++){
                output.push(d);
            }
            return output;
        });

        flat3 = flat3.concat.apply(flat2, circleArray);

        circleArray = flat3.filter((d) => {
            return d.radius !== "total" && d.count > 0 && d.naics.substr(0,2) !== "--";
        });

        circleArray = circleArray.map((d) => {
            if(d.radius === "1000+"){
                d.radius = 1000;
            }
            return d;
        });
        //console.log("num establishments:",circleArray.length)
        return circleArray;
    },

    componentDidUpdate(nextProps, nextState) {
        bubble.renderBubbleChart(this.state.data,this.props.mapWidth,this.props.mapHeight,map.centroids,this.state.options);
    },

    renderIndustryAnalysis() {
        let scope = this,
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

            let estCount = this.state.data.length,
                estEmp = this.state.data.reduce((a,b) => { return parseInt(a) + parseInt(b.radius) },0);

            let filterData = scope.state.data.filter((d){
                return d.cluster === scope.state.options.naics.code;
            })

            indCount = filterData.length;
            indEmp = filterData.reduce((a,b) => { return parseInt(a) + parseInt(b.radius) },0);
            indCountPer = Math.round((indCount / estCount)*100);
            indEmpPer = Math.round((indEmp / estEmp)*100);

        }
        else if(this.state.options.naics.depth > 1){

            estCount = this.state.data.length;
            estEmp = this.state.data.reduce((a,b) => { return parseInt(a) + parseInt(b.radius) },0);

            let filterData = scope.state.data.filter((d) => {
                return d.naics.substr(0,scope.state.options.naics.code.length) === scope.state.options.naics.code;
            });

            indCount = filterData.length;
            indEmp = filterData.reduce((a,b) => { return parseInt(a) + parseInt(b.radius) },0);
            indCountPer = Math.round((indCount / estCount)*100);
            indEmpPer = Math.round((indEmp / estEmp)*100);

        }

        return (
                <div>
                    <div className="row">
                        <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:14}}>
                            <strong>Establishments</strong>
                        </div>

                        <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:14}}>
                            {nf.format(indCount)}
                        </div>
                        <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:14}}>
                            {nf.format(indCountPer)}%
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:14}}>
                            <strong>Employment</strong>
                        </div>
                        <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:14}}>
                            {nf.format(indEmp)}
                        </div>
                        <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:14}}>
                            {nf.format(indEmpPer)}%
                        </div>
                    </div>
                </div>

        )
    },

    renderControls() {

        let zipcodeCount = "",
            estCount = "",
            estEmp = "",
            cluster =  this.state.options.mode === "cluster" ? " active" : "",
            zips =  this.state.options.mode === "zips" ? " active" : "";

        if(this.state.data.length > 0){
            zipcodeCount = this.state.geo.features.length -1,
            estCount = this.state.data.length,
            estEmp = this.state.data.reduce((a,b) => { return parseInt(a) + parseInt(b.radius) },0)
            console.log("empEst", estEmp)
        }


        return (
            <div className="col-md-12">
                <div className="row">
                    <div className="col-xs-12" style={{textAlign:"center",padding:6,fontSize:16}}>
                        <strong>

                            <SelectBox
                                name="metroarea"
                                value={this.state.metroFips}
                                options={metros}
                                onChange={this.updateMetro}/>

                        </strong>
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:14}}>
                        <strong>Year</strong>
                    </div>
                    <div className="col-xs-8" style={{textAlign:"center",padding:6,fontSize:14}}>
                        <SelectBox
                            name="datayear"
                            value={this.state.year}
                            options={years}
                            onChange={this.updateYear}/>
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:14}}>
                        <strong># Zipcodes</strong>
                    </div>
                    <div className="col-xs-8" style={{textAlign:"center",padding:6,fontSize:14}}>
                        {nf.format(zipcodeCount)}
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:14}}>
                        <strong>Establishments</strong>
                    </div>
                    <div className="col-xs-8" style={{textAlign:"center",padding:6,fontSize:14}}>
                        {nf.format(estCount)}
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:14}}>
                        <strong>~Employment</strong>
                    </div>
                    <div className="col-xs-8" style={{textAlign:"center",padding:6,fontSize:14}}>
                        {nf.format(estEmp)}
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-4" style={{textAlign:"center",padding:6,fontSize:16}}>
                        <strong>Display:</strong>
                    </div>
                    <div className="col-xs-8">
                        <div className="btn-group" role="group" >
                          <button type="button" className={"btn btn-default " + cluster} onClick={this.setMode.bind(null,"cluster")}>Industry</button>
                          <button type="button" className={"btn btn-default " + zips} onClick={this.setMode.bind(null,"zips")}>Geography</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    },

    renderSunburst(){
        let name = !this.state.options.naics.name || this.state.options.naics.name === "zbp" ? "All Industries" : this.state.options.naics.code+" - "+this.state.options.naics.name;

        return (
            <div className="col-md-12" style={{textAlign:"center"}}>
                <h2>

                {name}

                </h2>
                <svg id="sunburst" style={{width:"300px",height:"300px"}} />
                {this.renderIndustryAnalysis()}
            </div>
        )
    },

    render:function(){

        let loading = (
            <div style={{position:"fixed",top:"50%",left:"50%"}}>
             <Loading type="balls" color="#e3e3e3"  />
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
                        <svg id="circles" style={{width:this.props.mapWidth,height:this.props.mapHeight}} >
                            <g id="circle_group" />
                            <g id="zip_group" />
                        </svg>

                        <div style={{position: "fixed","top": 100,"left":40,width:330}}>
                            <div className="row">

                                {this.renderControls()}

                                {this.renderSunburst()}
                            </div>
                        </div>

                        <div style={{position: "fixed","top": 100,"right":40,width:330}}>
                            <div className="row">
                                <svg id="circleLegend" style={{width:300,height:200}} />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        );
    }

});

export default Header;
