var React = require("react");

var Header = React.createClass({
	render() {
		return (
			<nav className="navbar navbar-inverse" id="topNav">
				<div className="container">
					<div className="navbar-header">
						<a className="navbar-brand" href="#">BDS Demo</a>
					</div>
					<div>
						<ul className="nav navbar-nav">
							<li><a href="#">Home</a></li>
							<li><a href="#">Map</a></li>
						</ul>
					</div>
				</div>
			</nav>
		);
	}
});

module.exports = Header;
