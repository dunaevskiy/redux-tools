import { identity } from 'ramda';
import { FUNCTION_KEY } from '@redux-tools/injectors';
import { DEFAULT_FEATURE } from '@redux-tools/namespaces';
import { createStore as createStoreRedux } from 'redux';

import makeEnhancer, { storeInterface } from './makeEnhancer';

const createStore = () => ({
	replaceReducer: jest.fn(),
	state: {},
});

const { getEntries } = storeInterface;

describe('makeEnhancer', () => {
	let store;

	beforeEach(() => {
		jest.clearAllMocks();
		store = makeEnhancer()(createStore)();
	});

	it('returns a Redux store with defined functions', () => {
		expect(store.injectReducers).toBeInstanceOf(Function);
		expect(store.ejectReducers).toBeInstanceOf(Function);
	});

	it('handles multiple calls to store.injectReducers', () => {
		store.injectReducers({ foo: identity }, { namespace: 'ns' });
		expect(store.replaceReducer).toHaveBeenCalledTimes(1);
		store.injectReducers({ foo: identity }, { namespace: 'ns' });
		expect(store.replaceReducer).toHaveBeenCalledTimes(2);
	});

	it('handles injecting and ejecting functions', () => {
		store.injectReducers(identity, { namespace: 'ns' });

		expect(store.replaceReducer).toHaveBeenCalledTimes(1);
		expect(getEntries(store)).toEqual([
			{ key: FUNCTION_KEY, value: identity, namespace: 'ns', feature: DEFAULT_FEATURE },
		]);

		store.ejectReducers(identity, { namespace: 'ns' });

		expect(store.replaceReducer).toHaveBeenCalledTimes(2);
		expect(getEntries(store)).toEqual([]);
	});

	it('X', () => {
		const store = createStoreRedux(identity, makeEnhancer());

		const reducerA = (state = { name: 'a' }) => state;
		const reducerB = (state = { name: 'b' }, action) =>
			action.type === 'X' ? { ...state, X: action.payload } : state;

		store.injectReducers({ a: reducerA }, { namespace: 'nsA' });
		expect(store.getState()).toEqual({
			namespaces: {
				nsA: { a: { name: 'a' } },
			},
		});

		store.injectReducers({ b: reducerB }, { namespace: 'nsB' });
		expect(store.getState()).toEqual({
			namespaces: {
				nsA: { a: { name: 'a' } },
				nsB: { b: { name: 'b' } },
			},
		});

		store.dispatch({ type: 'X', payload: 1 });
		expect(store.getState()).toEqual({
			namespaces: {
				nsA: { a: { name: 'a' } },
				nsB: { b: { name: 'b', X: 1 } },
			},
		});

		store.ejectReducers({ b: reducerB }, { namespace: 'nsB' });
		expect(store.getState()).toEqual({
			namespaces: {
				nsA: { a: { name: 'a' } },
			},
		});
	});

	// it('X FUCTION REQUIRES NAMESPACE', () => {
	// 	const store = createStoreRedux(
	// 		identity,
	// 		// This allows reducer injections
	// 		makeEnhancer()
	// 	);
	//
	// 	console.log(`store`, store);
	//
	// 	const reducerA = (state = { reducerA: 'a' }) => state;
	// 	const reducerB = (state = { reducerB: 'b' }) => state;
	//
	// 	store.injectReducers({ redA: reducerA });
	// 	console.log(`store`, store.getState());
	// 	expect(store.getState()).toEqual({
	// 		redA: { reducerA: 'a' },
	// 	});
	//
	// 	store.injectReducers(reducerB);
	// 	expect(store.getState()).toEqual({
	// 		redA: { reducerA: 'a' },
	// 		redB: { reducerB: 'b' },
	// 	});
	// 	//
	// 	// expect(store.replaceReducer).toHaveBeenCalledTimes(1);
	// 	// expect(getEntries(store)).toEqual([
	// 	// 	{ key: FUNCTION_KEY, value: reducer, namespace: 'ns', feature: DEFAULT_FEATURE },
	// 	// ]);
	// 	//
	// 	// console.log('store', store);
	// 	// console.log('store before ej', store.entries.reducers);
	// 	// store.ejectReducers(reducer, { namespace: 'ns' });
	// 	// console.log('store after ej', store.entries.reducers);
	// 	//
	// 	// expect(store.replaceReducer).toHaveBeenCalledTimes(2);
	// 	// expect(getEntries(store)).toEqual([]);
	// });
	//
	// it('throws when injecting a function without a namespace', () => {
	// 	expect(() => store.injectReducers(identity)).toThrow();
	// });
});
