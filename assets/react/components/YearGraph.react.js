var React = require("react"),
    c3 = require("c3"),
    d3 = require("d3"),

    //sicsToAbbr = require("../utils/sicsToAbbr.json"),
    //abbrToName = require("../utils/abbrToName.json"),
    //msaIdToName = require("./utils/msaIdToName"),
    abbrToSics = ((obj) => {

        let new_obj = {};

        for (let prop in obj) {
            if(obj.hasOwnProperty(prop)) {
              new_obj[obj[prop]] = prop;
            }
        }

        return new_obj;
    })(sicsToAbbr);

function invert (obj) {

  var new_obj = {};

  for (var prop in obj) {
    if(obj.hasOwnProperty(prop)) {
      new_obj[obj[prop]] = prop;
    }
  }

  return new_obj;
};

var convertData = (data, currYear, varField, geoType) => {
    let converted = [];
    for(let geoId in data) {
        let strGeoId = geoType === "st" ? (geoId.length === 1 ? "0" + geoId : geoId) : "" + geoId;
        // console.log(geoId.toString().length === 1 ? "0" + geoId.toString() : geoId.toString(), sicsToAbbr[geoId.toString().length === 1 ? "0" + geoId.toString() : geoId.toString()]);
        if(geoType === "msa" && !msaIdToName[strGeoId]) console.log(strGeoId);
        converted.push({
            geoId: strGeoId,
            abbr: geoType === "st" ? sicsToAbbr[strGeoId] : msaIdToName[strGeoId],
            value: data[geoId][currYear][varField]
        });
    }
    return converted.sort((a, b) => a.value - b.value);
};

c3.chart.fn.axis.show_x = function (shown) {
    var $$ = this.internal, config = $$.config;
    config.axis_x_show = !!shown;
    $$.axes.x.style("visibility", config.axis_x_show ? "visible" : "hidden");
    $$.redraw();
};

var YearGraph = React.createClass({
    getInitialState() {
        return {
            graph: null
        }
    },

    getDefaultProps() {
        return {
            geoType: "st",
            data: null,
            currYear: "1977",
            varString: "Net Job Creation",
            varField: "net_job_creation"
        }
    },

    componentDidUpdate(prevProps, prevState) {
        let thisProps = this.props;
        if((!prevProps.data && this.props.data) || (this.props.varField !== prevProps.varField) || (this.props.currYear !== prevProps.currYear) || (this.props.geoType !== prevProps.geoType)) {
            let converted = convertData(thisProps.data, thisProps.currYear, thisProps.varField, thisProps.geoType);
            // console.log(thisProps);
            let scale = d3.scale.quantile()
                .domain(converted.map((val, i) => {
                    return val.value;
                }))
                .range([
                    "rgb(103,0,31)",
                    "rgb(178,24,43)",
                    "rgb(214,96,77)",
                    "rgb(244,165,130)",
                    "rgb(253,219,199)",
                    "rgb(209,229,240)",
                    "rgb(146,197,222)",
                    "rgb(67,147,195)",
                    "rgb(33,102,172)",
                    "rgb(5,48,97)"
                    ]);

            let graph = c3.generate({
                bindto: "#yearGraph",
                data: {
                    json: converted,
                    keys: {
                        x: "abbr",
                        value: ["value"],
                    },
                    type: "bar",
                    color(color, d) {
                        return scale(d.value);
                    },
                    onclick(d, element) {
                        console.log(d, element);
                        thisProps.changeSelected(converted[d.x].geoId);
                    }
                },
                zoom: {
                    enabled: this.props.geoType === "msa",
                    rescale: true
                },
                axis: {
                    x: {
                        label: {
                            text: this.props.geoType === "st" ? "FIPS" : "MSA",
                            position: "outer-center"
                        },
                        type: "category",
                        // show: false
                        show: false
                    },
                    y: {
                        label: {
                            text: this.props.varString,
                            position: "outer-middle"
                        }
                    }
                },
                tooltip: {
                    format: {
                        title(i) {// doesn't work, converted[d] doesn't vary betwee years
                            let d = converted[i];
                            if(thisProps.geoType === "st") {
                                // let data = convertData(thisProps.data, thisProps.currYear, thisProps.varFunction, thisProps.geoType)


                                return abbrToName[d.abbr] +
                                    " - <small>" + d.geoId + "</small>";
                            }
                            else {
                                return d.abbr +
                                    " - <small>" + d.geoId + "</small>";
                            }
                        },
                        name(name, ratio, id, index) { // DOESNT WORK

                            // return null;
                            return thisProps.varString;
                        },
                        value(value, ratio, id) {
                            // console.log(value, ratio, id);
                            return value;// + " " + thisProps.varString;
                        }
                    }
                },
                legend: {
                    show: false
                }
            });

            this.setState({
                graph: graph
            });
        }
        else if(thisProps.data && thisProps.currYear) {
            // console.log(convertData(thisProps.data, thisProps.currYear, thisProps.varFunction, thisProps.geoType));
            /*console.dir(this.state.graph);
            this.state.graph.load({
                json: convertData(thisProps.data, thisProps.currYear, thisProps.varFunction, thisProps.geoType),
                keys: {
                    x: "abbr",
                    value: ["value"]
                },
                unload: true
            });
            this.state.graph.axis.show_x(thisProps.geoType === "st");*/

        }

        if(this.props.varString !== prevProps.varString) {
            // change y label
        }
    },

    render() {
        return (
            <div id="yearGraph"></div>
        );
    }
});

module.exports = YearGraph;
