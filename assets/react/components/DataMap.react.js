"use strict";

var React = require("react"),
    DemoStore = require("../stores/DemoStore.react"),
    topojson = require("topojson"),

    // data
    geoJsons = (() => {
        var states = require("./utils/states.topo"),
            metro = require("./utils/msa.topo");
        return {
            st: topojson.feature(states, states.objects["states.geo"]),
            msa: topojson.feature(metro, metro.objects["fixMsa.geo"]) // b/c had to smallerify data
        };
    }());

var map = null,
    geoJson = null,
    layer = null,
    rawLayer = null,
    dataKey = null,
    getTooltip = () => "Not yet",
    scales = {
        "msa": null,
        "st": null
    };

/*
    Props:
        geoType: "st" or "msa", (for consistency)
        data: (whatever data from bdsAPI),
        currYear: (the year to plot)
*/

var DataMap = React.createClass({
    getInitialState() {
        return {
            geoType: this.props.geoType
        };
    },
    componentWillReceiveProps(nextProps) {
        // console.log("will receive props", this.props, nextProps);

        this.setState({
            geoType: nextProps.geoType
        });
    },
    processLayers(type) {
        if(this.props.data && Object.keys(this.props.data).length !== 0) {
            dataKey = this.props.geoType === "msa" ? "GEOID" : "STATE";

            if(!scales[this.state.geoType]) {
                let geoData = [];
                $.each(this.props.data, (id, val) => {
                    $.each(val, (yr, d) => {
                        geoData.push(parseInt(d["job_creation"]) - parseInt(d["job_destruction"]));
                    });
                });
                geoData = geoData.sort();

                scales[this.state.geoType] = d3.scale.quantile()
                    .domain(geoData)
                    .range([
                        "rgb(103,0,31)",
                        "rgb(178,24,43)",
                        "rgb(214,96,77)",
                        "rgb(244,165,130)",
                        "rgb(253,219,199)",
                        "rgb(247,247,247)",
                        "rgb(209,229,240)",
                        "rgb(146,197,222)",
                        "rgb(67,147,195)",
                        "rgb(33,102,172)",
                        "rgb(5,48,97)"
                    ]);
            }

            let data = this.props.data, currY = this.props.currYear, scale = scales[this.state.geoType],
                changeSelected = this.props.changeSelected; // preserving this?

            return {
                geo: geoJsons[type],
                options: {
                    zoomOnLoad: true,
                    style(feature) {
                        let valid = parseInt(feature.properties[dataKey], 10).toString() in data && parseInt(currY) < 2013;
                        return {
                            fill: true, // redund parseInt then toSTring to handle leading zeros
                            fillColor: valid ? scale(parseInt(data[parseInt(feature.properties[dataKey], 10).toString()][currY]["job_creation"]) - parseInt(data[parseInt(feature.properties[dataKey], 10).toString()][currY]["job_destruction"])) : "#000",
                            color: "#0000CC",
                            weight: 0.1,
                            opacity: 0.2,
                            fillOpacity: valid ? 0.4 : 0.0
                        }
                    },
                    onEachFeature(feature, layer/*, state = null*/) {
                        /*if(state) {
                            // let { dataKey, data, currY, scale } = state;
                            // dataKey = state.dataKey;
                            data = state.data;
                            currY = state.currY;
                            scale = state.scale;
                        }*/
                        // console.log("in oneachf")
                        // console.log(layer, dataKey, feature, currY, scale, parseInt(feature.properties[dataKey], 10).toString());
                        if(feature.properties && parseInt(feature.properties[dataKey], 10).toString() in data) {

                            layer.on({
                                click(e) {
                                    // console.log(e);
                                    let tt = $('#tooltip');
                                    $("#tooltip").show();
                                    // console.log("mousingover", e);
                                    $("#tooltip")
                                        .html(getTooltip(type, dataKey, feature))
                                        .css({
                                            "left": e.originalEvent.layerX + 15,
                                            "top": e.originalEvent.layerY + 5
                                        });
                                    // console.log(type, dataKey, feature);
                                    changeSelected(parseInt(feature.properties[dataKey], 10).toString());
                                }
                            });

                            let popupOptions = {
                                maxWidth: 600,
                                className: "featurePopup"
                            }
                        }
                    }
                }
            }
        }
        else {
            return {
                geo: geoJsons[type],
                options: {
                    zoomOnLoad: true,
                    style(feature) {
                        return {
                            fillColor: "#000ACC",
                            color: "#000ACC",
                            weight: 0.5,
                            opacity: 0.2,
                            fillOpacity: 0.4
                        };
                    }
                }
            }
        }
    },

    getTooltip(type, dataKey, feature) {
        let thisData = this.props.data[parseInt(feature.properties[dataKey], 10).toString()][this.props.currYear];

        let name = feature.properties["NAME"],
            code = type === "st" ? "NAICS " + feature.properties["STATE"] : "MSA " + feature.properties["GEOID"],
            body = "<ul class=\"list-group\">\n" +
                    Object.keys(thisData).map((key) => {
                        if(key === "year2" || key === "state" || key === "msa") {
                            return ""; // probably faster than reduce
                        }
                        let val = thisData[key];
                        return "<li class=\"list-group-item popup\">" + // some terrible formatting
                            "<span class=\"badge\">" + val + "</span>" + key // underscore_like_dis to Underscore Like Dis
                                .replace(/_/g, " ")
                                .replace(/\w\S*/g, (txt) => {
                                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                                }) + "</li>";
                    }).join("\n") + "\n</ul>";

        // console.log(type, dataKey, feature, "getTooltip");

        return `<div class=\"popupWrapper\"><h3 id=\"${parseInt(feature.properties[dataKey], 10).toString()}id\">
                    ${name}&nbsp;<small>${code}</small></h3>${body}</div>`;
    },

    componentDidMount() {
        getTooltip = this.getTooltip;


        let key = "erickrans.4f9126ad",// am3081.kml65fk1, erickrans.4f9126ad
            mapquestOSM = L.tileLayer("http://{s}.tiles.mapbox.com/v3/"+key+"/{z}/{x}/{y}.png");

        map = L.map("map", {
          center: [39.8282, -98.5795],
          zoom: 4,
          layers: [mapquestOSM],
          zoomControl: true,
          attributionControl: false
        });

        map.on("click", (e) => {
            $("#tooltip").hide();
        });

        let modeToggle = L.Control.extend({
            options: {
                position: "topleft"
            },
            onAdd(map) {
                var container = L.DomUtil.create("div", "btn-group");
                container.setAttribute("data-toggle", "buttons");
                var stateLabel = L.DomUtil.create("label", "btn btn-default radioLabel active", container),
                    metroLabel = L.DomUtil.create("label", "btn btn-default radioLabel", container);

                var stateInput = L.DomUtil.create("input", "radio", stateLabel),
                    metroInput = L.DomUtil.create("input", "radio", metroLabel);

                stateInput.setAttribute("type", "radio");
                stateInput.setAttribute("id", "state");
                stateInput.setAttribute("name", "state");
                stateInput.setAttribute("value", "state");
                stateLabel.appendChild(document.createTextNode("State"));

                metroInput.setAttribute("type", "radio");
                metroInput.setAttribute("id", "metro");
                metroInput.setAttribute("name", "metro");
                metroInput.setAttribute("value", "metro");
                metroLabel.appendChild(document.createTextNode("Metro"));

                return container;
            }
        });
        map.addControl(new modeToggle());
        $(".radioLabel").click((e) => {
            e.preventDefault();
            $("#tooltip").hide();
            if(e.target.innerText === "State") {
                this.props.changeGeoType("st");

            }
            else if(e.target.innerText === "Metro") {
                this.props.changeGeoType("msa");
            }
        });

        rawLayer = this.processLayers(this.state.geoType),
            layer = L.geoJson(rawLayer.geo, rawLayer.options);
        map.addLayer(layer);
        // console.dir(layer);
    },

    componentDidUpdate(prevProps, prevState) {
        // console.log(prevState, this.state);
        if((prevState.geoType !== this.state.geoType) || prevProps.data === undefined) { // for the first time draw when data loads
            console.log("redrawin");
            if(layer) {
                map.removeLayer(layer);
            }
            // console.log(this.state);
            rawLayer = this.processLayers(this.state.geoType),
                layer = L.geoJson(rawLayer.geo, rawLayer.options);
            map.addLayer(layer);
        }
        if((prevProps.currYear !== this.props.currYear) &&
            layer && layer.options.onEachFeature &&
            this.props.geoType && this.props.data && this.props.currYear &&
            this.state.geoType && scales[this.state.geoType] //wayy too paranoid
        ) {


            for(let i = 0; i < geoJsons[this.state.geoType].features.length; i++) {
                let feature = geoJsons[this.state.geoType].features[i];
                // let rLayer = L.GeoJSON.geometryToLayer(feature, {});
                // console.dir(rLayer);
                /*layer.options.onEachFeature(feature, layer, {
                    // dataKey: this.props.geoType === "msa" ? "GEOID" : "STATE",
                    data: this.props.data,
                    currY: this.props.currYear,
                    scale: scales[this.state.geoType]
                });*/
            }
        }
    },

    render() {

        if(layer) {
            // console.dir(layer);
            let pL = this.processLayers(this.state.geoType);
            layer.setStyle(pL.options.style); // reprocess
            // console.log(geoJsons[this.state.geoType]);

            // layer.options.onEachFeature(geoJsons[this.state.geoType], layer);
            // layer.options.onEachFeature = pL.options.onEachFeature;
            // let oLayer = L.GeoJSON.geometryToLayer(geoJsons[this.state.geoType], pL.options)
            // pL.options.onEachFeature(geoJsons[this.state.geoType], pL.options);
            // console.log(pL, layer);
        }

        return (
            <div className="mapContainer">
                <div id="map"></div>
                <div id="tooltip" className="featurePopup"></div>
            </div>
        );
    }
});

module.exports = DataMap;
