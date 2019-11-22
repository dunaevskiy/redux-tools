import { createStore } from 'redux';
import { identity } from 'ramda';

import makeEnhancer from './makeEnhancer';
import combineReducers from './combineReducers';

describe('combineReducers', () => {
	it('returns a composite reducer that maps the state keys to given reducers', () => {
		const reducer = combineReducers({
			counter: (state = 0, action) => (action.type === 'increment' ? state + 1 : state),
			stack: (state = [], action) => (action.type === 'push' ? [...state, action.value] : state),
		});
		const s1 = reducer(undefined, { type: 'increment' });
		expect(s1).toEqual({ counter: 1, stack: [] });
		const s2 = reducer(s1, { type: 'push', value: 'a' });
		expect(s2).toEqual({ counter: 1, stack: ['a'] });
	});

	it('ignores all props which are not a function', () => {
		// we double-cast because these conditions can only happen in a javascript setting
		const reducer = combineReducers({
			fake: true,
			broken: 'string',
			another: { nested: 'object' },
			stack: (state = []) => state,
		});
		expect(Object.keys(reducer(undefined, { type: 'push' }))).toEqual(['stack']);
	});

	it('does not have referential equality if one of the reducers changes something', () => {
		const reducer = combineReducers({
			child1(state = {}) {
				return state;
			},
			child2(state = { count: 0 }, action) {
				switch (action.type) {
					case 'increment':
						return { count: state.count + 1 };
					default:
						return state;
				}
			},
			child3(state = {}) {
				return state;
			},
		});
		const initialState = reducer(undefined, { type: '@@INIT' });
		expect(reducer(initialState, { type: 'increment' })).not.toBe(initialState);
	});

	it('should preserve unknown keys in the state', () => {
		const store = createStore(
			identity,
			{
				visibilityFilter: 'SHOW_ALL',
				todos: [
					{
						text: 'Consider using Redux',
						completed: true,
					},
					{
						text: 'Keep all state in a single tree',
						completed: false,
					},
				],
			},
			makeEnhancer()
		);
		const reducerA = (state = { name: 'a' }) => state;
		const reducerB = (state = { name: 'b' }) => state;
		store.injectReducers({ a: reducerA }, { namespace: 'nsA', feature: 'ftA' });
		store.injectReducers({ b: reducerB }, { namespace: 'nsB' });
		store.ejectReducers({ a: reducerA }, { namespace: 'nsA', feature: 'ftA' });
	});
});
