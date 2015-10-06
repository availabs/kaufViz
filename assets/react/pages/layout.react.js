var React = require("react"),
    RouteHandler = require("react-router").RouteHandler,
    // Templates
    Header = require("../components/layout/Header.react");

var App = React.createClass({
	render() {
		return (
			<div>
				<RouteHandler />
			</div>
		);
	}
});

module.exports = App;
