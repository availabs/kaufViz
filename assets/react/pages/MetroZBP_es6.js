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
    
});

export default Header;
