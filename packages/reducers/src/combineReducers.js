import {
	length,
	mapObjIndexed,
	pickBy,
	keys,
	o,
	mergeDeepRight,
	dissocPath,
	path,
	isEmpty,
} from 'ramda';
import { isFunction } from 'ramda-extension';

export default reducers => {
	const finalReducers = pickBy(isFunction, reducers);
	const finalReducerKeys = keys(finalReducers);

	return function combination(state = {}, action) {
		let hasChanged = false;
		const nextState = {};

		mapObjIndexed(key => {
			const reducer = finalReducers[key];
			const previousStateForKey = state[key];
			const nextStateForKey = reducer(previousStateForKey, action);
			nextState[key] = nextStateForKey;
			hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
		}, finalReducerKeys);

		hasChanged = hasChanged || length(finalReducerKeys) !== o(length, keys)(state);

		let finalState = hasChanged ? mergeDeepRight(state, nextState) : state;

		if (hasChanged && action && action.type === '@redux-tools/REDUCERS_EJECTED') {
			let newSt = state;
			const currentNameFeature = action.meta.feature || 'namespaces';

			// For all reducers that should be removed
			for (const reducerQ of action.payload) {
				// Remove reducer
				newSt = dissocPath([currentNameFeature, action.meta.namespace, reducerQ])(newSt);

				// Check if namespace of reducer is empty and delete it
				if (isEmpty(path([currentNameFeature, action.meta.namespace])(newSt))) {
					newSt = dissocPath([currentNameFeature, action.meta.namespace])(newSt);
				}

				// Check if object namespaces(feature) of namespaces is empty and delete it
				if (isEmpty(path([currentNameFeature])(newSt))) {
					newSt = dissocPath([currentNameFeature])(newSt);
				}
			}

			finalState = newSt;
		}

		return finalState;
	};
};
