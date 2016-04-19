import shallowEqual from 'fbjs/lib/shallowEqual';
/**
 *  @module PureRender
 */

/**
 * shouldComponentUpdate without context.
 *
 * @requires shallowEqual
 *
 * @param {Object} nextProps
 * @param {Object} nextState
 *
 * @returns {boolean}
 */
export function shouldComponentUpdate(nextProps, nextState) {
  return !shallowEqual(this.props, nextProps)
    || !shallowEqual(this.state, nextState);
}

/**
 * shouldComponentUpdate with context.
 *
 * @requires shallowEqual
 *
 * @param {Object} nextProps
 * @param {Object} nextState
 * @param {Object} nextContext
 *
 * @returns {boolean}
 */
export function shouldComponentUpdateContext(nextProps, nextState, nextContext) {
  return !shallowEqual(this.props, nextProps)
    || !shallowEqual(this.state, nextState)
    || !shallowEqual(this.context, nextContext);
}

export default { shouldComponentUpdate, shouldComponentUpdateContext };
