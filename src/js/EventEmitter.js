/**
 * EventEmitter.js
 * Minimal event emitter for decoupled communication between game components.
 */
export class EventEmitter {
  constructor() {
    /** @type {Object<string, Function[]>} */
    this._listeners = {};
  }

  /**
   * Register a listener for an event.
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this._listeners[event]) {
      this._listeners[event] = [];
    }
    this._listeners[event].push(callback);
  }

  /**
   * Remove a listener for an event.
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit an event with optional arguments.
   * @param {string} event
   * @param {...*} args
   */
  emit(event, ...args) {
    if (!this._listeners[event]) return;
    for (const cb of this._listeners[event]) {
      cb(...args);
    }
  }
}
