var React = require('react');

var Hello = React.createClass({
    render() {
        return ( <h1>Hello, World!!! {this.props.who}</h1> );
    }      
});

module.exports = Hello;
