import _ from "underscore";
import React, { Component } from "react";
import SinkRegistry from "./sink-registry";

class Sink extends Component {
    handleSinkMsg(msg) {
        switch (msg.type) {

            case "points":
                this.componentChart.consume(msg.points);
                break;
            case "mark":
                this.componentChart.consume_mark(msg.time);
                break;
            case "tick":
                this.componentChart.consume_tick(msg.time);
                break;
            case "sink_end":
                this.componentChart.consume_eof();
                break;

        }
    }

    componentWillMount() {
        var sinkConstructorOptions = {
            params: _.omit(this.props.sink.options, "_jut_time_bounds"),
            _jut_time_bounds: this.props.sink.options._jut_time_bounds,
            type: this.props.sink.type,
            juttleEnv: {
                now: new Date()
            }
        };
        let ViewConstructor = SinkRegistry[this.props.sink.type];

        if (ViewConstructor) {
            this.componentChart = new ViewConstructor(sinkConstructorOptions, this.props.componentCharts);
        }
        else {
            this.componentChart = null;
        }

        if (this.componentChart) {
            this.props.addComponentChart(this.componentChart);
        }

        this.props.jobEvents.on(this.props.sink.sink_id, this.handleSinkMsg, this);
    }

    componentDidMount() {
        window.addEventListener("resize", this._setChartDimensions.bind(this));

        setTimeout(() => {
            if (this.componentChart.visuals) {
                this.refs.chartParent.appendChild(this.componentChart.visuals[0]);
            }
            this._setChartDimensions();
        });
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this._setChartDimensions);
    }

    _setChartDimensions() {
        this.componentChart.setDimensions(null, this.refs.chartParent.offsetWidth, 500);
    }

    render() {
        let style = { width: this.props.width + "%" };

        return (
            <div className="flex-col" style={style} ref="chartParent"></div>
        );
    }
}

export default Sink;
