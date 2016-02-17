import React from 'react';
import * as ReactDOM from 'react-dom';

import EventTarget from '../utils/event-target';
import ViewLayout from './view-layout';
import JobManager from '../utils/job-manager';
import viewLayoutGen from './view-layout-gen';
import juttleViewGen from './juttle-view-gen';

export default class View extends EventTarget {
    constructor(outriggerUrl, el) {
        super();

        this.el = el;
        this.outriggerUrl = outriggerUrl;

        // setup _jobManager
        this._jobManager = new JobManager(outriggerUrl);
        this._jobManager.on('message', this._onMessage, this);

        ReactDOM.render(
            <ViewLayout jobEvents={this._emitter}/>,
            this.el
        );
    }

    run(bundle, inputValues) {
        let self = this;

        return this._jobManager.start(bundle, inputValues)
        .then(res => {
            let juttleViews = juttleViewGen(res.views);
            let viewLayout = viewLayoutGen(res.views);

            ReactDOM.render(
                <ViewLayout
                    key={res.job_id}
                    jobEvents={this._emitter}
                    viewLayout={viewLayout}
                    juttleViews={juttleViews} />,
                this.el
            );
        })
        .catch(err => {
            return self._jobManager.close()
            .then(() => {
                throw err; });
        });
    }

    clear() {
        return this.stop()
        .then(() => {
            ReactDOM.render(
                <ViewLayout />,
                this.el
            );
        });
    }

    _onMessage(msg) {
        if (msg.type === 'warning' || msg.type === 'error') {
            this._emitter.emit(msg.type, msg[msg.type]);
        } else {
            this._emitter.emit(msg.sink_id, msg);
        }
    }

    stop() {
        return this._jobManager.close();
    }
}
