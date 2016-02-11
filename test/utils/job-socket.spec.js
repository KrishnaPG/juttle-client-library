import { WebSocket, Server } from 'mock-socket';
import { expect } from 'chai';
import JobSocket from '../../src/utils/job-socket';
import JSDP from 'juttle-jsdp';

describe('job-socket', function() {

    let _origWebSocket = global.WebSocket;
    let mockServer;
    let jobSocket;

    before(() => {
        global.WebSocket = WebSocket;

        // an unholy hack going on here.
        // can remove once https://github.com/thoov/mock-socket/issues/71 is resolved
        global.window.Event = undefined;
        global.window.MessageEvent = undefined;
    });

    after(() => {
        global.WebSocket = _origWebSocket;
    });

    beforeEach((done) => {
        mockServer = new Server('ws://localhost:8080');
        mockServer.on('connection', server => {
            done();
        });
        jobSocket = new JobSocket('ws://localhost:8080');
    });

    afterEach(() => {
        mockServer.close();
        jobSocket.close();
    });

    describe('converts time strings to dates', () => {
        it('time field', (done) => {
            let sampleDate = new Date(2000);

            jobSocket.on('message', (payload) => {
                expect(payload.time).to.be.a('date');
                expect(payload.time.getTime()).to.equal(sampleDate.getTime());
                done();
            });

            mockServer.send(JSDP.serialize({
                time: sampleDate,
                type: 'mark',
                sink: 'sink0'
            }));
        });

        it('time field in points', (done) => {
            let time1 = new Date(1000);
            let time2 = new Date(2000);

            const points = [
                {
                    time: time1,
                    value: 1
                },
                {
                    time: time2,
                    value: 2
                }
            ];

            jobSocket.on('message', (payload) => {
                expect(payload.points).to.deep.equal(points);
                done();
            });

            mockServer.send(JSDP.serialize({
                sink_id: 'sink0',
                points: points
            }));
        });

        it('from and to in _jut_time_bounds in sinks', (done) => {
            let time1 = new Date(1000);
            let time2 = new Date(2000);

            const sinks = [
                {
                    type: 'logger',
                    sink_id: 'sink0',
                    options: {
                        _jut_time_bounds: [
                            {
                                from: time1,
                                to: time2
                            },
                            {
                                from: time1
                            },
                            {
                                to: time2
                            }
                        ]
                    }
                },
                {
                    type: 'table',
                    sink_id: 'sink1',
                    options: {
                        _jut_time_bounds: [
                            {
                                from: time1
                            }
                        ]
                    }
                }
            ];

            jobSocket.on('message', (payload) => {
                expect(payload.sinks).to.deep.equal(sinks);
                done();
            });

            mockServer.send(JSDP.serialize({
                sinks: sinks
            }));
        });
    });


});
