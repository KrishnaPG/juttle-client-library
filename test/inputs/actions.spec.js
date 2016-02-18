import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import nock from 'nock';

import * as ActionCreators from '../../src/inputs/actions';

const middlewares = [ thunk ];
const mockStore = configureStore(middlewares);

describe('Action Creators', () => {
    it('updateInputValue', (done) => {
        const juttleServiceUrl = 'http://localhost:3000';
        const bundle = {
            program: 'input a: text; input b: dropdown -items [{value: 1, label: \'one\'}, {value: 2, label: a}]; emit -limit 1'
        };

        const getState = {
            juttleServiceUrl: juttleServiceUrl,
            bundle,
            inputs: [
                {
                    id: 'a',
                    value: null
                },
                {
                    id: 'b',
                    value: null
                }
            ]
        };

        let mockResponseBody = [
            {
                id: 'a',
                value: 'new value for a'
            },
            {
                id: 'b',
                value: null,
                options: {
                    items: [{value: 1, label: 'one'}, {value: 2, label: 'new value for as'}]
                }
            }
        ];

        const expectedActions = [
            {
                type: 'BEGIN_UPDATE_INPUT_VALUE'
            },
            {
                type: 'INPUT_DEFS_UPDATE',
                payload: mockResponseBody
            },
            {
                type: 'END_UPDATE_INPUT_VALUE'
            }
        ];

        nock(juttleServiceUrl)
        .post('/api/v0/prepare', {
            bundle,
            inputs: {
                a: 'new value for a',
                b: null
            }
        })
        .reply(200, mockResponseBody);

        const store = mockStore(getState, expectedActions, done);
        store.dispatch(ActionCreators.updateInputValue('a', 'new value for a'));
    });
});
