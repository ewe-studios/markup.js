(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (setImmediate){(function (){
'use strict';

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      return constructor.resolve(callback()).then(function() {
        return constructor.reject(reason);
      });
    }
  );
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!arr || typeof arr.length === 'undefined')
      throw new TypeError('Promise.all accepts an array');
    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(values) {
  return new Promise(function(resolve, reject) {
    for (var i = 0, len = values.length; i < len; i++) {
      values[i].then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  (typeof setImmediate === 'function' &&
    function(fn) {
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

module.exports = Promise;

}).call(this)}).call(this,require("timers").setImmediate)

},{"timers":3}],3:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":1,"timers":3}],4:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.WHATWGFetch = {})));
}(this, (function (exports) { 'use strict';

  var global =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof self !== 'undefined' && self) ||
    (typeof global !== 'undefined' && global);

  var support = {
    searchParams: 'URLSearchParams' in global,
    iterable: 'Symbol' in global && 'iterator' in Symbol,
    blob:
      'FileReader' in global &&
      'Blob' in global &&
      (function() {
        try {
          new Blob();
          return true
        } catch (e) {
          return false
        }
      })(),
    formData: 'FormData' in global,
    arrayBuffer: 'ArrayBuffer' in global
  };

  function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
  }

  if (support.arrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
      };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(name) || name === '') {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return {done: value === undefined, value: value}
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function() {
        return iterator
      };
    }

    return iterator
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ', ' + value : value;
  };

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function(name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null
  };

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  };

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function(callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push(name);
    });
    return iteratorFor(items)
  };

  Headers.prototype.values = function() {
    var items = [];
    this.forEach(function(value) {
      items.push(value);
    });
    return iteratorFor(items)
  };

  Headers.prototype.entries = function() {
    var items = [];
    this.forEach(function(value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items)
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.onerror = function() {
        reject(reader.error);
      };
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('')
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0)
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function(body) {
      /*
        fetch-mock wraps the Response object in an ES6 Proxy to
        provide useful test harness features such as flush. However, on
        ES5 browsers without fetch or Proxy support pollyfills must be used;
        the proxy-pollyfill is unable to proxy an attribute unless it exists
        on the object before the Proxy is created. This change ensures
        Response.bodyUsed exists on the instance, while maintaining the
        semantic of setting Request.bodyUsed in the constructor before
        _initBody is called.
      */
      this.bodyUsed = this.bodyUsed;
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        this._bodyText = body = Object.prototype.toString.call(body);
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this);
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]))
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      };

      this.arrayBuffer = function() {
        if (this._bodyArrayBuffer) {
          var isConsumed = consumed(this);
          if (isConsumed) {
            return isConsumed
          }
          if (ArrayBuffer.isView(this._bodyArrayBuffer)) {
            return Promise.resolve(
              this._bodyArrayBuffer.buffer.slice(
                this._bodyArrayBuffer.byteOffset,
                this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
              )
            )
          } else {
            return Promise.resolve(this._bodyArrayBuffer)
          }
        } else {
          return this.blob().then(readBlobAsArrayBuffer)
        }
      };
    }

    this.text = function() {
      var rejected = consumed(this);
      if (rejected) {
        return rejected
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob)
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer))
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text')
      } else {
        return Promise.resolve(this._bodyText)
      }
    };

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      };
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    };

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method
  }

  function Request(input, options) {
    if (!(this instanceof Request)) {
      throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
    }

    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      this.signal = input.signal;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'same-origin';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.signal = options.signal || this.signal;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body);

    if (this.method === 'GET' || this.method === 'HEAD') {
      if (options.cache === 'no-store' || options.cache === 'no-cache') {
        // Search for a '_' parameter in the query string
        var reParamSearch = /([?&])_=[^&]*/;
        if (reParamSearch.test(this.url)) {
          // If it already exists then set the value with the current time
          this.url = this.url.replace(reParamSearch, '$1_=' + new Date().getTime());
        } else {
          // Otherwise add a new '_' parameter to the end with the current time
          var reQueryString = /\?/;
          this.url += (reQueryString.test(this.url) ? '&' : '?') + '_=' + new Date().getTime();
        }
      }
    }
  }

  Request.prototype.clone = function() {
    return new Request(this, {body: this._bodyInit})
  };

  function decode(body) {
    var form = new FormData();
    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');
          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });
    return form
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // https://tools.ietf.org/html/rfc7230#section-3.2
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');
    // Avoiding split via regex to work around a common IE11 bug with the core-js 3.6.0 regex polyfill
    // https://github.com/github/fetch/issues/748
    // https://github.com/zloirock/core-js/issues/751
    preProcessedHeaders
      .split('\r')
      .map(function(header) {
        return header.indexOf('\n') === 0 ? header.substr(1, header.length) : header
      })
      .forEach(function(line) {
        var parts = line.split(':');
        var key = parts.shift().trim();
        if (key) {
          var value = parts.join(':').trim();
          headers.append(key, value);
        }
      });
    return headers
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!(this instanceof Response)) {
      throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.')
    }
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = options.status === undefined ? 200 : options.status;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : '';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  };

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''});
    response.type = 'error';
    return response
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  };

  exports.DOMException = global.DOMException;
  try {
    new exports.DOMException();
  } catch (err) {
    exports.DOMException = function(message, name) {
      this.message = message;
      this.name = name;
      var error = Error(message);
      this.stack = error.stack;
    };
    exports.DOMException.prototype = Object.create(Error.prototype);
    exports.DOMException.prototype.constructor = exports.DOMException;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request = new Request(input, init);

      if (request.signal && request.signal.aborted) {
        return reject(new exports.DOMException('Aborted', 'AbortError'))
      }

      var xhr = new XMLHttpRequest();

      function abortXhr() {
        xhr.abort();
      }

      xhr.onload = function() {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        setTimeout(function() {
          resolve(new Response(body, options));
        }, 0);
      };

      xhr.onerror = function() {
        setTimeout(function() {
          reject(new TypeError('Network request failed'));
        }, 0);
      };

      xhr.ontimeout = function() {
        setTimeout(function() {
          reject(new TypeError('Network request failed'));
        }, 0);
      };

      xhr.onabort = function() {
        setTimeout(function() {
          reject(new exports.DOMException('Aborted', 'AbortError'));
        }, 0);
      };

      function fixUrl(url) {
        try {
          return url === '' && global.location.href ? global.location.href : url
        } catch (e) {
          return url
        }
      }

      xhr.open(request.method, fixUrl(request.url), true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if ('responseType' in xhr) {
        if (support.blob) {
          xhr.responseType = 'blob';
        } else if (
          support.arrayBuffer &&
          request.headers.get('Content-Type') &&
          request.headers.get('Content-Type').indexOf('application/octet-stream') !== -1
        ) {
          xhr.responseType = 'arraybuffer';
        }
      }

      if (init && typeof init.headers === 'object' && !(init.headers instanceof Headers)) {
        Object.getOwnPropertyNames(init.headers).forEach(function(name) {
          xhr.setRequestHeader(name, normalizeValue(init.headers[name]));
        });
      } else {
        request.headers.forEach(function(value, name) {
          xhr.setRequestHeader(name, value);
        });
      }

      if (request.signal) {
        request.signal.addEventListener('abort', abortXhr);

        xhr.onreadystatechange = function() {
          // DONE (success or failure)
          if (xhr.readyState === 4) {
            request.signal.removeEventListener('abort', abortXhr);
          }
        };
      }

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    })
  }

  fetch.polyfill = true;

  if (!global.fetch) {
    global.fetch = fetch;
    global.Headers = Headers;
    global.Request = Request;
    global.Response = Response;
  }

  exports.Headers = Headers;
  exports.Request = Request;
  exports.Response = Response;
  exports.fetch = fetch;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AFrame = exports.AnimationQueue = void 0;
const rafPolyfill = require("./raf-polyfill");
class AnimationQueue {
    constructor() {
        this.skip = false;
        this.binded = false;
        this.requestAnimationID = -1;
        this.frames = new Array();
        this.bindCycle = this.cycle.bind(this);
        this.rafProvider = rafPolyfill.GetRAF();
    }
    new() {
        const newFrame = new AFrame(this.frames.length, this);
        this.frames.push(newFrame);
        this.bind();
        return newFrame;
    }
    add(f) {
        f.queueIndex = this.frames.length;
        f.queue = this;
        this.frames.push(f);
        this.bind();
    }
    resume() {
        this.skip = false;
        this.bind();
    }
    pause() {
        this.skip = true;
    }
    unbind() {
        if (!this.binded) {
            return null;
        }
        this.rafProvider.cancelAnimationFrame(this.requestAnimationID);
    }
    bind() {
        if (this.binded)
            return null;
        this.requestAnimationID = this.rafProvider.requestAnimationFrame(this.bindCycle, null);
        this.binded = true;
    }
    cycle(ms) {
        if (this.frames.length === 0) {
            this.binded = false;
            return;
        }
        this.frames.forEach(function (f) {
            if (!f.paused()) {
                f.animate(ms);
            }
        });
        this.bind();
    }
}
exports.AnimationQueue = AnimationQueue;
class AFrame {
    constructor(index, queue) {
        this.skip = false;
        this.queue = queue;
        this.queueIndex = index;
        this.callbacks = new Array();
    }
    add(callback) {
        this.callbacks.push(callback);
    }
    clear() {
        this.callbacks.length = 0;
    }
    paused() {
        return this.skip;
    }
    pause() {
        this.skip = true;
    }
    stop() {
        this.pause();
        if (this.queueIndex === -1) {
            return null;
        }
        if (this.queue.frames.length == 0) {
            this.queue = undefined;
            this.queueIndex = -1;
            return null;
        }
        const total = this.queue.frames.length;
        if (total == 1) {
            this.queue.frames.pop();
            this.queue = undefined;
            this.queueIndex = -1;
            return null;
        }
        this.queue.frames[this.queueIndex] = this.queue.frames[total - 1];
        this.queue.frames.length = total - 1;
        this.queue = undefined;
        this.queueIndex = -1;
    }
    animate(ts) {
        for (let index in this.callbacks) {
            const callback = this.callbacks[index];
            callback(ts);
        }
    }
}
exports.AFrame = AFrame;
class ChangeManager {
    constructor(queue) {
        this.reads = new Array();
        this.writes = new Array();
        this.readState = false;
        this.inReadCall = false;
        this.inWriteCall = false;
        this.scheduled = false;
        this.frame = queue.new();
    }
    static drainTasks(q, wrapper) {
        let task = q.shift();
        while (task) {
            if (wrapper !== null) {
                wrapper(task);
                task = q.shift();
                continue;
            }
            task();
            task = q.shift();
        }
    }
    mutate(fn) {
        this.writes.push(fn);
        this._schedule();
    }
    read(fn) {
        this.reads.push(fn);
        this._schedule();
    }
    _schedule() {
        if (this.scheduled) {
            return;
        }
        this.scheduled = true;
        this.frame.add(this._runTasks.bind(this));
    }
    _runTasks() {
        const readError = this._runReads();
        if (readError !== null && readError !== undefined) {
            this.scheduled = false;
            this._schedule();
            throw readError;
        }
        const writeError = this._runWrites();
        if (writeError !== null && writeError !== undefined) {
            this.scheduled = false;
            this._schedule();
            throw writeError;
        }
        if (this.reads.length > 0 || this.writes.length > 0) {
            this.scheduled = false;
            this._schedule();
            return;
        }
        this.scheduled = false;
    }
    _runReads() {
        try {
            ChangeManager.drainTasks(this.reads, this._execReads.bind(this));
        }
        catch (e) {
            return e;
        }
        return null;
    }
    _execReads(task) {
        this.inReadCall = true;
        task();
        this.inReadCall = false;
    }
    _runWrites() {
        try {
            ChangeManager.drainTasks(this.writes, this._execWrite.bind(this));
        }
        catch (e) {
            return e;
        }
        return null;
    }
    _execWrite(task) {
        this.inWriteCall = true;
        task();
        this.inWriteCall = false;
    }
}

},{"./raf-polyfill":7}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountTo = void 0;
const rafPolyfill = require("./raf-polyfill");
const Animation = require("./anime");
const namespace = Object.assign(Object.assign({}, rafPolyfill), Animation);
function mountTo(parent) {
    parent.animations = namespace;
}
exports.mountTo = mountTo;
exports.default = namespace;

},{"./anime":5,"./raf-polyfill":7}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRAF = void 0;
const now = (function () {
    if (self.hasOwnProperty('performance')) {
        return ((performance.now ? performance.now.bind(performance) : null) ||
            (performance.mozNow ? performance.mozNow.bind(performance) : null) ||
            (performance.msNow ? performance.msNow.bind(performance) : null) ||
            (performance.oNow ? performance.oNow.bind(performance) : null) ||
            (performance.webkitNow ? performance.webkitNow.bind(performance) : null) ||
            Date.now.bind(Date));
    }
    return Date.now.bind(Date);
})();
const frameRate = 1000 / 60;
const vendors = ['ms', 'moz', 'webkit', 'o'];
function GetRAF() {
    let lastTime = 0;
    const mod = {};
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        mod.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        mod.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'RequestCancelAnimationFrame'];
    }
    if (!mod.requestAnimationFrame || !mod.cancelAnimationFrame)
        mod.requestAnimationFrame = function (callback, element) {
            const currTime = now();
            const timeToCall = Math.max(0, frameRate - (currTime - lastTime));
            const id = self.setTimeout(function () {
                try {
                    callback(currTime + timeToCall);
                }
                catch (e) {
                    console.log('Error: ', e);
                    setTimeout(function () {
                        throw e;
                    }, 0);
                }
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    if (!mod.cancelAnimationFrame) {
        mod.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
    return mod;
}
exports.GetRAF = GetRAF;

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchingNode = exports.toDataTransfer = exports.toGamepad = exports.toTouches = exports.toMediaStream = exports.toRotationData = exports.toMotionData = exports.toInputSourceCapability = exports.fromFile = exports.fromBlob = exports.removeFromNode = exports.createText = exports.createElement = exports.recordAttributes = exports.getNamespaceForTag = exports.applyAttributeTyped = exports.applySVGStyles = exports.applyStyles = exports.applyStyle = exports.applySVGStyle = exports.setStyleValue = exports.applyProp = exports.applyAttrs = exports.applyAttr = exports.getNamespace = exports.replaceNodeIf = exports.replaceNode = exports.insertBefore = exports.moveBefore = exports.getFocusedPath = exports.getActiveElement = exports.collectBreadthFirst = exports.toHTML = exports.eachNodeAndChild = exports.nodeListToArray = exports.eachChildAndNode = exports.reverseApplyEachNode = exports.applyEachNode = exports.applyEachChildNode = exports.applyChildNode = exports.findBreadthFirst = exports.collectDepthFirst = exports.findDepthFirst = exports.findNodeWithDepth = exports.findNodeWithBreadth = exports.collectNodeWithDepth = exports.collectNodeWithBreadth = exports.reverseFindNodeWithBreadth = exports.reverseCollectNodeWithBreadth = exports.getAncestry = exports.isText = exports.isElement = exports.isDocumentRoot = exports.COMMENT_NODE = exports.TEXT_NODE = exports.DOCUMENT_NODE = exports.DOCUMENT_FRAGMENT_NODE = exports.ELEMENT_NODE = void 0;
const utils_1 = require("./utils");
const exts = require("./extensions");
exports.ELEMENT_NODE = 1;
exports.DOCUMENT_FRAGMENT_NODE = 11;
exports.DOCUMENT_NODE = 9;
exports.TEXT_NODE = 3;
exports.COMMENT_NODE = 8;
const attributes = utils_1.createMap();
attributes['style'] = applyStyle;
function isDocumentRoot(node) {
    return node.nodeType === 11 || node.nodeType === 9;
}
exports.isDocumentRoot = isDocumentRoot;
function isElement(node) {
    return node.nodeType === 1;
}
exports.isElement = isElement;
function isText(node) {
    return node.nodeType === 3;
}
exports.isText = isText;
function getAncestry(node, root) {
    const ancestry = [];
    let cur = node;
    while (cur !== root) {
        const n = cur;
        ancestry.push(n);
        cur = n.parentNode;
    }
    return ancestry;
}
exports.getAncestry = getAncestry;
const getRootNode = Node.prototype.getRootNode ||
    function () {
        let cur = this;
        let prev = cur;
        while (cur) {
            prev = cur;
            cur = cur.parentNode;
        }
        return prev;
    };
function reverseCollectNodeWithBreadth(parent, matcher, matches) {
    let cur = parent.lastChild;
    while (cur) {
        if (matcher(cur)) {
            matches.push(cur);
        }
        cur = cur.previousSibling;
    }
}
exports.reverseCollectNodeWithBreadth = reverseCollectNodeWithBreadth;
function reverseFindNodeWithBreadth(parent, matcher) {
    let cur = parent.lastChild;
    while (cur) {
        if (matcher(cur)) {
            return cur;
        }
        cur = cur.previousSibling;
    }
    return null;
}
exports.reverseFindNodeWithBreadth = reverseFindNodeWithBreadth;
function collectNodeWithBreadth(parent, matcher, matches) {
    let cur = parent.firstChild;
    if (matcher(cur)) {
        matches.push(cur);
    }
    while (cur) {
        if (matcher(cur.nextSibling)) {
            matches.push(cur);
        }
        cur = cur.nextSibling;
    }
}
exports.collectNodeWithBreadth = collectNodeWithBreadth;
function collectNodeWithDepth(parent, matcher, matches) {
    let cur = parent.firstChild;
    while (cur) {
        if (matcher(cur)) {
            matches.push(cur);
        }
        cur = cur.firstChild;
    }
}
exports.collectNodeWithDepth = collectNodeWithDepth;
function findNodeWithBreadth(parent, matcher) {
    let cur = parent.firstChild;
    while (cur) {
        if (matcher(cur)) {
            return cur;
        }
        cur = cur.nextSibling;
    }
    return null;
}
exports.findNodeWithBreadth = findNodeWithBreadth;
function findNodeWithDepth(parent, matcher) {
    let cur = parent.firstChild;
    while (cur) {
        if (matcher(cur)) {
            return cur;
        }
        cur = cur.firstChild;
    }
    return null;
}
exports.findNodeWithDepth = findNodeWithDepth;
function findDepthFirst(parent, matcher) {
    let cur = parent.firstChild;
    while (cur) {
        const found = findNodeWithDepth(cur, matcher);
        if (found) {
            return found;
        }
        cur = cur.nextSibling;
    }
    return null;
}
exports.findDepthFirst = findDepthFirst;
function collectDepthFirst(parent, matcher, matches) {
    let cur = parent.firstChild;
    while (cur) {
        collectNodeWithDepth(cur, matcher, matches);
        cur = cur.nextSibling;
    }
    return;
}
exports.collectDepthFirst = collectDepthFirst;
function findBreadthFirst(parent, matcher) {
    let cur = parent.firstChild;
    while (cur) {
        const found = findNodeWithBreadth(cur, matcher);
        if (found) {
            return found;
        }
        cur = cur.firstChild;
    }
    return null;
}
exports.findBreadthFirst = findBreadthFirst;
function applyChildNode(parent, fn) {
    let cur = parent.firstChild;
    while (cur) {
        fn(cur);
        cur = cur.nextSibling;
    }
}
exports.applyChildNode = applyChildNode;
function applyEachChildNode(parent, fn) {
    let cur = parent.firstChild;
    while (cur) {
        fn(cur);
        applyEachChildNode(cur, fn);
        cur = cur.nextSibling;
    }
}
exports.applyEachChildNode = applyEachChildNode;
function applyEachNode(parent, fn) {
    fn(parent);
    let cur = parent.firstChild;
    while (cur) {
        applyEachNode(cur, fn);
        cur = cur.nextSibling;
    }
}
exports.applyEachNode = applyEachNode;
function reverseApplyEachNode(parent, fn) {
    let cur = parent.lastChild;
    while (cur) {
        reverseApplyEachNode(cur, fn);
        fn(cur);
        cur = cur.previousSibling;
    }
    fn(parent);
}
exports.reverseApplyEachNode = reverseApplyEachNode;
function eachChildAndNode(node, fn) {
    const list = node.childNodes;
    for (let i = 0; i < list.length; i++) {
        fn(list[i]);
    }
    fn(node);
}
exports.eachChildAndNode = eachChildAndNode;
function nodeListToArray(items) {
    const list = [];
    for (let i = 0; i < items.length; i++) {
        list.push(items[i]);
    }
    return list;
}
exports.nodeListToArray = nodeListToArray;
function eachNodeAndChild(node, fn) {
    fn(node);
    const list = node.childNodes;
    for (let i = 0; i < list.length; i++) {
        fn(list[i]);
    }
}
exports.eachNodeAndChild = eachNodeAndChild;
function toHTML(node, shallow) {
    const div = document.createElement('div');
    div.appendChild(node.cloneNode(!shallow));
    return div.innerHTML;
}
exports.toHTML = toHTML;
function collectBreadthFirst(parent, matcher, matches) {
    let cur = parent.firstChild;
    while (cur) {
        collectNodeWithBreadth(cur, matcher, matches);
        cur = cur.firstChild;
    }
    return;
}
exports.collectBreadthFirst = collectBreadthFirst;
function getActiveElement(node) {
    const root = getRootNode.call(node);
    return isDocumentRoot(root) ? root.activeElement : null;
}
exports.getActiveElement = getActiveElement;
function getFocusedPath(node, root) {
    const activeElement = getActiveElement(node);
    if (!activeElement || !node.contains(activeElement)) {
        return [];
    }
    return getAncestry(activeElement, root);
}
exports.getFocusedPath = getFocusedPath;
function moveBefore(parentNode, node, referenceNode) {
    const insertReferenceNode = node.nextSibling;
    let cur = referenceNode;
    while (cur !== null && cur !== node) {
        const next = cur.nextSibling;
        parentNode.insertBefore(cur, insertReferenceNode);
        cur = next;
    }
}
exports.moveBefore = moveBefore;
function insertBefore(parentNode, node, referenceNode) {
    if (referenceNode === null) {
        parentNode.appendChild(node);
        return null;
    }
    parentNode.insertBefore(node, referenceNode);
    return null;
}
exports.insertBefore = insertBefore;
function replaceNode(parentNode, node, replacement) {
    if (replacement === null) {
        return null;
    }
    parentNode.replaceChild(replacement, node);
    return null;
}
exports.replaceNode = replaceNode;
function replaceNodeIf(targetNode, replacement) {
    if (replacement === null) {
        return false;
    }
    const parent = targetNode.parentNode;
    if (!parent) {
        return false;
    }
    parent.replaceChild(replacement, targetNode);
    return true;
}
exports.replaceNodeIf = replaceNodeIf;
function getNamespace(name) {
    if (name.lastIndexOf('xml:', 0) === 0) {
        return 'http://www.w3.org/XML/1998/namespace';
    }
    if (name.lastIndexOf('xlink:', 0) === 0) {
        return 'http://www.w3.org/1999/xlink';
    }
    return undefined;
}
exports.getNamespace = getNamespace;
function applyAttr(el, name, value) {
    if (value == null) {
        el.removeAttribute(name);
    }
    else {
        const attrNS = getNamespace(name);
        if (attrNS) {
            el.setAttributeNS(attrNS, name, String(value));
        }
        else {
            el.setAttribute(name, String(value));
        }
    }
}
exports.applyAttr = applyAttr;
function applyAttrs(el, values) {
    for (let key in values) {
        if (values[key] == null) {
            el.removeAttribute(key);
            continue;
        }
        el.setAttribute(key, values[key]);
    }
}
exports.applyAttrs = applyAttrs;
function applyProp(el, name, value) {
    el[name] = value;
}
exports.applyProp = applyProp;
function setStyleValue(style, prop, value) {
    if (prop.indexOf('-') >= 0) {
        style.setProperty(prop, value);
    }
    else {
        style[prop] = value;
    }
}
exports.setStyleValue = setStyleValue;
function applySVGStyle(el, name, style) {
    if (typeof style === 'string') {
        el.style.cssText = style;
    }
    else {
        el.style.cssText = '';
        const elStyle = el.style;
        for (const prop in style) {
            if (utils_1.has(style, prop)) {
                setStyleValue(elStyle, prop, style[prop]);
            }
        }
    }
}
exports.applySVGStyle = applySVGStyle;
function applyStyle(el, name, style) {
    if (typeof style === 'string') {
        el.style.cssText = style;
    }
    else {
        el.style.cssText = '';
        const elStyle = el.style;
        for (const prop in style) {
            if (utils_1.has(style, prop)) {
                setStyleValue(elStyle, prop, style[prop]);
            }
        }
    }
}
exports.applyStyle = applyStyle;
function applyStyles(el, style) {
    if (typeof style === 'string') {
        el.style.cssText = style;
    }
    else {
        el.style.cssText = '';
        const elStyle = el.style;
        for (const prop in style) {
            if (utils_1.has(style, prop)) {
                setStyleValue(elStyle, prop, style[prop]);
            }
        }
    }
}
exports.applyStyles = applyStyles;
function applySVGStyles(el, style) {
    if (typeof style === 'string') {
        el.style.cssText = style;
    }
    else {
        el.style.cssText = '';
        const elStyle = el.style;
        for (const prop in style) {
            if (utils_1.has(style, prop)) {
                setStyleValue(elStyle, prop, style[prop]);
            }
        }
    }
}
exports.applySVGStyles = applySVGStyles;
function applyAttributeTyped(el, name, value) {
    const type = typeof value;
    if (type === 'object' || type === 'function') {
        applyProp(el, name, value);
    }
    else {
        applyAttr(el, name, value);
    }
}
exports.applyAttributeTyped = applyAttributeTyped;
function getNamespaceForTag(tag, parent) {
    if (tag === 'svg') {
        return 'http://www.w3.org/2000/svg';
    }
    if (tag === 'math') {
        return 'http://www.w3.org/1998/Math/MathML';
    }
    if (parent == null) {
        return null;
    }
    return parent.namespaceURI;
}
exports.getNamespaceForTag = getNamespaceForTag;
function recordAttributes(node) {
    const attrs = {};
    const attributes = node.attributes;
    const length = attributes.length;
    if (!length) {
        return attrs;
    }
    for (let i = 0, j = 0; i < length; i += 1, j += 2) {
        const attr = attributes[i];
        attrs[attr.name] = attr.value;
    }
    return attrs;
}
exports.recordAttributes = recordAttributes;
function createElement(doc, nameOrCtor, key, content, attributes, namespace) {
    let el;
    if (typeof nameOrCtor === 'function') {
        el = new nameOrCtor();
        return el;
    }
    namespace = namespace.trim();
    if (namespace.length > 0) {
        switch (nameOrCtor) {
            case 'svg':
                el = doc.createElementNS('http://www.w3.org/2000/svg', nameOrCtor);
                break;
            case 'math':
                el = doc.createElementNS('http://www.w3.org/1998/Math/MathML', nameOrCtor);
                break;
            default:
                el = doc.createElementNS(namespace, nameOrCtor);
        }
    }
    else {
        el = doc.createElement(nameOrCtor);
    }
    el.setAttribute('_key', key);
    if (attributes) {
        applyAttrs(el, attributes);
    }
    if (content.length > 0) {
        el.innerHTML = content;
    }
    return el;
}
exports.createElement = createElement;
function createText(doc, text, key) {
    const node = doc.createTextNode(text);
    exts.Objects.PatchWith(node, 'key', key);
    return node;
}
exports.createText = createText;
function removeFromNode(fromNode, endNode) {
    const parentNode = fromNode.parentNode;
    let child = fromNode;
    while (child !== endNode) {
        const next = child.nextSibling;
        parentNode.removeChild(child);
        child = next;
    }
}
exports.removeFromNode = removeFromNode;
function fromBlob(o) {
    if (o === null || o === undefined) {
        return;
    }
    let data = null;
    const fileReader = new FileReader();
    fileReader.onloadend = function () {
        data = new Uint8Array(fileReader.result);
    };
    fileReader.readAsArrayBuffer(o);
    return data;
}
exports.fromBlob = fromBlob;
function fromFile(o) {
    if (o === null || o === undefined) {
        return;
    }
    let data = null;
    const fileReader = new FileReader();
    fileReader.onloadend = function () {
        data = new Uint8Array(fileReader.result);
    };
    fileReader.readAsArrayBuffer(o);
    return data;
}
exports.fromFile = fromFile;
function toInputSourceCapability(o) {
    if (o === null || o === undefined) {
        return;
    }
    return {
        FiresTouchEvent: o.firesTouchEvent,
    };
}
exports.toInputSourceCapability = toInputSourceCapability;
function toMotionData(o) {
    let md = { X: 0.0, Y: 0.0, Z: 0.0 };
    if (o === null || o === undefined) {
        return md;
    }
    md.X = o.x;
    md.Y = o.y;
    md.Z = o.z;
    return md;
}
exports.toMotionData = toMotionData;
function toRotationData(o) {
    if (o === null || o === undefined) {
        return;
    }
    const md = {};
    md.Alpha = o.alpha;
    md.Beta = o.beta;
    md.Gamma = o.gamma;
    return md;
}
exports.toRotationData = toRotationData;
function toMediaStream(o) {
    if (o === null || o === undefined) {
        return;
    }
    const stream = { Audios: [], Videos: [] };
    stream.Active = o.active;
    stream.Ended = o.ended;
    stream.ID = o.id;
    stream.Audios = [];
    stream.Videos = [];
    let audioTracks = o.getAudioTracks();
    if (audioTracks !== null && audioTracks !== undefined) {
        for (let i = 0; i < audioTracks.length; i++) {
            let track = audioTracks[i];
            let settings = track.getSettings();
            stream.Audios.push({
                Enabled: track.enabled,
                ID: track.id,
                Kind: track.kind,
                Label: track.label,
                Muted: track.muted,
                ReadyState: track.readyState,
                Remote: track.remote,
                AudioSettings: {
                    ChannelCount: settings.channelCount.Int(),
                    EchoCancellation: settings.echoCancellation,
                    Latency: settings.latency,
                    SampleRate: settings.sampleRate.Int64(),
                    SampleSize: settings.sampleSize.Int64(),
                    Volume: settings.volume,
                    MediaTrackSettings: {
                        DeviceID: settings.deviceId,
                        GroupID: settings.groupId,
                    },
                },
            });
        }
    }
    let videosTracks = o.getVideoTracks();
    if (videosTracks !== null && videosTracks !== undefined) {
        for (let i = 0; i < videosTracks.length; i++) {
            let track = videosTracks[i];
            let settings = track.getSettings();
            stream.Videos.push({
                Enabled: track.enabled,
                ID: track.id,
                Kind: track.kind,
                Label: track.label,
                Muted: track.muted,
                ReadyState: track.readyState,
                Remote: track.remote,
                VideoSettings: {
                    AspectRatio: settings.aspectRation,
                    FrameRate: settings.frameRate,
                    Height: settings.height.Int64(),
                    Width: settings.width.Int64(),
                    FacingMode: settings.facingMode,
                    MediaTrackSettings: {
                        DeviceID: settings.deviceId,
                        GroupID: settings.groupId,
                    },
                },
            });
        }
    }
    return stream;
}
exports.toMediaStream = toMediaStream;
function toTouches(o) {
    if (o === null || o === undefined) {
        return;
    }
    const touches = [];
    for (let i = 0; i < o.length; i++) {
        let ev = o.item(i);
        touches.push({
            ClientX: ev.clientX,
            ClientY: ev.clientY,
            OffsetX: ev.offsetX,
            OffsetY: ev.offsetY,
            PageX: ev.pageX,
            PageY: ev.pageY,
            ScreenX: ev.screenX,
            ScreenY: ev.screenY,
            Identifier: ev.identifier,
        });
    }
    return touches;
}
exports.toTouches = toTouches;
function toGamepad(o) {
    let pad = {};
    if (o === null || o === undefined) {
        return pad;
    }
    pad.DisplayID = o.displayId;
    pad.ID = o.id;
    pad.Index = o.index.Int();
    pad.Mapping = o.mapping;
    pad.Connected = o.connected;
    pad.Timestamp = o.timestamp;
    pad.Axes = [];
    pad.Buttons = [];
    let axes = o.axes;
    if (axes !== null && axes !== undefined) {
        for (let i = 0; i < axes.length; i++) {
            pad.Axes.push(axes[i]);
        }
    }
    let buttons = o.buttons;
    if (buttons !== null && buttons !== undefined) {
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            pad.Buttons.push({
                Value: button.value,
                Pressed: button.pressed,
            });
        }
    }
    return pad;
}
exports.toGamepad = toGamepad;
function toDataTransfer(o) {
    if (o === null || o === undefined) {
        return;
    }
    let dt = {};
    dt.DropEffect = o.dropEffect;
    dt.EffectAllowed = o.effectAllowed;
    dt.Types = o.types;
    dt.Items = [];
    const items = o.items;
    if (items !== null && items !== undefined) {
        for (let i = 0; i < items.length; i++) {
            const item = items.DataTransferItem(i);
            dt.Items.push({
                Name: item.name,
                Size: item.size.Int(),
                Data: fromFile(item),
            });
        }
    }
    dt.Files = [];
    const files = o.files;
    if (files !== null && files !== undefined) {
        for (let i = 0; i < files.length; i++) {
            const item = files[i];
            dFiles.push({
                Name: item.name,
                Size: item.size.Int(),
                Data: fromFile(item),
            });
        }
    }
    return dt;
}
exports.toDataTransfer = toDataTransfer;
function getMatchingNode(matchNode, matcher) {
    if (!matchNode) {
        return null;
    }
    if (matcher(matchNode)) {
        return matchNode;
    }
    while ((matchNode = matchNode.nextSibling)) {
        if (matcher(matchNode)) {
            return matchNode;
        }
    }
    return null;
}
exports.getMatchingNode = getMatchingNode;

},{"./extensions":9,"./utils":13}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Objects = void 0;
var Objects;
(function (Objects) {
    function PatchWith(elem, attrName, attrs) {
        elem[attrName] = attrs;
    }
    Objects.PatchWith = PatchWith;
    function GetAttrWith(elem, attrName) {
        const value = elem[attrName];
        return value ? value : '';
    }
    Objects.GetAttrWith = GetAttrWith;
    function isNullOrUndefined(elem) {
        return elem === null || elem === undefined;
    }
    Objects.isNullOrUndefined = isNullOrUndefined;
    function isAny(elem, ...values) {
        for (let index of values) {
            if (elem === index) {
                return true;
            }
        }
        return false;
    }
    Objects.isAny = isAny;
})(Objects = exports.Objects || (exports.Objects = {}));

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountTo = void 0;
const utils = require("./utils");
const exts = require("./extensions");
const patch = require("./patch");
const mount = require("./mount");
const dom = require("./dom");
const namespace = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, utils), exts), patch), dom), mount);
function mountTo(parent) {
    parent.markup = namespace;
}
exports.mountTo = mountTo;
exports.default = namespace;

},{"./dom":8,"./extensions":9,"./mount":11,"./patch":12,"./utils":13}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMMount = void 0;
const dom = require("./dom");
const patch = require("./patch");
const utils = require("./utils");
class DOMMount {
    constructor(document, target, notifier) {
        if (typeof document !== 'object') {
            throw new Error('document should be an object');
        }
        this.doc = document;
        this.notifier = notifier;
        this.events = {};
        this.handler = this.handleEvent.bind(this);
        if (typeof target === 'string') {
            const targetSelector = target;
            const node = this.doc.querySelector(targetSelector);
            if (node === null || node === undefined) {
                throw new Error(`unable to locate node for ${{ targetSelector }}`);
            }
            this.mountNode = node;
        }
        else {
            this.mountNode = target;
        }
    }
    handleEvent(event) {
        if (!this.events[event.type]) {
            return;
        }
        event.stopPropagation();
        const target = event.target;
        if (target.nodeType !== dom.ELEMENT_NODE) {
            return;
        }
        const targetElement = target;
        const kebabEventName = 'event-' + utils.ToKebabCase(event.type);
        if (!targetElement.hasAttribute(kebabEventName)) {
            return;
        }
        const triggers = targetElement.getAttribute(kebabEventName);
        if (triggers == null) {
            return;
        }
        if (this.notifier && typeof this.notifier === 'function') {
            this.notifier(event, triggers.split('|'), targetElement);
        }
    }
    patch(change) {
        this.patchWith(change, patch.DefaultNodeDictator, patch.DefaultJSONDictator, patch.DefaultJSONMaker);
    }
    patchWith(change, nodeDictator, jsonDictator, jsonMaker) {
        if (change instanceof DocumentFragment) {
            const fragment = change;
            this.registerNodeEvents(fragment);
            patch.PatchDOMTree(fragment, this.mountNode, nodeDictator, false);
            return;
        }
        if (typeof change === 'string') {
            const node = document.createElement('div');
            node.innerHTML = change.trim();
            this.registerNodeEvents(node);
            patch.PatchDOMTree(node, this.mountNode, nodeDictator, false);
            return;
        }
        if (!patch.isJSONNode(change)) {
            return;
        }
        const node = change;
        this.registerJSONNodeEvents(node);
        patch.PatchJSONNodeTree(node, this.mountNode, jsonDictator, jsonMaker);
    }
    patchList(changes) {
        changes.forEach(this.patch.bind(this));
    }
    stream(changes) {
        const nodes = JSON.parse(changes);
        return this.streamList(nodes);
    }
    streamList(changes) {
        this.streamListWith(changes, patch.DefaultJSONDictator, patch.DefaultJSONMaker);
    }
    streamListWith(changes, dictator, maker) {
        changes.forEach(this.registerJSONNodeEvents.bind(this));
        patch.StreamJSONNodes(changes, this.mountNode, patch.DefaultJSONDictator, patch.DefaultJSONMaker);
    }
    registerNodeEvents(n) {
        const binder = this;
        dom.applyEachNode(n, function (node) {
            if (node.nodeType !== dom.ELEMENT_NODE) {
                return;
            }
            const elem = node;
            const events = elem.getAttribute('events');
            if (events) {
                events.split(' ').forEach(function (desc) {
                    const eventName = desc.substr(0, desc.length - 3);
                    binder.registerEvent(eventName);
                    switch (desc.substr(desc.length - 2, desc.length)) {
                        case '01':
                            break;
                        case '10':
                            n.addEventListener(eventName, DOMMount.preventDefault, false);
                            break;
                        case '11':
                            n.addEventListener(eventName, DOMMount.preventDefault, false);
                            break;
                    }
                });
            }
        });
    }
    registerJSONNodeEvents(node) {
        const binder = this;
        patch.applyJSONNodeFunction(node, function (n) {
            if (n.removed) {
                n.events.forEach(function (desc) {
                    binder.unregisterEvent(desc.Name);
                });
                return;
            }
            n.events.forEach(function (desc) {
                binder.registerEvent(desc.Name);
            });
        });
    }
    textContent() {
        return this.mountNode.textContent;
    }
    innerHTML() {
        return this.mountNode.innerHTML.trim();
    }
    Html() {
        return dom.toHTML(this.mountNode, false);
    }
    registerEvent(eventName) {
        if (this.events[eventName]) {
            return;
        }
        this.mountNode.addEventListener(eventName, this.handler, true);
        this.events[eventName] = true;
    }
    unregisterEvent(eventName) {
        if (!this.events[eventName]) {
            return;
        }
        this.mountNode.removeEventListener(eventName, this.handler, true);
        this.events[eventName] = false;
    }
    static preventDefault(event) {
        event.preventDefault();
    }
    static stopPropagation(event) {
        event.stopPropagation();
    }
}
exports.DOMMount = DOMMount;

},{"./dom":8,"./patch":12,"./utils":13}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatchDOMAttributes = exports.PatchDOMTree = exports.PatchJSONAttributes = exports.PatchTextCommentWithJSON = exports.ApplyStreamNode = exports.StreamJSONNodes = exports.PatchJSONNode = exports.PatchJSONNodeTree = exports.jsonMaker = exports.DefaultJSONMaker = exports.findElementParentbyRef = exports.findElementbyRef = exports.findElement = exports.isJSONNode = exports.applyJSONNodeKidsFunction = exports.applyJSONNodeFunction = exports.JSONEvent = exports.NodeToJSONNode = exports.ToJSONNode = exports.DefaultJSONDictator = exports.DefaultNodeDictator = void 0;
const dom = require("./dom");
const utils = require("./utils");
const exts = require("./extensions");
const dom_1 = require("./dom");
exports.DefaultNodeDictator = {
    Same: (n, m) => {
        const sameNode = n.nodeType === m.nodeType && n.nodeName === m.nodeName;
        if (!sameNode) {
            return false;
        }
        if (n.nodeType !== dom.ELEMENT_NODE) {
            return true;
        }
        const nElem = n;
        const mElem = m;
        return nElem.id === mElem.id;
    },
    Changed: (n, m) => {
        if (n.nodeType === dom.TEXT_NODE && m.nodeType === dom.TEXT_NODE) {
            return n.textContent === m.textContent;
        }
        if (n.nodeType === dom.COMMENT_NODE && m.nodeType === dom.COMMENT_NODE) {
            return n.textContent === m.textContent;
        }
        const nElem = n;
        const mElem = m;
        const nAttr = dom.recordAttributes(nElem);
        const mAttr = dom.recordAttributes(mElem);
        if (!nAttr.hasOwnProperty('_tid') && mAttr.hasOwnProperty('_tid')) {
            return true;
        }
        if (nAttr.hasOwnProperty('_atid')) {
            return !(mAttr._atid === nAttr._tid && mAttr._tid === mAttr._atid);
        }
        delete mAttr['_atid'];
        delete nAttr['_atid'];
        delete mAttr['_tid'];
        delete nAttr['_tid'];
        for (let key in mAttr) {
            if (!nAttr.hasOwnProperty(key)) {
                return true;
            }
            if (mAttr[key] !== nAttr[key]) {
                return true;
            }
        }
        return nElem.innerHTML !== mElem.innerHTML;
    },
};
exports.DefaultJSONDictator = {
    Same: (n, m) => {
        const sameNode = n.nodeType === m.type && n.nodeName === m.name;
        if (!sameNode) {
            return false;
        }
        if (n.nodeType !== dom.ELEMENT_NODE) {
            return true;
        }
        const nElem = n;
        return nElem.id === m.id;
    },
    Changed: (n, m) => {
        if (n.nodeType === dom.TEXT_NODE && m.type === dom.TEXT_NODE) {
            return n.textContent !== m.content;
        }
        if (n.nodeType === dom.COMMENT_NODE && m.type === dom.COMMENT_NODE) {
            return n.textContent !== m.content;
        }
        const tnode = n;
        if (tnode.hasAttribute('id')) {
            const id = tnode.getAttribute('id');
            if (id !== m.id) {
                return true;
            }
        }
        if (tnode.hasAttribute('_ref')) {
            const ref = tnode.getAttribute('_ref');
            if (ref !== m.ref) {
                return true;
            }
        }
        const tid = tnode.getAttribute('_tid');
        const atid = tnode.getAttribute('_atid');
        if (tnode.hasAttribute('_tid')) {
            if (tid !== m.tid) {
                return true;
            }
            if (tnode.hasAttribute('_atid')) {
                if (tid !== m.tid && atid !== m.atid) {
                    return true;
                }
                if (tid !== m.tid && atid === m.atid) {
                    return true;
                }
            }
        }
        if (!tnode.hasAttribute('events') && m.events.length !== 0) {
            return true;
        }
        for (var index = 0; index < m.events.length; index++) {
            let event = m.events[index];
            let attrName = 'event-' + event.Name;
            let attrValue = event.Targets.join('|');
            let nodeAttr = tnode.attributes.getNamedItem(attrName);
            if (nodeAttr == null) {
                return true;
            }
            if (nodeAttr.value != attrValue) {
                return true;
            }
        }
        return true;
    },
};
function ToJSONNode(node, shallow, parentNode) {
    const list = new Array();
    if (typeof node === 'string') {
        const pub = document.createElement('div');
        pub.innerHTML = node.trim();
        dom.applyChildNode(pub, function (child) {
            list.push(NodeToJSONNode(child, shallow, parentNode));
        });
        return list;
    }
    list.push(NodeToJSONNode(node, shallow, parentNode));
    return list;
}
exports.ToJSONNode = ToJSONNode;
function NodeToJSONNode(node, shallow, parentNode) {
    const jnode = {};
    jnode.children = [];
    jnode.events = [];
    jnode.attrs = [];
    jnode.namespace = '';
    jnode.type = node.nodeType;
    jnode.name = node.nodeName.toLowerCase();
    jnode.id = exts.Objects.GetAttrWith(node, '_id');
    jnode.tid = exts.Objects.GetAttrWith(node, '_tid');
    jnode.ref = exts.Objects.GetAttrWith(node, '_ref');
    jnode.atid = exts.Objects.GetAttrWith(node, '_atid');
    const elem = node;
    if (elem === null)
        return jnode;
    if (node._tid) {
        jnode.tid = node._tid;
    }
    switch (node.nodeType) {
        case dom_1.TEXT_NODE:
            jnode.typeName = 'Text';
            jnode.content = node.textContent;
            return jnode;
        case dom_1.COMMENT_NODE:
            jnode.typeName = 'Comment';
            jnode.content = node.textContent;
            return jnode;
        case dom_1.ELEMENT_NODE:
            jnode.typeName = 'Element';
            jnode.children = new Array();
            break;
        default:
            throw new Error(`unable to handle node type ${node.nodeType}`);
    }
    if (exts.Objects.isNullOrUndefined(elem)) {
        if (jnode.id === '') {
            jnode.id = utils.RandomID();
        }
        return jnode;
    }
    if (elem.hasAttribute('id')) {
        jnode.id = elem.getAttribute('id');
    }
    else {
        jnode.id = utils.RandomID();
    }
    if (jnode.ref === '' && !exts.Objects.isNullOrUndefined(parentNode)) {
        jnode.ref = jnode.id;
    }
    if (elem.hasAttribute('_ref')) {
        jnode.ref = elem.getAttribute('_ref');
    }
    else {
        if (!exts.Objects.isNullOrUndefined(parentNode)) {
            if (parentNode.ref !== '') {
                jnode.ref = parentNode.ref + '/' + jnode.id;
            }
            else {
                jnode.ref = parentNode.id + '/' + jnode.id;
            }
        }
    }
    if (elem.hasAttribute('_tid')) {
        jnode.tid = elem.getAttribute('_tid');
    }
    if (elem.hasAttribute('_atid')) {
        jnode.atid = elem.getAttribute('_atid');
    }
    for (var i = 0; i < elem.attributes.length; i++) {
        let attr = elem.attributes.item(i);
        if (attr == null)
            continue;
        if (!attr.name.startsWith('event-')) {
            continue;
        }
        let eventName = attr.name.replace('event-', '');
        jnode.events.push(JSONEvent(eventName, attr.value.split('|')));
    }
    if (!shallow) {
        dom.applyChildNode(node, function (child) {
            if (child instanceof Text || child instanceof Comment) {
                jnode.children.push(NodeToJSONNode(child, false, jnode));
                return;
            }
            const childElem = child;
            if (!childElem.hasAttribute('id')) {
                childElem.id = utils.RandomID();
            }
            jnode.children.push(NodeToJSONNode(childElem, false, jnode));
        });
    }
    return jnode;
}
exports.NodeToJSONNode = NodeToJSONNode;
function JSONEvent(name, targets) {
    const event = {};
    event.Name = name;
    event.Targets = targets;
    return event;
}
exports.JSONEvent = JSONEvent;
function applyJSONNodeFunction(node, fn) {
    fn(node);
    node.children.forEach(function (child) {
        applyJSONNodeFunction(child, fn);
    });
}
exports.applyJSONNodeFunction = applyJSONNodeFunction;
function applyJSONNodeKidsFunction(node, fn) {
    node.children.forEach(function (child) {
        applyJSONNodeFunction(child, fn);
    });
    fn(node);
}
exports.applyJSONNodeKidsFunction = applyJSONNodeKidsFunction;
function isJSONNode(n) {
    const hasID = typeof n.id !== 'undefined';
    const hasRef = typeof n.ref !== 'undefined';
    const hasTid = typeof n.tid !== 'undefined';
    const hasTypeName = typeof n.typeName !== 'undefined';
    return hasID && hasRef && hasTypeName && hasTid;
}
exports.isJSONNode = isJSONNode;
function findElement(desc, parent) {
    const selector = desc.name + '#' + desc.id;
    const targets = parent.querySelectorAll(selector);
    if (targets.length === 0) {
        let attrSelector = desc.name + `[_tid='${desc.tid}']`;
        let target = parent.querySelector(attrSelector);
        if (target) {
            return target;
        }
        attrSelector = desc.name + `[_atid='${desc.atid}']`;
        target = parent.querySelector(attrSelector);
        if (target) {
            return target;
        }
        attrSelector = desc.name + `[_ref='${desc.ref}']`;
        return parent.querySelector(attrSelector);
    }
    if (targets.length === 1) {
        return targets[0];
    }
    const total = targets.length;
    for (let i = 0; i < total; i++) {
        const elem = targets.item(i);
        if (elem.getAttribute('_tid') === desc.tid) {
            return elem;
        }
        if (elem.getAttribute('_atid') === desc.atid) {
            return elem;
        }
        if (elem.getAttribute('_ref') === desc.ref) {
            return elem;
        }
    }
    return null;
}
exports.findElement = findElement;
function findElementbyRef(ref, parent) {
    const ids = ref.split('/').map(function (elem) {
        if (elem.trim() === '') {
            return '';
        }
        return '#' + elem;
    });
    if (ids.length === 0) {
        return null;
    }
    if (ids[0] === '' || ids[0].trim() === '') {
        ids.shift();
    }
    const first = ids[0];
    if (parent.id == first.substr(1)) {
        ids.shift();
    }
    let cur = parent.querySelector(ids.shift());
    while (cur) {
        if (ids.length === 0) {
            return cur;
        }
        cur = cur.querySelector(ids.shift());
    }
    return cur;
}
exports.findElementbyRef = findElementbyRef;
function findElementParentbyRef(ref, parent) {
    const ids = ref.split('/').map(function (elem) {
        if (elem.trim() === '') {
            return '';
        }
        return '#' + elem;
    });
    if (ids.length === 0) {
        return null;
    }
    if (ids[0] === '' || ids[0].trim() === '') {
        ids.shift();
    }
    ids.pop();
    const first = ids[0];
    if (parent.id == first.substr(1)) {
        ids.shift();
    }
    let cur = parent.querySelector(ids.shift());
    while (cur) {
        if (ids.length === 0) {
            return cur;
        }
        cur = cur.querySelector(ids.shift());
    }
    return cur;
}
exports.findElementParentbyRef = findElementParentbyRef;
exports.DefaultJSONMaker = {
    Make: jsonMaker,
};
function jsonMaker(doc, descNode, shallow, skipRemoved) {
    if (descNode.type === dom_1.COMMENT_NODE) {
        const node = doc.createComment(descNode.content);
        exts.Objects.PatchWith(node, '_id', descNode.id);
        exts.Objects.PatchWith(node, '_ref', descNode.ref);
        exts.Objects.PatchWith(node, '_tid', descNode.tid);
        exts.Objects.PatchWith(node, '_atid', descNode.atid);
        return node;
    }
    if (descNode.type === dom_1.TEXT_NODE) {
        const node = doc.createTextNode(descNode.content);
        exts.Objects.PatchWith(node, '_id', descNode.id);
        exts.Objects.PatchWith(node, '_ref', descNode.ref);
        exts.Objects.PatchWith(node, '_tid', descNode.tid);
        exts.Objects.PatchWith(node, '_atid', descNode.atid);
        return node;
    }
    if (descNode.id === '') {
        descNode.id = utils.RandomID();
    }
    let node;
    if (descNode.namespace.length !== 0) {
        node = doc.createElement(descNode.name);
    }
    else {
        node = doc.createElementNS(descNode.namespace, descNode.name);
    }
    exts.Objects.PatchWith(node, '_id', descNode.id);
    exts.Objects.PatchWith(node, '_ref', descNode.ref);
    exts.Objects.PatchWith(node, '_tid', descNode.tid);
    exts.Objects.PatchWith(node, '_atid', descNode.atid);
    node.setAttribute('id', descNode.id);
    node.setAttribute('_tid', descNode.tid);
    node.setAttribute('_ref', descNode.ref);
    node.setAttribute('_atid', descNode.atid);
    descNode.events.forEach(function events(event) {
        node.setAttribute('event-' + event.Name, event.Targets.join('|'));
    });
    descNode.attrs.forEach(function attrs(attr) {
        node.setAttribute(attr.Key, attr.Value);
    });
    if (descNode.removed) {
        node.setAttribute('_removed', 'true');
        return node;
    }
    if (!shallow) {
        descNode.children.forEach(function (kidJSON) {
            if (skipRemoved && kidJSON.removed) {
                return;
            }
            node.appendChild(jsonMaker(doc, kidJSON, shallow, skipRemoved));
        });
    }
    return node;
}
exports.jsonMaker = jsonMaker;
function PatchJSONNodeTree(fragment, mount, dictator, maker) {
    let targetNode = findElement(fragment, mount);
    if (exts.Objects.isNullOrUndefined(targetNode)) {
        const tNode = maker.Make(document, fragment, false, true);
        mount.appendChild(tNode);
        return;
    }
    PatchJSONNode(fragment, targetNode, dictator, maker);
}
exports.PatchJSONNodeTree = PatchJSONNodeTree;
function PatchJSONNode(fragment, targetNode, dictator, maker) {
    if (!dictator.Same(targetNode, fragment)) {
        const tNode = maker.Make(document, fragment, false, true);
        dom.replaceNode(targetNode.parentNode, targetNode, tNode);
        return;
    }
    if (!dictator.Changed(targetNode, fragment)) {
        return;
    }
    PatchJSONAttributes(fragment, targetNode);
    const kids = dom.nodeListToArray(targetNode.childNodes);
    const totalKids = kids.length;
    const fragmentKids = fragment.children.length;
    let i = 0;
    for (; i < totalKids; i++) {
        const childNode = kids[i];
        if (i >= fragmentKids) {
            const chnode = childNode;
            if (chnode) {
                chnode.remove();
            }
            continue;
        }
        const childFragment = fragment.children[i];
        PatchJSONNode(childFragment, childNode, dictator, maker);
    }
    for (; i < fragmentKids; i++) {
        const tNode = maker.Make(document, fragment, false, true);
        targetNode.appendChild(tNode);
    }
    return;
}
exports.PatchJSONNode = PatchJSONNode;
function StreamJSONNodes(fragment, mount, dictator, maker) {
    const changes = fragment.filter(function (elem) {
        return !elem.removed;
    });
    fragment
        .filter(function (elem) {
        if (!elem.removed) {
            return false;
        }
        let filtered = true;
        changes.forEach(function (el) {
            if (elem.tid === el.tid || elem.tid == el.atid || elem.ref === el.ref) {
                filtered = false;
            }
        });
        return filtered;
    })
        .forEach(function (removal) {
        const target = findElement(removal, mount);
        if (target) {
            target.remove();
        }
    });
    changes.forEach(function (change) {
        const targetNode = findElement(change, mount);
        if (exts.Objects.isNullOrUndefined(targetNode)) {
            const targetNodeParent = findElementParentbyRef(change.ref, mount);
            if (exts.Objects.isNullOrUndefined(targetNodeParent)) {
                console.log('Unable to apply new change stream: ', change);
                return;
            }
            const tNode = maker.Make(document, change, false, true);
            targetNodeParent.appendChild(tNode);
            return;
        }
        ApplyStreamNode(change, targetNode, dictator, maker);
    });
    return;
}
exports.StreamJSONNodes = StreamJSONNodes;
function ApplyStreamNode(fragment, targetNode, dictator, maker) {
    if (!dictator.Same(targetNode, fragment)) {
        const tNode = maker.Make(document, fragment, false, true);
        dom.replaceNode(targetNode.parentNode, targetNode, tNode);
        return;
    }
    if (dictator.Changed(targetNode, fragment)) {
        PatchJSONAttributes(fragment, targetNode);
    }
    const totalKids = targetNode.childNodes.length;
    const fragmentKids = fragment.children.length;
    let i = 0;
    for (; i < totalKids; i++) {
        const childNode = targetNode.childNodes[i];
        if (i >= fragmentKids) {
            return;
        }
        const childFragment = fragment.children[i];
        PatchJSONNode(childFragment, childNode, dictator, maker);
    }
    for (; i < fragmentKids; i++) {
        const tNode = maker.Make(document, fragment, false, true);
        targetNode.appendChild(tNode);
    }
    return;
}
exports.ApplyStreamNode = ApplyStreamNode;
function PatchTextCommentWithJSON(fragment, target) {
    if (fragment.type !== dom_1.COMMENT_NODE && fragment.type !== dom_1.TEXT_NODE) {
        return;
    }
    if (fragment.type !== dom_1.COMMENT_NODE && fragment.type !== dom_1.TEXT_NODE) {
        return;
    }
    if (target.textContent === fragment.content) {
        return;
    }
    target.textContent = fragment.content;
    exts.Objects.PatchWith(target, '_ref', fragment.ref);
    exts.Objects.PatchWith(target, '_tid', fragment.tid);
    exts.Objects.PatchWith(target, '_atid', fragment.atid);
}
exports.PatchTextCommentWithJSON = PatchTextCommentWithJSON;
function PatchJSONAttributes(node, target) {
    const oldNodeAttrs = dom.recordAttributes(target);
    node.attrs.forEach(function (attr) {
        const oldValue = oldNodeAttrs[attr.Key];
        delete oldNodeAttrs[attr.Key];
        if (attr.Value === oldValue) {
            return null;
        }
        target.setAttribute(attr.Key, attr.Value);
    });
    for (let index in oldNodeAttrs) {
        target.removeAttribute(index);
    }
    target.setAttribute('_tid', node.tid);
    target.setAttribute('_ref', node.ref);
    target.setAttribute('_atid', node.atid);
    node.events.forEach(function events(event) {
        target.setAttribute('event-' + event.Name, event.Targets.join('|'));
    });
    exts.Objects.PatchWith(target, '_id', node.id);
    exts.Objects.PatchWith(target, '_ref', node.ref);
    exts.Objects.PatchWith(target, '_tid', node.tid);
    exts.Objects.PatchWith(target, '_atid', node.atid);
}
exports.PatchJSONAttributes = PatchJSONAttributes;
function PatchDOMTree(newFragment, oldNodeOrMount, dictator, isChildRecursion) {
    if (isChildRecursion) {
        const rootNode = oldNodeOrMount.parentNode;
        if (!dictator.Same(oldNodeOrMount, newFragment)) {
            dom.replaceNode(rootNode, oldNodeOrMount, newFragment);
            return null;
        }
        if (!oldNodeOrMount.hasChildNodes()) {
            dom.replaceNode(rootNode, oldNodeOrMount, newFragment);
            return null;
        }
    }
    const newChildren = dom.nodeListToArray(newFragment.childNodes);
    const oldChildren = dom.nodeListToArray(oldNodeOrMount.childNodes);
    const oldChildrenLength = oldChildren.length;
    const newChildrenLength = newChildren.length;
    const removeOldLeft = newChildrenLength < oldChildrenLength;
    let lastIndex = 0;
    let lastNode;
    let newChildNode;
    let lastNodeNextSibling = null;
    for (; lastIndex < oldChildrenLength; lastIndex++) {
        if (lastIndex >= newChildrenLength) {
            break;
        }
        lastNode = oldChildren[lastIndex];
        newChildNode = newChildren[lastIndex];
        lastNodeNextSibling = lastNode.nextSibling;
        if ((lastNode.nodeType === dom.TEXT_NODE || lastNode.nodeType === dom.COMMENT_NODE) &&
            newChildNode.nodeType === lastNode.nodeType) {
            if (lastNode.textContent !== newChildNode.textContent) {
                lastNode.textContent = newChildNode.textContent;
            }
            continue;
        }
        if (!dictator.Same(lastNode, newChildNode)) {
            dom.replaceNode(oldNodeOrMount, lastNode, newChildNode);
            continue;
        }
        if (!dictator.Changed(lastNode, newChildNode)) {
            continue;
        }
        if (lastNode.nodeType !== newChildNode.nodeType) {
            dom.replaceNode(oldNodeOrMount, lastNode, newChildNode);
            continue;
        }
        if (!lastNode.hasChildNodes() && newChildNode.hasChildNodes()) {
            dom.replaceNode(oldNodeOrMount, lastNode, newChildNode);
            continue;
        }
        if (lastNode.hasChildNodes() && !newChildNode.hasChildNodes()) {
            dom.replaceNode(oldNodeOrMount, lastNode, newChildNode);
            continue;
        }
        const lastElement = lastNode;
        const newElement = newChildNode;
        PatchDOMAttributes(newElement, lastElement);
        lastElement.setAttribute('_patched', 'true');
        PatchDOMTree(newElement, lastElement, dictator, true);
        lastElement.removeAttribute('_patched');
    }
    if (removeOldLeft && lastNodeNextSibling !== null) {
        dom.removeFromNode(lastNodeNextSibling, null);
        return null;
    }
    for (; lastIndex < newChildrenLength; lastIndex++) {
        let newNode = newChildren[lastIndex];
        if (!exts.Objects.isNullOrUndefined(newNode)) {
            oldNodeOrMount.appendChild(newNode);
        }
    }
}
exports.PatchDOMTree = PatchDOMTree;
function PatchDOMAttributes(newElement, oldElement) {
    const oldNodeAttrs = dom.recordAttributes(oldElement);
    for (let index in newElement.attributes) {
        const attr = newElement.attributes[index];
        const oldValue = oldNodeAttrs[attr.name];
        delete oldNodeAttrs[attr.name];
        if (attr.value === oldValue) {
            continue;
        }
        oldElement.setAttribute(attr.name, attr.value);
    }
    for (let index in oldNodeAttrs) {
        oldElement.removeAttribute(index);
    }
}
exports.PatchDOMAttributes = PatchDOMAttributes;

},{"./dom":8,"./extensions":9,"./utils":13}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEqual = exports.RandomID = exports.truncateArray = exports.createMap = exports.has = exports.Blank = exports.ToKebabCase = void 0;
const hasOwnProperty = Object.prototype.hasOwnProperty;
function ToKebabCase(str) {
    const result = str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match) => '-' + match.toLowerCase());
    return str[0] === str[0].toUpperCase() ? result.substring(1) : result;
}
exports.ToKebabCase = ToKebabCase;
function Blank() { }
exports.Blank = Blank;
Blank.prototype = Object.create(null);
function has(map, property) {
    return hasOwnProperty.call(map, property);
}
exports.has = has;
function createMap() {
    return new Blank();
}
exports.createMap = createMap;
function truncateArray(arr, length) {
    while (arr.length > length) {
        arr.pop();
    }
}
exports.truncateArray = truncateArray;
function RandomID() {
    return Math.random().toString(36).substr(2, 9);
}
exports.RandomID = RandomID;
function isEqual(a, b) {
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);
    if (aProps.length != bProps.length) {
        return false;
    }
    for (let i = 0; i < aProps.length; i++) {
        const propName = aProps[i];
        if (a[propName] !== b[propName]) {
            return false;
        }
    }
    return true;
}
exports.isEqual = isEqual;

},{}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMException = exports.Response = exports.Request = exports.Headers = exports.fetch = void 0;
const fetch = require("whatwg-fetch");
if (!self.fetch) {
    self.fetch = exports.fetch.fetch;
    self.Headers = exports.fetch.Headers;
    self.Request = exports.fetch.Request;
    self.Response = exports.fetch.Response;
    self.DOMException = exports.fetch.DOMException;
}
exports.fetch = self.fetch;
exports.Headers = self.Headers;
exports.Request = self.Request;
exports.Response = self.Response;
exports.DOMException = self.DOMException;

},{"whatwg-fetch":4}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {};

},{}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountTo = void 0;
const fetch = require("./fetch");
const http = require("./http");
const websocket = require("./websocket");
const namespace = Object.assign(Object.assign(Object.assign({}, fetch), http), websocket);
function mountTo(parent) {
    parent.http = namespace;
}
exports.mountTo = mountTo;
exports.default = namespace;

},{"./fetch":14,"./http":15,"./websocket":17}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Socket = exports.OneMinute = exports.OneSecond = void 0;
exports.OneSecond = 1000;
exports.OneMinute = exports.OneSecond * 60;
class Socket {
    constructor(addr, reader, exponent, maxReconnects, maxWait) {
        this.addr = addr;
        this.socket = null;
        this.reader = reader;
        this.maxWait = maxWait;
        this.userClosed = false;
        this.exponent = exponent;
        this.disconnected = false;
        this.attemptedConnects = 0;
        this.lastWait = exports.OneSecond;
        this.maxReconnect = maxReconnects;
        this.writeBuffer = new Array();
    }
    connect() {
        if (this.socket) {
            return;
        }
        if (this.attemptedConnects >= this.maxReconnect) {
            this.reader.Exhausted(this);
            return;
        }
        const socket = new WebSocket(this.addr);
        socket.addEventListener('open', this._opened.bind(this));
        socket.addEventListener('error', this._errored.bind(this));
        socket.addEventListener('message', this._messaged.bind(this));
        socket.addEventListener('close', this._disconnected.bind(this));
        this.socket = socket;
        this.disconnected = false;
    }
    send(message) {
        if (this.disconnected) {
            this.writeBuffer.push(message);
            return;
        }
        this.socket.send(message);
    }
    reset() {
        this.attemptedConnects = 0;
        this.lastWait = exports.OneSecond;
    }
    end() {
        this.userClosed = true;
        this.reader.Closed(this);
        this.socket.close();
        this.socket = null;
    }
    _disconnected(event) {
        this.reader.Disconnected(event, this);
        this.disconnected = true;
        this.socket = null;
        if (this.userClosed) {
            return;
        }
        let nextWait = this.lastWait;
        if (this.exponent) {
            nextWait = this.exponent(nextWait);
            if (nextWait > this.maxWait) {
                nextWait = this.maxWait;
            }
        }
        setTimeout(this.connect.bind(this), nextWait);
        this.attemptedConnects++;
    }
    _opened(event) {
        this.reader.Connected(event, this);
        while (this.writeBuffer.length > 0) {
            const message = this.writeBuffer.shift();
            this.socket.send(message);
        }
    }
    _errored(event) {
        this.reader.Errored(event, this);
    }
    _messaged(event) {
        this.reader.Message(event, this);
    }
}
exports.Socket = Socket;

},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dom = require("../../dom/src");
const animations = require("../../animation/src");
const http = require("../../http/src");
const promises = require("../../promises/src");
const markup = {
    dom,
    animations,
    http,
    promises,
};
if (window) {
    window.markup = markup;
}
exports.default = markup;

},{"../../animation/src":6,"../../dom/src":10,"../../http/src":16,"../../promises/src":19}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mountTo = void 0;
const promise = require("promise-polyfill");
if (!self.Promise) {
    self.Promise = promise;
}
const namespace = self.Promise;
function mountTo(parent) {
    parent.promises = namespace;
}
exports.mountTo = mountTo;
exports.default = namespace;

},{"promise-polyfill":2}]},{},[18])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3Byb21pc2UtcG9seWZpbGwvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3RpbWVycy1icm93c2VyaWZ5L21haW4uanMiLCJub2RlX21vZHVsZXMvd2hhdHdnLWZldGNoL2Rpc3QvZmV0Y2gudW1kLmpzIiwicGFja2FnZXMvbWFya3VwL2xpYi9hbmltYXRpb24vc3JjL2FuaW1lLmpzIiwicGFja2FnZXMvbWFya3VwL2xpYi9hbmltYXRpb24vc3JjL2luZGV4LmpzIiwicGFja2FnZXMvbWFya3VwL2xpYi9hbmltYXRpb24vc3JjL3JhZi1wb2x5ZmlsbC5qcyIsInBhY2thZ2VzL21hcmt1cC9saWIvZG9tL3NyYy9kb20uanMiLCJwYWNrYWdlcy9tYXJrdXAvbGliL2RvbS9zcmMvZXh0ZW5zaW9ucy5qcyIsInBhY2thZ2VzL21hcmt1cC9saWIvZG9tL3NyYy9pbmRleC5qcyIsInBhY2thZ2VzL21hcmt1cC9saWIvZG9tL3NyYy9tb3VudC5qcyIsInBhY2thZ2VzL21hcmt1cC9saWIvZG9tL3NyYy9wYXRjaC5qcyIsInBhY2thZ2VzL21hcmt1cC9saWIvZG9tL3NyYy91dGlscy5qcyIsInBhY2thZ2VzL21hcmt1cC9saWIvaHR0cC9zcmMvZmV0Y2guanMiLCJwYWNrYWdlcy9tYXJrdXAvbGliL2h0dHAvc3JjL2h0dHAuanMiLCJwYWNrYWdlcy9tYXJrdXAvbGliL2h0dHAvc3JjL2luZGV4LmpzIiwicGFja2FnZXMvbWFya3VwL2xpYi9odHRwL3NyYy93ZWJzb2NrZXQuanMiLCJwYWNrYWdlcy9tYXJrdXAvbGliL21hcmt1cC9zcmMvaW5kZXguanMiLCJwYWNrYWdlcy9tYXJrdXAvbGliL3Byb21pc2VzL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ25RQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNW1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwb0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hCQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogQHRoaXMge1Byb21pc2V9XG4gKi9cbmZ1bmN0aW9uIGZpbmFsbHlDb25zdHJ1Y3RvcihjYWxsYmFjaykge1xuICB2YXIgY29uc3RydWN0b3IgPSB0aGlzLmNvbnN0cnVjdG9yO1xuICByZXR1cm4gdGhpcy50aGVuKFxuICAgIGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gY29uc3RydWN0b3IucmVzb2x2ZShjYWxsYmFjaygpKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9KTtcbiAgICB9LFxuICAgIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yLnJlc29sdmUoY2FsbGJhY2soKSkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yLnJlamVjdChyZWFzb24pO1xuICAgICAgfSk7XG4gICAgfVxuICApO1xufVxuXG4vLyBTdG9yZSBzZXRUaW1lb3V0IHJlZmVyZW5jZSBzbyBwcm9taXNlLXBvbHlmaWxsIHdpbGwgYmUgdW5hZmZlY3RlZCBieVxuLy8gb3RoZXIgY29kZSBtb2RpZnlpbmcgc2V0VGltZW91dCAobGlrZSBzaW5vbi51c2VGYWtlVGltZXJzKCkpXG52YXIgc2V0VGltZW91dEZ1bmMgPSBzZXRUaW1lb3V0O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxuLy8gUG9seWZpbGwgZm9yIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kXG5mdW5jdGlvbiBiaW5kKGZuLCB0aGlzQXJnKSB7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICBmbi5hcHBseSh0aGlzQXJnLCBhcmd1bWVudHMpO1xuICB9O1xufVxuXG4vKipcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqL1xuZnVuY3Rpb24gUHJvbWlzZShmbikge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUHJvbWlzZSkpXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUHJvbWlzZXMgbXVzdCBiZSBjb25zdHJ1Y3RlZCB2aWEgbmV3Jyk7XG4gIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHRocm93IG5ldyBUeXBlRXJyb3IoJ25vdCBhIGZ1bmN0aW9uJyk7XG4gIC8qKiBAdHlwZSB7IW51bWJlcn0gKi9cbiAgdGhpcy5fc3RhdGUgPSAwO1xuICAvKiogQHR5cGUgeyFib29sZWFufSAqL1xuICB0aGlzLl9oYW5kbGVkID0gZmFsc2U7XG4gIC8qKiBAdHlwZSB7UHJvbWlzZXx1bmRlZmluZWR9ICovXG4gIHRoaXMuX3ZhbHVlID0gdW5kZWZpbmVkO1xuICAvKiogQHR5cGUgeyFBcnJheTwhRnVuY3Rpb24+fSAqL1xuICB0aGlzLl9kZWZlcnJlZHMgPSBbXTtcblxuICBkb1Jlc29sdmUoZm4sIHRoaXMpO1xufVxuXG5mdW5jdGlvbiBoYW5kbGUoc2VsZiwgZGVmZXJyZWQpIHtcbiAgd2hpbGUgKHNlbGYuX3N0YXRlID09PSAzKSB7XG4gICAgc2VsZiA9IHNlbGYuX3ZhbHVlO1xuICB9XG4gIGlmIChzZWxmLl9zdGF0ZSA9PT0gMCkge1xuICAgIHNlbGYuX2RlZmVycmVkcy5wdXNoKGRlZmVycmVkKTtcbiAgICByZXR1cm47XG4gIH1cbiAgc2VsZi5faGFuZGxlZCA9IHRydWU7XG4gIFByb21pc2UuX2ltbWVkaWF0ZUZuKGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYiA9IHNlbGYuX3N0YXRlID09PSAxID8gZGVmZXJyZWQub25GdWxmaWxsZWQgOiBkZWZlcnJlZC5vblJlamVjdGVkO1xuICAgIGlmIChjYiA9PT0gbnVsbCkge1xuICAgICAgKHNlbGYuX3N0YXRlID09PSAxID8gcmVzb2x2ZSA6IHJlamVjdCkoZGVmZXJyZWQucHJvbWlzZSwgc2VsZi5fdmFsdWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcmV0O1xuICAgIHRyeSB7XG4gICAgICByZXQgPSBjYihzZWxmLl92YWx1ZSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmVqZWN0KGRlZmVycmVkLnByb21pc2UsIGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXNvbHZlKGRlZmVycmVkLnByb21pc2UsIHJldCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlKHNlbGYsIG5ld1ZhbHVlKSB7XG4gIHRyeSB7XG4gICAgLy8gUHJvbWlzZSBSZXNvbHV0aW9uIFByb2NlZHVyZTogaHR0cHM6Ly9naXRodWIuY29tL3Byb21pc2VzLWFwbHVzL3Byb21pc2VzLXNwZWMjdGhlLXByb21pc2UtcmVzb2x1dGlvbi1wcm9jZWR1cmVcbiAgICBpZiAobmV3VmFsdWUgPT09IHNlbGYpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBIHByb21pc2UgY2Fubm90IGJlIHJlc29sdmVkIHdpdGggaXRzZWxmLicpO1xuICAgIGlmIChcbiAgICAgIG5ld1ZhbHVlICYmXG4gICAgICAodHlwZW9mIG5ld1ZhbHVlID09PSAnb2JqZWN0JyB8fCB0eXBlb2YgbmV3VmFsdWUgPT09ICdmdW5jdGlvbicpXG4gICAgKSB7XG4gICAgICB2YXIgdGhlbiA9IG5ld1ZhbHVlLnRoZW47XG4gICAgICBpZiAobmV3VmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHNlbGYuX3N0YXRlID0gMztcbiAgICAgICAgc2VsZi5fdmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgZmluYWxlKHNlbGYpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB0aGVuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGRvUmVzb2x2ZShiaW5kKHRoZW4sIG5ld1ZhbHVlKSwgc2VsZik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgc2VsZi5fc3RhdGUgPSAxO1xuICAgIHNlbGYuX3ZhbHVlID0gbmV3VmFsdWU7XG4gICAgZmluYWxlKHNlbGYpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmVqZWN0KHNlbGYsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlamVjdChzZWxmLCBuZXdWYWx1ZSkge1xuICBzZWxmLl9zdGF0ZSA9IDI7XG4gIHNlbGYuX3ZhbHVlID0gbmV3VmFsdWU7XG4gIGZpbmFsZShzZWxmKTtcbn1cblxuZnVuY3Rpb24gZmluYWxlKHNlbGYpIHtcbiAgaWYgKHNlbGYuX3N0YXRlID09PSAyICYmIHNlbGYuX2RlZmVycmVkcy5sZW5ndGggPT09IDApIHtcbiAgICBQcm9taXNlLl9pbW1lZGlhdGVGbihmdW5jdGlvbigpIHtcbiAgICAgIGlmICghc2VsZi5faGFuZGxlZCkge1xuICAgICAgICBQcm9taXNlLl91bmhhbmRsZWRSZWplY3Rpb25GbihzZWxmLl92YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gc2VsZi5fZGVmZXJyZWRzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaGFuZGxlKHNlbGYsIHNlbGYuX2RlZmVycmVkc1tpXSk7XG4gIH1cbiAgc2VsZi5fZGVmZXJyZWRzID0gbnVsbDtcbn1cblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcHJvbWlzZSkge1xuICB0aGlzLm9uRnVsZmlsbGVkID0gdHlwZW9mIG9uRnVsZmlsbGVkID09PSAnZnVuY3Rpb24nID8gb25GdWxmaWxsZWQgOiBudWxsO1xuICB0aGlzLm9uUmVqZWN0ZWQgPSB0eXBlb2Ygb25SZWplY3RlZCA9PT0gJ2Z1bmN0aW9uJyA/IG9uUmVqZWN0ZWQgOiBudWxsO1xuICB0aGlzLnByb21pc2UgPSBwcm9taXNlO1xufVxuXG4vKipcbiAqIFRha2UgYSBwb3RlbnRpYWxseSBtaXNiZWhhdmluZyByZXNvbHZlciBmdW5jdGlvbiBhbmQgbWFrZSBzdXJlXG4gKiBvbkZ1bGZpbGxlZCBhbmQgb25SZWplY3RlZCBhcmUgb25seSBjYWxsZWQgb25jZS5cbiAqXG4gKiBNYWtlcyBubyBndWFyYW50ZWVzIGFib3V0IGFzeW5jaHJvbnkuXG4gKi9cbmZ1bmN0aW9uIGRvUmVzb2x2ZShmbiwgc2VsZikge1xuICB2YXIgZG9uZSA9IGZhbHNlO1xuICB0cnkge1xuICAgIGZuKFxuICAgICAgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaWYgKGRvbmUpIHJldHVybjtcbiAgICAgICAgZG9uZSA9IHRydWU7XG4gICAgICAgIHJlc29sdmUoc2VsZiwgdmFsdWUpO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKHJlYXNvbikge1xuICAgICAgICBpZiAoZG9uZSkgcmV0dXJuO1xuICAgICAgICBkb25lID0gdHJ1ZTtcbiAgICAgICAgcmVqZWN0KHNlbGYsIHJlYXNvbik7XG4gICAgICB9XG4gICAgKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBpZiAoZG9uZSkgcmV0dXJuO1xuICAgIGRvbmUgPSB0cnVlO1xuICAgIHJlamVjdChzZWxmLCBleCk7XG4gIH1cbn1cblxuUHJvbWlzZS5wcm90b3R5cGVbJ2NhdGNoJ10gPSBmdW5jdGlvbihvblJlamVjdGVkKSB7XG4gIHJldHVybiB0aGlzLnRoZW4obnVsbCwgb25SZWplY3RlZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24ob25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQpIHtcbiAgLy8gQHRzLWlnbm9yZVxuICB2YXIgcHJvbSA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKG5vb3ApO1xuXG4gIGhhbmRsZSh0aGlzLCBuZXcgSGFuZGxlcihvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgcHJvbSkpO1xuICByZXR1cm4gcHJvbTtcbn07XG5cblByb21pc2UucHJvdG90eXBlWydmaW5hbGx5J10gPSBmaW5hbGx5Q29uc3RydWN0b3I7XG5cblByb21pc2UuYWxsID0gZnVuY3Rpb24oYXJyKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAoIWFyciB8fCB0eXBlb2YgYXJyLmxlbmd0aCA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdQcm9taXNlLmFsbCBhY2NlcHRzIGFuIGFycmF5Jyk7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcnIpO1xuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJlc29sdmUoW10pO1xuICAgIHZhciByZW1haW5pbmcgPSBhcmdzLmxlbmd0aDtcblxuICAgIGZ1bmN0aW9uIHJlcyhpLCB2YWwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh2YWwgJiYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnIHx8IHR5cGVvZiB2YWwgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgdmFyIHRoZW4gPSB2YWwudGhlbjtcbiAgICAgICAgICBpZiAodHlwZW9mIHRoZW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHRoZW4uY2FsbChcbiAgICAgICAgICAgICAgdmFsLFxuICAgICAgICAgICAgICBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgICAgICByZXMoaSwgdmFsKTtcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgcmVqZWN0XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBhcmdzW2ldID0gdmFsO1xuICAgICAgICBpZiAoLS1yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICByZXNvbHZlKGFyZ3MpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICByZWplY3QoZXgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuICAgICAgcmVzKGksIGFyZ3NbaV0pO1xuICAgIH1cbiAgfSk7XG59O1xuXG5Qcm9taXNlLnJlc29sdmUgPSBmdW5jdGlvbih2YWx1ZSkge1xuICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgcmVzb2x2ZSh2YWx1ZSk7XG4gIH0pO1xufTtcblxuUHJvbWlzZS5yZWplY3QgPSBmdW5jdGlvbih2YWx1ZSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcmVqZWN0KHZhbHVlKTtcbiAgfSk7XG59O1xuXG5Qcm9taXNlLnJhY2UgPSBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB2YWx1ZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhbHVlc1tpXS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8vIFVzZSBwb2x5ZmlsbCBmb3Igc2V0SW1tZWRpYXRlIGZvciBwZXJmb3JtYW5jZSBnYWluc1xuUHJvbWlzZS5faW1tZWRpYXRlRm4gPVxuICAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJyAmJlxuICAgIGZ1bmN0aW9uKGZuKSB7XG4gICAgICBzZXRJbW1lZGlhdGUoZm4pO1xuICAgIH0pIHx8XG4gIGZ1bmN0aW9uKGZuKSB7XG4gICAgc2V0VGltZW91dEZ1bmMoZm4sIDApO1xuICB9O1xuXG5Qcm9taXNlLl91bmhhbmRsZWRSZWplY3Rpb25GbiA9IGZ1bmN0aW9uIF91bmhhbmRsZWRSZWplY3Rpb25GbihlcnIpIHtcbiAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBjb25zb2xlKSB7XG4gICAgY29uc29sZS53YXJuKCdQb3NzaWJsZSBVbmhhbmRsZWQgUHJvbWlzZSBSZWplY3Rpb246JywgZXJyKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZTtcbiIsInZhciBuZXh0VGljayA9IHJlcXVpcmUoJ3Byb2Nlc3MvYnJvd3Nlci5qcycpLm5leHRUaWNrO1xudmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGltbWVkaWF0ZUlkcyA9IHt9O1xudmFyIG5leHRJbW1lZGlhdGVJZCA9IDA7XG5cbi8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cbmV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFyVGltZW91dCk7XG59O1xuZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRJbnRlcnZhbCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhckludGVydmFsKTtcbn07XG5leHBvcnRzLmNsZWFyVGltZW91dCA9XG5leHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbih0aW1lb3V0KSB7IHRpbWVvdXQuY2xvc2UoKTsgfTtcblxuZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuICB0aGlzLl9pZCA9IGlkO1xuICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcbn1cblRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2NsZWFyRm4uY2FsbCh3aW5kb3csIHRoaXMuX2lkKTtcbn07XG5cbi8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuZXhwb3J0cy5lbnJvbGwgPSBmdW5jdGlvbihpdGVtLCBtc2Vjcykge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG59O1xuXG5leHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gLTE7XG59O1xuXG5leHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cbiAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG4gIGlmIChtc2VjcyA+PSAwKSB7XG4gICAgaXRlbS5faWRsZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gb25UaW1lb3V0KCkge1xuICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcbiAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG4gICAgfSwgbXNlY3MpO1xuICB9XG59O1xuXG4vLyBUaGF0J3Mgbm90IGhvdyBub2RlLmpzIGltcGxlbWVudHMgaXQgYnV0IHRoZSBleHBvc2VkIGFwaSBpcyB0aGUgc2FtZS5cbmV4cG9ydHMuc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gc2V0SW1tZWRpYXRlIDogZnVuY3Rpb24oZm4pIHtcbiAgdmFyIGlkID0gbmV4dEltbWVkaWF0ZUlkKys7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aCA8IDIgPyBmYWxzZSA6IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBpbW1lZGlhdGVJZHNbaWRdID0gdHJ1ZTtcblxuICBuZXh0VGljayhmdW5jdGlvbiBvbk5leHRUaWNrKCkge1xuICAgIGlmIChpbW1lZGlhdGVJZHNbaWRdKSB7XG4gICAgICAvLyBmbi5jYWxsKCkgaXMgZmFzdGVyIHNvIHdlIG9wdGltaXplIGZvciB0aGUgY29tbW9uIHVzZS1jYXNlXG4gICAgICAvLyBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2NhbGwtYXBwbHktc2VndVxuICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbi5jYWxsKG51bGwpO1xuICAgICAgfVxuICAgICAgLy8gUHJldmVudCBpZHMgZnJvbSBsZWFraW5nXG4gICAgICBleHBvcnRzLmNsZWFySW1tZWRpYXRlKGlkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpZDtcbn07XG5cbmV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSB0eXBlb2YgY2xlYXJJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IGNsZWFySW1tZWRpYXRlIDogZnVuY3Rpb24oaWQpIHtcbiAgZGVsZXRlIGltbWVkaWF0ZUlkc1tpZF07XG59OyIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcbiAgKGZhY3RvcnkoKGdsb2JhbC5XSEFUV0dGZXRjaCA9IHt9KSkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gIHZhciBnbG9iYWwgPVxuICAgICh0eXBlb2YgZ2xvYmFsVGhpcyAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsVGhpcykgfHxcbiAgICAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnICYmIHNlbGYpIHx8XG4gICAgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnICYmIGdsb2JhbCk7XG5cbiAgdmFyIHN1cHBvcnQgPSB7XG4gICAgc2VhcmNoUGFyYW1zOiAnVVJMU2VhcmNoUGFyYW1zJyBpbiBnbG9iYWwsXG4gICAgaXRlcmFibGU6ICdTeW1ib2wnIGluIGdsb2JhbCAmJiAnaXRlcmF0b3InIGluIFN5bWJvbCxcbiAgICBibG9iOlxuICAgICAgJ0ZpbGVSZWFkZXInIGluIGdsb2JhbCAmJlxuICAgICAgJ0Jsb2InIGluIGdsb2JhbCAmJlxuICAgICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG5ldyBCbG9iKCk7XG4gICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9KSgpLFxuICAgIGZvcm1EYXRhOiAnRm9ybURhdGEnIGluIGdsb2JhbCxcbiAgICBhcnJheUJ1ZmZlcjogJ0FycmF5QnVmZmVyJyBpbiBnbG9iYWxcbiAgfTtcblxuICBmdW5jdGlvbiBpc0RhdGFWaWV3KG9iaikge1xuICAgIHJldHVybiBvYmogJiYgRGF0YVZpZXcucHJvdG90eXBlLmlzUHJvdG90eXBlT2Yob2JqKVxuICB9XG5cbiAgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIpIHtcbiAgICB2YXIgdmlld0NsYXNzZXMgPSBbXG4gICAgICAnW29iamVjdCBJbnQ4QXJyYXldJyxcbiAgICAgICdbb2JqZWN0IFVpbnQ4QXJyYXldJyxcbiAgICAgICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XScsXG4gICAgICAnW29iamVjdCBJbnQxNkFycmF5XScsXG4gICAgICAnW29iamVjdCBVaW50MTZBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgSW50MzJBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgVWludDMyQXJyYXldJyxcbiAgICAgICdbb2JqZWN0IEZsb2F0MzJBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgRmxvYXQ2NEFycmF5XSdcbiAgICBdO1xuXG4gICAgdmFyIGlzQXJyYXlCdWZmZXJWaWV3ID1cbiAgICAgIEFycmF5QnVmZmVyLmlzVmlldyB8fFxuICAgICAgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgIHJldHVybiBvYmogJiYgdmlld0NsYXNzZXMuaW5kZXhPZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSkgPiAtMVxuICAgICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU5hbWUobmFtZSkge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSk7XG4gICAgfVxuICAgIGlmICgvW15hLXowLTlcXC0jJCUmJyorLl5fYHx+IV0vaS50ZXN0KG5hbWUpIHx8IG5hbWUgPT09ICcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGNoYXJhY3RlciBpbiBoZWFkZXIgZmllbGQgbmFtZScpXG4gICAgfVxuICAgIHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKClcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZVZhbHVlKHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gU3RyaW5nKHZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cblxuICAvLyBCdWlsZCBhIGRlc3RydWN0aXZlIGl0ZXJhdG9yIGZvciB0aGUgdmFsdWUgbGlzdFxuICBmdW5jdGlvbiBpdGVyYXRvckZvcihpdGVtcykge1xuICAgIHZhciBpdGVyYXRvciA9IHtcbiAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmFsdWUgPSBpdGVtcy5zaGlmdCgpO1xuICAgICAgICByZXR1cm4ge2RvbmU6IHZhbHVlID09PSB1bmRlZmluZWQsIHZhbHVlOiB2YWx1ZX1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICAgIGl0ZXJhdG9yW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBpdGVyYXRvclxuICB9XG5cbiAgZnVuY3Rpb24gSGVhZGVycyhoZWFkZXJzKSB7XG4gICAgdGhpcy5tYXAgPSB7fTtcblxuICAgIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIHZhbHVlKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShoZWFkZXJzKSkge1xuICAgICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgICB0aGlzLmFwcGVuZChoZWFkZXJbMF0sIGhlYWRlclsxXSk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9IGVsc2UgaWYgKGhlYWRlcnMpIHtcbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCBoZWFkZXJzW25hbWVdKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSk7XG4gICAgdmFsdWUgPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSk7XG4gICAgdmFyIG9sZFZhbHVlID0gdGhpcy5tYXBbbmFtZV07XG4gICAgdGhpcy5tYXBbbmFtZV0gPSBvbGRWYWx1ZSA/IG9sZFZhbHVlICsgJywgJyArIHZhbHVlIDogdmFsdWU7XG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGVbJ2RlbGV0ZSddID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXTtcbiAgfTtcblxuICBIZWFkZXJzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSk7XG4gICAgcmV0dXJuIHRoaXMuaGFzKG5hbWUpID8gdGhpcy5tYXBbbmFtZV0gOiBudWxsXG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShub3JtYWxpemVOYW1lKG5hbWUpKVxuICB9O1xuXG4gIEhlYWRlcnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV0gPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSk7XG4gIH07XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLm1hcCkge1xuICAgICAgaWYgKHRoaXMubWFwLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdGhpcy5tYXBbbmFtZV0sIG5hbWUsIHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBIZWFkZXJzLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW107XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICBpdGVtcy5wdXNoKG5hbWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfTtcblxuICBIZWFkZXJzLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIGl0ZW1zLnB1c2godmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfTtcblxuICBIZWFkZXJzLnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW107XG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICBpdGVtcy5wdXNoKFtuYW1lLCB2YWx1ZV0pO1xuICAgIH0pO1xuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfTtcblxuICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgIEhlYWRlcnMucHJvdG90eXBlW1N5bWJvbC5pdGVyYXRvcl0gPSBIZWFkZXJzLnByb3RvdHlwZS5lbnRyaWVzO1xuICB9XG5cbiAgZnVuY3Rpb24gY29uc3VtZWQoYm9keSkge1xuICAgIGlmIChib2R5LmJvZHlVc2VkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJykpXG4gICAgfVxuICAgIGJvZHkuYm9keVVzZWQgPSB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KTtcbiAgICAgIH07XG4gICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QocmVhZGVyLmVycm9yKTtcbiAgICAgIH07XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRCbG9iQXNBcnJheUJ1ZmZlcihibG9iKSB7XG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgdmFyIHByb21pc2UgPSBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKTtcbiAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoYmxvYik7XG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRCbG9iQXNUZXh0KGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpO1xuICAgIHJlYWRlci5yZWFkQXNUZXh0KGJsb2IpO1xuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQXJyYXlCdWZmZXJBc1RleHQoYnVmKSB7XG4gICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYpO1xuICAgIHZhciBjaGFycyA9IG5ldyBBcnJheSh2aWV3Lmxlbmd0aCk7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZpZXcubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNoYXJzW2ldID0gU3RyaW5nLmZyb21DaGFyQ29kZSh2aWV3W2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoYXJzLmpvaW4oJycpXG4gIH1cblxuICBmdW5jdGlvbiBidWZmZXJDbG9uZShidWYpIHtcbiAgICBpZiAoYnVmLnNsaWNlKSB7XG4gICAgICByZXR1cm4gYnVmLnNsaWNlKDApXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmLmJ5dGVMZW5ndGgpO1xuICAgICAgdmlldy5zZXQobmV3IFVpbnQ4QXJyYXkoYnVmKSk7XG4gICAgICByZXR1cm4gdmlldy5idWZmZXJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBCb2R5KCkge1xuICAgIHRoaXMuYm9keVVzZWQgPSBmYWxzZTtcblxuICAgIHRoaXMuX2luaXRCb2R5ID0gZnVuY3Rpb24oYm9keSkge1xuICAgICAgLypcbiAgICAgICAgZmV0Y2gtbW9jayB3cmFwcyB0aGUgUmVzcG9uc2Ugb2JqZWN0IGluIGFuIEVTNiBQcm94eSB0b1xuICAgICAgICBwcm92aWRlIHVzZWZ1bCB0ZXN0IGhhcm5lc3MgZmVhdHVyZXMgc3VjaCBhcyBmbHVzaC4gSG93ZXZlciwgb25cbiAgICAgICAgRVM1IGJyb3dzZXJzIHdpdGhvdXQgZmV0Y2ggb3IgUHJveHkgc3VwcG9ydCBwb2xseWZpbGxzIG11c3QgYmUgdXNlZDtcbiAgICAgICAgdGhlIHByb3h5LXBvbGx5ZmlsbCBpcyB1bmFibGUgdG8gcHJveHkgYW4gYXR0cmlidXRlIHVubGVzcyBpdCBleGlzdHNcbiAgICAgICAgb24gdGhlIG9iamVjdCBiZWZvcmUgdGhlIFByb3h5IGlzIGNyZWF0ZWQuIFRoaXMgY2hhbmdlIGVuc3VyZXNcbiAgICAgICAgUmVzcG9uc2UuYm9keVVzZWQgZXhpc3RzIG9uIHRoZSBpbnN0YW5jZSwgd2hpbGUgbWFpbnRhaW5pbmcgdGhlXG4gICAgICAgIHNlbWFudGljIG9mIHNldHRpbmcgUmVxdWVzdC5ib2R5VXNlZCBpbiB0aGUgY29uc3RydWN0b3IgYmVmb3JlXG4gICAgICAgIF9pbml0Qm9keSBpcyBjYWxsZWQuXG4gICAgICAqL1xuICAgICAgdGhpcy5ib2R5VXNlZCA9IHRoaXMuYm9keVVzZWQ7XG4gICAgICB0aGlzLl9ib2R5SW5pdCA9IGJvZHk7XG4gICAgICBpZiAoIWJvZHkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSAnJztcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keTtcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUJsb2IgPSBib2R5O1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmZvcm1EYXRhICYmIEZvcm1EYXRhLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlGb3JtRGF0YSA9IGJvZHk7XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmIFVSTFNlYXJjaFBhcmFtcy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkudG9TdHJpbmcoKTtcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiBzdXBwb3J0LmJsb2IgJiYgaXNEYXRhVmlldyhib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5LmJ1ZmZlcik7XG4gICAgICAgIC8vIElFIDEwLTExIGNhbid0IGhhbmRsZSBhIERhdGFWaWV3IGJvZHkuXG4gICAgICAgIHRoaXMuX2JvZHlJbml0ID0gbmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pO1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIChBcnJheUJ1ZmZlci5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSB8fCBpc0FycmF5QnVmZmVyVmlldyhib2R5KSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYm9keSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJykpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsICd0ZXh0L3BsYWluO2NoYXJzZXQ9VVRGLTgnKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QmxvYiAmJiB0aGlzLl9ib2R5QmxvYi50eXBlKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgdGhpcy5fYm9keUJsb2IudHlwZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04Jyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHN1cHBvcnQuYmxvYikge1xuICAgICAgdGhpcy5ibG9iID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSkpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIGJsb2InKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICAgIHZhciBpc0NvbnN1bWVkID0gY29uc3VtZWQodGhpcyk7XG4gICAgICAgICAgaWYgKGlzQ29uc3VtZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBpc0NvbnN1bWVkXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodGhpcy5fYm9keUFycmF5QnVmZmVyKSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyLmJ1ZmZlci5zbGljZShcbiAgICAgICAgICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIuYnl0ZU9mZnNldCxcbiAgICAgICAgICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIuYnl0ZU9mZnNldCArIHRoaXMuX2JvZHlBcnJheUJ1ZmZlci5ieXRlTGVuZ3RoXG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB0aGlzLmJsb2IoKS50aGVuKHJlYWRCbG9iQXNBcnJheUJ1ZmZlcilcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fYm9keUJsb2IpIHtcbiAgICAgICAgcmV0dXJuIHJlYWRCbG9iQXNUZXh0KHRoaXMuX2JvZHlCbG9iKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWFkQXJyYXlCdWZmZXJBc1RleHQodGhpcy5fYm9keUFycmF5QnVmZmVyKSlcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyB0ZXh0JylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgICB9XG4gICAgfTtcblxuICAgIGlmIChzdXBwb3J0LmZvcm1EYXRhKSB7XG4gICAgICB0aGlzLmZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKGRlY29kZSlcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5qc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihKU09OLnBhcnNlKVxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gIHZhciBtZXRob2RzID0gWydERUxFVEUnLCAnR0VUJywgJ0hFQUQnLCAnT1BUSU9OUycsICdQT1NUJywgJ1BVVCddO1xuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU1ldGhvZChtZXRob2QpIHtcbiAgICB2YXIgdXBjYXNlZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuICAgIHJldHVybiBtZXRob2RzLmluZGV4T2YodXBjYXNlZCkgPiAtMSA/IHVwY2FzZWQgOiBtZXRob2RcbiAgfVxuXG4gIGZ1bmN0aW9uIFJlcXVlc3QoaW5wdXQsIG9wdGlvbnMpIHtcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmVxdWVzdCkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1BsZWFzZSB1c2UgdGhlIFwibmV3XCIgb3BlcmF0b3IsIHRoaXMgRE9NIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uJylcbiAgICB9XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB2YXIgYm9keSA9IG9wdGlvbnMuYm9keTtcblxuICAgIGlmIChpbnB1dCBpbnN0YW5jZW9mIFJlcXVlc3QpIHtcbiAgICAgIGlmIChpbnB1dC5ib2R5VXNlZCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKVxuICAgICAgfVxuICAgICAgdGhpcy51cmwgPSBpbnB1dC51cmw7XG4gICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHM7XG4gICAgICBpZiAoIW9wdGlvbnMuaGVhZGVycykge1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhpbnB1dC5oZWFkZXJzKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWV0aG9kID0gaW5wdXQubWV0aG9kO1xuICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZTtcbiAgICAgIHRoaXMuc2lnbmFsID0gaW5wdXQuc2lnbmFsO1xuICAgICAgaWYgKCFib2R5ICYmIGlucHV0Ll9ib2R5SW5pdCAhPSBudWxsKSB7XG4gICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXQ7XG4gICAgICAgIGlucHV0LmJvZHlVc2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51cmwgPSBTdHJpbmcoaW5wdXQpO1xuICAgIH1cblxuICAgIHRoaXMuY3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzIHx8IHRoaXMuY3JlZGVudGlhbHMgfHwgJ3NhbWUtb3JpZ2luJztcbiAgICBpZiAob3B0aW9ucy5oZWFkZXJzIHx8ICF0aGlzLmhlYWRlcnMpIHtcbiAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycyk7XG4gICAgfVxuICAgIHRoaXMubWV0aG9kID0gbm9ybWFsaXplTWV0aG9kKG9wdGlvbnMubWV0aG9kIHx8IHRoaXMubWV0aG9kIHx8ICdHRVQnKTtcbiAgICB0aGlzLm1vZGUgPSBvcHRpb25zLm1vZGUgfHwgdGhpcy5tb2RlIHx8IG51bGw7XG4gICAgdGhpcy5zaWduYWwgPSBvcHRpb25zLnNpZ25hbCB8fCB0aGlzLnNpZ25hbDtcbiAgICB0aGlzLnJlZmVycmVyID0gbnVsbDtcblxuICAgIGlmICgodGhpcy5tZXRob2QgPT09ICdHRVQnIHx8IHRoaXMubWV0aG9kID09PSAnSEVBRCcpICYmIGJvZHkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0JvZHkgbm90IGFsbG93ZWQgZm9yIEdFVCBvciBIRUFEIHJlcXVlc3RzJylcbiAgICB9XG4gICAgdGhpcy5faW5pdEJvZHkoYm9keSk7XG5cbiAgICBpZiAodGhpcy5tZXRob2QgPT09ICdHRVQnIHx8IHRoaXMubWV0aG9kID09PSAnSEVBRCcpIHtcbiAgICAgIGlmIChvcHRpb25zLmNhY2hlID09PSAnbm8tc3RvcmUnIHx8IG9wdGlvbnMuY2FjaGUgPT09ICduby1jYWNoZScpIHtcbiAgICAgICAgLy8gU2VhcmNoIGZvciBhICdfJyBwYXJhbWV0ZXIgaW4gdGhlIHF1ZXJ5IHN0cmluZ1xuICAgICAgICB2YXIgcmVQYXJhbVNlYXJjaCA9IC8oWz8mXSlfPVteJl0qLztcbiAgICAgICAgaWYgKHJlUGFyYW1TZWFyY2gudGVzdCh0aGlzLnVybCkpIHtcbiAgICAgICAgICAvLyBJZiBpdCBhbHJlYWR5IGV4aXN0cyB0aGVuIHNldCB0aGUgdmFsdWUgd2l0aCB0aGUgY3VycmVudCB0aW1lXG4gICAgICAgICAgdGhpcy51cmwgPSB0aGlzLnVybC5yZXBsYWNlKHJlUGFyYW1TZWFyY2gsICckMV89JyArIG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBPdGhlcndpc2UgYWRkIGEgbmV3ICdfJyBwYXJhbWV0ZXIgdG8gdGhlIGVuZCB3aXRoIHRoZSBjdXJyZW50IHRpbWVcbiAgICAgICAgICB2YXIgcmVRdWVyeVN0cmluZyA9IC9cXD8vO1xuICAgICAgICAgIHRoaXMudXJsICs9IChyZVF1ZXJ5U3RyaW5nLnRlc3QodGhpcy51cmwpID8gJyYnIDogJz8nKSArICdfPScgKyBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIFJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMsIHtib2R5OiB0aGlzLl9ib2R5SW5pdH0pXG4gIH07XG5cbiAgZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgIGJvZHlcbiAgICAgIC50cmltKClcbiAgICAgIC5zcGxpdCgnJicpXG4gICAgICAuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgICBpZiAoYnl0ZXMpIHtcbiAgICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdCgnPScpO1xuICAgICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgJyAnKTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc9JykucmVwbGFjZSgvXFwrL2csICcgJyk7XG4gICAgICAgICAgZm9ybS5hcHBlbmQoZGVjb2RlVVJJQ29tcG9uZW50KG5hbWUpLCBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgcmV0dXJuIGZvcm1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlSGVhZGVycyhyYXdIZWFkZXJzKSB7XG4gICAgdmFyIGhlYWRlcnMgPSBuZXcgSGVhZGVycygpO1xuICAgIC8vIFJlcGxhY2UgaW5zdGFuY2VzIG9mIFxcclxcbiBhbmQgXFxuIGZvbGxvd2VkIGJ5IGF0IGxlYXN0IG9uZSBzcGFjZSBvciBob3Jpem9udGFsIHRhYiB3aXRoIGEgc3BhY2VcbiAgICAvLyBodHRwczovL3Rvb2xzLmlldGYub3JnL2h0bWwvcmZjNzIzMCNzZWN0aW9uLTMuMlxuICAgIHZhciBwcmVQcm9jZXNzZWRIZWFkZXJzID0gcmF3SGVhZGVycy5yZXBsYWNlKC9cXHI/XFxuW1xcdCBdKy9nLCAnICcpO1xuICAgIC8vIEF2b2lkaW5nIHNwbGl0IHZpYSByZWdleCB0byB3b3JrIGFyb3VuZCBhIGNvbW1vbiBJRTExIGJ1ZyB3aXRoIHRoZSBjb3JlLWpzIDMuNi4wIHJlZ2V4IHBvbHlmaWxsXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2dpdGh1Yi9mZXRjaC9pc3N1ZXMvNzQ4XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3psb2lyb2NrL2NvcmUtanMvaXNzdWVzLzc1MVxuICAgIHByZVByb2Nlc3NlZEhlYWRlcnNcbiAgICAgIC5zcGxpdCgnXFxyJylcbiAgICAgIC5tYXAoZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICAgIHJldHVybiBoZWFkZXIuaW5kZXhPZignXFxuJykgPT09IDAgPyBoZWFkZXIuc3Vic3RyKDEsIGhlYWRlci5sZW5ndGgpIDogaGVhZGVyXG4gICAgICB9KVxuICAgICAgLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgICAgICB2YXIgcGFydHMgPSBsaW5lLnNwbGl0KCc6Jyk7XG4gICAgICAgIHZhciBrZXkgPSBwYXJ0cy5zaGlmdCgpLnRyaW0oKTtcbiAgICAgICAgaWYgKGtleSkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcnRzLmpvaW4oJzonKS50cmltKCk7XG4gICAgICAgICAgaGVhZGVycy5hcHBlbmQoa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHJldHVybiBoZWFkZXJzXG4gIH1cblxuICBCb2R5LmNhbGwoUmVxdWVzdC5wcm90b3R5cGUpO1xuXG4gIGZ1bmN0aW9uIFJlc3BvbnNlKGJvZHlJbml0LCBvcHRpb25zKSB7XG4gICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJlc3BvbnNlKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignUGxlYXNlIHVzZSB0aGUgXCJuZXdcIiBvcGVyYXRvciwgdGhpcyBET00gb2JqZWN0IGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBjYWxsZWQgYXMgYSBmdW5jdGlvbi4nKVxuICAgIH1cbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnZGVmYXVsdCc7XG4gICAgdGhpcy5zdGF0dXMgPSBvcHRpb25zLnN0YXR1cyA9PT0gdW5kZWZpbmVkID8gMjAwIDogb3B0aW9ucy5zdGF0dXM7XG4gICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMDtcbiAgICB0aGlzLnN0YXR1c1RleHQgPSAnc3RhdHVzVGV4dCcgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzVGV4dCA6ICcnO1xuICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycyk7XG4gICAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCAnJztcbiAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdCk7XG4gIH1cblxuICBCb2R5LmNhbGwoUmVzcG9uc2UucHJvdG90eXBlKTtcblxuICBSZXNwb25zZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHRoaXMuX2JvZHlJbml0LCB7XG4gICAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgICAgc3RhdHVzVGV4dDogdGhpcy5zdGF0dXNUZXh0LFxuICAgICAgaGVhZGVyczogbmV3IEhlYWRlcnModGhpcy5oZWFkZXJzKSxcbiAgICAgIHVybDogdGhpcy51cmxcbiAgICB9KVxuICB9O1xuXG4gIFJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IDAsIHN0YXR1c1RleHQ6ICcnfSk7XG4gICAgcmVzcG9uc2UudHlwZSA9ICdlcnJvcic7XG4gICAgcmV0dXJuIHJlc3BvbnNlXG4gIH07XG5cbiAgdmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdO1xuXG4gIFJlc3BvbnNlLnJlZGlyZWN0ID0gZnVuY3Rpb24odXJsLCBzdGF0dXMpIHtcbiAgICBpZiAocmVkaXJlY3RTdGF0dXNlcy5pbmRleE9mKHN0YXR1cykgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW52YWxpZCBzdGF0dXMgY29kZScpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7c3RhdHVzOiBzdGF0dXMsIGhlYWRlcnM6IHtsb2NhdGlvbjogdXJsfX0pXG4gIH07XG5cbiAgZXhwb3J0cy5ET01FeGNlcHRpb24gPSBnbG9iYWwuRE9NRXhjZXB0aW9uO1xuICB0cnkge1xuICAgIG5ldyBleHBvcnRzLkRPTUV4Y2VwdGlvbigpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBleHBvcnRzLkRPTUV4Y2VwdGlvbiA9IGZ1bmN0aW9uKG1lc3NhZ2UsIG5hbWUpIHtcbiAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgdmFyIGVycm9yID0gRXJyb3IobWVzc2FnZSk7XG4gICAgICB0aGlzLnN0YWNrID0gZXJyb3Iuc3RhY2s7XG4gICAgfTtcbiAgICBleHBvcnRzLkRPTUV4Y2VwdGlvbi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKEVycm9yLnByb3RvdHlwZSk7XG4gICAgZXhwb3J0cy5ET01FeGNlcHRpb24ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gZXhwb3J0cy5ET01FeGNlcHRpb247XG4gIH1cblxuICBmdW5jdGlvbiBmZXRjaChpbnB1dCwgaW5pdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpO1xuXG4gICAgICBpZiAocmVxdWVzdC5zaWduYWwgJiYgcmVxdWVzdC5zaWduYWwuYWJvcnRlZCkge1xuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBleHBvcnRzLkRPTUV4Y2VwdGlvbignQWJvcnRlZCcsICdBYm9ydEVycm9yJykpXG4gICAgICB9XG5cbiAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgZnVuY3Rpb24gYWJvcnRYaHIoKSB7XG4gICAgICAgIHhoci5hYm9ydCgpO1xuICAgICAgfVxuXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgIHN0YXR1czogeGhyLnN0YXR1cyxcbiAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBwYXJzZUhlYWRlcnMoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpIHx8ICcnKVxuICAgICAgICB9O1xuICAgICAgICBvcHRpb25zLnVybCA9ICdyZXNwb25zZVVSTCcgaW4geGhyID8geGhyLnJlc3BvbnNlVVJMIDogb3B0aW9ucy5oZWFkZXJzLmdldCgnWC1SZXF1ZXN0LVVSTCcpO1xuICAgICAgICB2YXIgYm9keSA9ICdyZXNwb25zZScgaW4geGhyID8geGhyLnJlc3BvbnNlIDogeGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9O1xuXG4gICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfTtcblxuICAgICAgeGhyLm9uYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICByZWplY3QobmV3IGV4cG9ydHMuRE9NRXhjZXB0aW9uKCdBYm9ydGVkJywgJ0Fib3J0RXJyb3InKSk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gZml4VXJsKHVybCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiB1cmwgPT09ICcnICYmIGdsb2JhbC5sb2NhdGlvbi5ocmVmID8gZ2xvYmFsLmxvY2F0aW9uLmhyZWYgOiB1cmxcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHJldHVybiB1cmxcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgZml4VXJsKHJlcXVlc3QudXJsKSwgdHJ1ZSk7XG5cbiAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSAnaW5jbHVkZScpIHtcbiAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09ICdvbWl0Jykge1xuICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICgncmVzcG9uc2VUeXBlJyBpbiB4aHIpIHtcbiAgICAgICAgaWYgKHN1cHBvcnQuYmxvYikge1xuICAgICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYmxvYic7XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgc3VwcG9ydC5hcnJheUJ1ZmZlciAmJlxuICAgICAgICAgIHJlcXVlc3QuaGVhZGVycy5nZXQoJ0NvbnRlbnQtVHlwZScpICYmXG4gICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLmdldCgnQ29udGVudC1UeXBlJykuaW5kZXhPZignYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJykgIT09IC0xXG4gICAgICAgICkge1xuICAgICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpbml0ICYmIHR5cGVvZiBpbml0LmhlYWRlcnMgPT09ICdvYmplY3QnICYmICEoaW5pdC5oZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykpIHtcbiAgICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoaW5pdC5oZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCBub3JtYWxpemVWYWx1ZShpbml0LmhlYWRlcnNbbmFtZV0pKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXF1ZXN0LmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXF1ZXN0LnNpZ25hbCkge1xuICAgICAgICByZXF1ZXN0LnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKCdhYm9ydCcsIGFib3J0WGhyKTtcblxuICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgLy8gRE9ORSAoc3VjY2VzcyBvciBmYWlsdXJlKVxuICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgICAgcmVxdWVzdC5zaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBhYm9ydFhocik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICB4aHIuc2VuZCh0eXBlb2YgcmVxdWVzdC5fYm9keUluaXQgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0KTtcbiAgICB9KVxuICB9XG5cbiAgZmV0Y2gucG9seWZpbGwgPSB0cnVlO1xuXG4gIGlmICghZ2xvYmFsLmZldGNoKSB7XG4gICAgZ2xvYmFsLmZldGNoID0gZmV0Y2g7XG4gICAgZ2xvYmFsLkhlYWRlcnMgPSBIZWFkZXJzO1xuICAgIGdsb2JhbC5SZXF1ZXN0ID0gUmVxdWVzdDtcbiAgICBnbG9iYWwuUmVzcG9uc2UgPSBSZXNwb25zZTtcbiAgfVxuXG4gIGV4cG9ydHMuSGVhZGVycyA9IEhlYWRlcnM7XG4gIGV4cG9ydHMuUmVxdWVzdCA9IFJlcXVlc3Q7XG4gIGV4cG9ydHMuUmVzcG9uc2UgPSBSZXNwb25zZTtcbiAgZXhwb3J0cy5mZXRjaCA9IGZldGNoO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuQUZyYW1lID0gZXhwb3J0cy5BbmltYXRpb25RdWV1ZSA9IHZvaWQgMDtcbmNvbnN0IHJhZlBvbHlmaWxsID0gcmVxdWlyZShcIi4vcmFmLXBvbHlmaWxsXCIpO1xuY2xhc3MgQW5pbWF0aW9uUXVldWUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnNraXAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5iaW5kZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5yZXF1ZXN0QW5pbWF0aW9uSUQgPSAtMTtcbiAgICAgICAgdGhpcy5mcmFtZXMgPSBuZXcgQXJyYXkoKTtcbiAgICAgICAgdGhpcy5iaW5kQ3ljbGUgPSB0aGlzLmN5Y2xlLmJpbmQodGhpcyk7XG4gICAgICAgIHRoaXMucmFmUHJvdmlkZXIgPSByYWZQb2x5ZmlsbC5HZXRSQUYoKTtcbiAgICB9XG4gICAgbmV3KCkge1xuICAgICAgICBjb25zdCBuZXdGcmFtZSA9IG5ldyBBRnJhbWUodGhpcy5mcmFtZXMubGVuZ3RoLCB0aGlzKTtcbiAgICAgICAgdGhpcy5mcmFtZXMucHVzaChuZXdGcmFtZSk7XG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgICAgICByZXR1cm4gbmV3RnJhbWU7XG4gICAgfVxuICAgIGFkZChmKSB7XG4gICAgICAgIGYucXVldWVJbmRleCA9IHRoaXMuZnJhbWVzLmxlbmd0aDtcbiAgICAgICAgZi5xdWV1ZSA9IHRoaXM7XG4gICAgICAgIHRoaXMuZnJhbWVzLnB1c2goZik7XG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cbiAgICByZXN1bWUoKSB7XG4gICAgICAgIHRoaXMuc2tpcCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG4gICAgcGF1c2UoKSB7XG4gICAgICAgIHRoaXMuc2tpcCA9IHRydWU7XG4gICAgfVxuICAgIHVuYmluZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLmJpbmRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yYWZQcm92aWRlci5jYW5jZWxBbmltYXRpb25GcmFtZSh0aGlzLnJlcXVlc3RBbmltYXRpb25JRCk7XG4gICAgfVxuICAgIGJpbmQoKSB7XG4gICAgICAgIGlmICh0aGlzLmJpbmRlZClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB0aGlzLnJlcXVlc3RBbmltYXRpb25JRCA9IHRoaXMucmFmUHJvdmlkZXIucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuYmluZEN5Y2xlLCBudWxsKTtcbiAgICAgICAgdGhpcy5iaW5kZWQgPSB0cnVlO1xuICAgIH1cbiAgICBjeWNsZShtcykge1xuICAgICAgICBpZiAodGhpcy5mcmFtZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZnJhbWVzLmZvckVhY2goZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgICAgIGlmICghZi5wYXVzZWQoKSkge1xuICAgICAgICAgICAgICAgIGYuYW5pbWF0ZShtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG59XG5leHBvcnRzLkFuaW1hdGlvblF1ZXVlID0gQW5pbWF0aW9uUXVldWU7XG5jbGFzcyBBRnJhbWUge1xuICAgIGNvbnN0cnVjdG9yKGluZGV4LCBxdWV1ZSkge1xuICAgICAgICB0aGlzLnNraXAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5xdWV1ZSA9IHF1ZXVlO1xuICAgICAgICB0aGlzLnF1ZXVlSW5kZXggPSBpbmRleDtcbiAgICAgICAgdGhpcy5jYWxsYmFja3MgPSBuZXcgQXJyYXkoKTtcbiAgICB9XG4gICAgYWRkKGNhbGxiYWNrKSB7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICAgIH1cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5jYWxsYmFja3MubGVuZ3RoID0gMDtcbiAgICB9XG4gICAgcGF1c2VkKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5za2lwO1xuICAgIH1cbiAgICBwYXVzZSgpIHtcbiAgICAgICAgdGhpcy5za2lwID0gdHJ1ZTtcbiAgICB9XG4gICAgc3RvcCgpIHtcbiAgICAgICAgdGhpcy5wYXVzZSgpO1xuICAgICAgICBpZiAodGhpcy5xdWV1ZUluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucXVldWUuZnJhbWVzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICB0aGlzLnF1ZXVlID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgdGhpcy5xdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0b3RhbCA9IHRoaXMucXVldWUuZnJhbWVzLmxlbmd0aDtcbiAgICAgICAgaWYgKHRvdGFsID09IDEpIHtcbiAgICAgICAgICAgIHRoaXMucXVldWUuZnJhbWVzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5xdWV1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIHRoaXMucXVldWVJbmRleCA9IC0xO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5xdWV1ZS5mcmFtZXNbdGhpcy5xdWV1ZUluZGV4XSA9IHRoaXMucXVldWUuZnJhbWVzW3RvdGFsIC0gMV07XG4gICAgICAgIHRoaXMucXVldWUuZnJhbWVzLmxlbmd0aCA9IHRvdGFsIC0gMTtcbiAgICAgICAgdGhpcy5xdWV1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5xdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGFuaW1hdGUodHMpIHtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggaW4gdGhpcy5jYWxsYmFja3MpIHtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gdGhpcy5jYWxsYmFja3NbaW5kZXhdO1xuICAgICAgICAgICAgY2FsbGJhY2sodHMpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5BRnJhbWUgPSBBRnJhbWU7XG5jbGFzcyBDaGFuZ2VNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcihxdWV1ZSkge1xuICAgICAgICB0aGlzLnJlYWRzID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMud3JpdGVzID0gbmV3IEFycmF5KCk7XG4gICAgICAgIHRoaXMucmVhZFN0YXRlID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaW5SZWFkQ2FsbCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmluV3JpdGVDYWxsID0gZmFsc2U7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZnJhbWUgPSBxdWV1ZS5uZXcoKTtcbiAgICB9XG4gICAgc3RhdGljIGRyYWluVGFza3MocSwgd3JhcHBlcikge1xuICAgICAgICBsZXQgdGFzayA9IHEuc2hpZnQoKTtcbiAgICAgICAgd2hpbGUgKHRhc2spIHtcbiAgICAgICAgICAgIGlmICh3cmFwcGVyICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgd3JhcHBlcih0YXNrKTtcbiAgICAgICAgICAgICAgICB0YXNrID0gcS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGFzaygpO1xuICAgICAgICAgICAgdGFzayA9IHEuc2hpZnQoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBtdXRhdGUoZm4pIHtcbiAgICAgICAgdGhpcy53cml0ZXMucHVzaChmbik7XG4gICAgICAgIHRoaXMuX3NjaGVkdWxlKCk7XG4gICAgfVxuICAgIHJlYWQoZm4pIHtcbiAgICAgICAgdGhpcy5yZWFkcy5wdXNoKGZuKTtcbiAgICAgICAgdGhpcy5fc2NoZWR1bGUoKTtcbiAgICB9XG4gICAgX3NjaGVkdWxlKCkge1xuICAgICAgICBpZiAodGhpcy5zY2hlZHVsZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjaGVkdWxlZCA9IHRydWU7XG4gICAgICAgIHRoaXMuZnJhbWUuYWRkKHRoaXMuX3J1blRhc2tzLmJpbmQodGhpcykpO1xuICAgIH1cbiAgICBfcnVuVGFza3MoKSB7XG4gICAgICAgIGNvbnN0IHJlYWRFcnJvciA9IHRoaXMuX3J1blJlYWRzKCk7XG4gICAgICAgIGlmIChyZWFkRXJyb3IgIT09IG51bGwgJiYgcmVhZEVycm9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMuc2NoZWR1bGVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLl9zY2hlZHVsZSgpO1xuICAgICAgICAgICAgdGhyb3cgcmVhZEVycm9yO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHdyaXRlRXJyb3IgPSB0aGlzLl9ydW5Xcml0ZXMoKTtcbiAgICAgICAgaWYgKHdyaXRlRXJyb3IgIT09IG51bGwgJiYgd3JpdGVFcnJvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnNjaGVkdWxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fc2NoZWR1bGUoKTtcbiAgICAgICAgICAgIHRocm93IHdyaXRlRXJyb3I7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucmVhZHMubGVuZ3RoID4gMCB8fCB0aGlzLndyaXRlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnNjaGVkdWxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5fc2NoZWR1bGUoKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnNjaGVkdWxlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBfcnVuUmVhZHMoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBDaGFuZ2VNYW5hZ2VyLmRyYWluVGFza3ModGhpcy5yZWFkcywgdGhpcy5fZXhlY1JlYWRzLmJpbmQodGhpcykpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgX2V4ZWNSZWFkcyh0YXNrKSB7XG4gICAgICAgIHRoaXMuaW5SZWFkQ2FsbCA9IHRydWU7XG4gICAgICAgIHRhc2soKTtcbiAgICAgICAgdGhpcy5pblJlYWRDYWxsID0gZmFsc2U7XG4gICAgfVxuICAgIF9ydW5Xcml0ZXMoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBDaGFuZ2VNYW5hZ2VyLmRyYWluVGFza3ModGhpcy53cml0ZXMsIHRoaXMuX2V4ZWNXcml0ZS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIF9leGVjV3JpdGUodGFzaykge1xuICAgICAgICB0aGlzLmluV3JpdGVDYWxsID0gdHJ1ZTtcbiAgICAgICAgdGFzaygpO1xuICAgICAgICB0aGlzLmluV3JpdGVDYWxsID0gZmFsc2U7XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YW5pbWUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLm1vdW50VG8gPSB2b2lkIDA7XG5jb25zdCByYWZQb2x5ZmlsbCA9IHJlcXVpcmUoXCIuL3JhZi1wb2x5ZmlsbFwiKTtcbmNvbnN0IEFuaW1hdGlvbiA9IHJlcXVpcmUoXCIuL2FuaW1lXCIpO1xuY29uc3QgbmFtZXNwYWNlID0gT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCByYWZQb2x5ZmlsbCksIEFuaW1hdGlvbik7XG5mdW5jdGlvbiBtb3VudFRvKHBhcmVudCkge1xuICAgIHBhcmVudC5hbmltYXRpb25zID0gbmFtZXNwYWNlO1xufVxuZXhwb3J0cy5tb3VudFRvID0gbW91bnRUbztcbmV4cG9ydHMuZGVmYXVsdCA9IG5hbWVzcGFjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5HZXRSQUYgPSB2b2lkIDA7XG5jb25zdCBub3cgPSAoZnVuY3Rpb24gKCkge1xuICAgIGlmIChzZWxmLmhhc093blByb3BlcnR5KCdwZXJmb3JtYW5jZScpKSB7XG4gICAgICAgIHJldHVybiAoKHBlcmZvcm1hbmNlLm5vdyA/IHBlcmZvcm1hbmNlLm5vdy5iaW5kKHBlcmZvcm1hbmNlKSA6IG51bGwpIHx8XG4gICAgICAgICAgICAocGVyZm9ybWFuY2UubW96Tm93ID8gcGVyZm9ybWFuY2UubW96Tm93LmJpbmQocGVyZm9ybWFuY2UpIDogbnVsbCkgfHxcbiAgICAgICAgICAgIChwZXJmb3JtYW5jZS5tc05vdyA/IHBlcmZvcm1hbmNlLm1zTm93LmJpbmQocGVyZm9ybWFuY2UpIDogbnVsbCkgfHxcbiAgICAgICAgICAgIChwZXJmb3JtYW5jZS5vTm93ID8gcGVyZm9ybWFuY2Uub05vdy5iaW5kKHBlcmZvcm1hbmNlKSA6IG51bGwpIHx8XG4gICAgICAgICAgICAocGVyZm9ybWFuY2Uud2Via2l0Tm93ID8gcGVyZm9ybWFuY2Uud2Via2l0Tm93LmJpbmQocGVyZm9ybWFuY2UpIDogbnVsbCkgfHxcbiAgICAgICAgICAgIERhdGUubm93LmJpbmQoRGF0ZSkpO1xuICAgIH1cbiAgICByZXR1cm4gRGF0ZS5ub3cuYmluZChEYXRlKTtcbn0pKCk7XG5jb25zdCBmcmFtZVJhdGUgPSAxMDAwIC8gNjA7XG5jb25zdCB2ZW5kb3JzID0gWydtcycsICdtb3onLCAnd2Via2l0JywgJ28nXTtcbmZ1bmN0aW9uIEdldFJBRigpIHtcbiAgICBsZXQgbGFzdFRpbWUgPSAwO1xuICAgIGNvbnN0IG1vZCA9IHt9O1xuICAgIGZvciAodmFyIHggPSAwOyB4IDwgdmVuZG9ycy5sZW5ndGggJiYgIXdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU7ICsreCkge1xuICAgICAgICBtb2QucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbeF0gKyAnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XG4gICAgICAgIG1vZC5jYW5jZWxBbmltYXRpb25GcmFtZSA9XG4gICAgICAgICAgICB3aW5kb3dbdmVuZG9yc1t4XSArICdDYW5jZWxBbmltYXRpb25GcmFtZSddIHx8IHdpbmRvd1t2ZW5kb3JzW3hdICsgJ1JlcXVlc3RDYW5jZWxBbmltYXRpb25GcmFtZSddO1xuICAgIH1cbiAgICBpZiAoIW1vZC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIW1vZC5jYW5jZWxBbmltYXRpb25GcmFtZSlcbiAgICAgICAgbW9kLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgZWxlbWVudCkge1xuICAgICAgICAgICAgY29uc3QgY3VyclRpbWUgPSBub3coKTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCBmcmFtZVJhdGUgLSAoY3VyclRpbWUgLSBsYXN0VGltZSkpO1xuICAgICAgICAgICAgY29uc3QgaWQgPSBzZWxmLnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGN1cnJUaW1lICsgdGltZVRvQ2FsbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvcjogJywgZSk7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdGltZVRvQ2FsbCk7XG4gICAgICAgICAgICBsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcbiAgICAgICAgICAgIHJldHVybiBpZDtcbiAgICAgICAgfTtcbiAgICBpZiAoIW1vZC5jYW5jZWxBbmltYXRpb25GcmFtZSkge1xuICAgICAgICBtb2QuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChpZCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBtb2Q7XG59XG5leHBvcnRzLkdldFJBRiA9IEdldFJBRjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXJhZi1wb2x5ZmlsbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZ2V0TWF0Y2hpbmdOb2RlID0gZXhwb3J0cy50b0RhdGFUcmFuc2ZlciA9IGV4cG9ydHMudG9HYW1lcGFkID0gZXhwb3J0cy50b1RvdWNoZXMgPSBleHBvcnRzLnRvTWVkaWFTdHJlYW0gPSBleHBvcnRzLnRvUm90YXRpb25EYXRhID0gZXhwb3J0cy50b01vdGlvbkRhdGEgPSBleHBvcnRzLnRvSW5wdXRTb3VyY2VDYXBhYmlsaXR5ID0gZXhwb3J0cy5mcm9tRmlsZSA9IGV4cG9ydHMuZnJvbUJsb2IgPSBleHBvcnRzLnJlbW92ZUZyb21Ob2RlID0gZXhwb3J0cy5jcmVhdGVUZXh0ID0gZXhwb3J0cy5jcmVhdGVFbGVtZW50ID0gZXhwb3J0cy5yZWNvcmRBdHRyaWJ1dGVzID0gZXhwb3J0cy5nZXROYW1lc3BhY2VGb3JUYWcgPSBleHBvcnRzLmFwcGx5QXR0cmlidXRlVHlwZWQgPSBleHBvcnRzLmFwcGx5U1ZHU3R5bGVzID0gZXhwb3J0cy5hcHBseVN0eWxlcyA9IGV4cG9ydHMuYXBwbHlTdHlsZSA9IGV4cG9ydHMuYXBwbHlTVkdTdHlsZSA9IGV4cG9ydHMuc2V0U3R5bGVWYWx1ZSA9IGV4cG9ydHMuYXBwbHlQcm9wID0gZXhwb3J0cy5hcHBseUF0dHJzID0gZXhwb3J0cy5hcHBseUF0dHIgPSBleHBvcnRzLmdldE5hbWVzcGFjZSA9IGV4cG9ydHMucmVwbGFjZU5vZGVJZiA9IGV4cG9ydHMucmVwbGFjZU5vZGUgPSBleHBvcnRzLmluc2VydEJlZm9yZSA9IGV4cG9ydHMubW92ZUJlZm9yZSA9IGV4cG9ydHMuZ2V0Rm9jdXNlZFBhdGggPSBleHBvcnRzLmdldEFjdGl2ZUVsZW1lbnQgPSBleHBvcnRzLmNvbGxlY3RCcmVhZHRoRmlyc3QgPSBleHBvcnRzLnRvSFRNTCA9IGV4cG9ydHMuZWFjaE5vZGVBbmRDaGlsZCA9IGV4cG9ydHMubm9kZUxpc3RUb0FycmF5ID0gZXhwb3J0cy5lYWNoQ2hpbGRBbmROb2RlID0gZXhwb3J0cy5yZXZlcnNlQXBwbHlFYWNoTm9kZSA9IGV4cG9ydHMuYXBwbHlFYWNoTm9kZSA9IGV4cG9ydHMuYXBwbHlFYWNoQ2hpbGROb2RlID0gZXhwb3J0cy5hcHBseUNoaWxkTm9kZSA9IGV4cG9ydHMuZmluZEJyZWFkdGhGaXJzdCA9IGV4cG9ydHMuY29sbGVjdERlcHRoRmlyc3QgPSBleHBvcnRzLmZpbmREZXB0aEZpcnN0ID0gZXhwb3J0cy5maW5kTm9kZVdpdGhEZXB0aCA9IGV4cG9ydHMuZmluZE5vZGVXaXRoQnJlYWR0aCA9IGV4cG9ydHMuY29sbGVjdE5vZGVXaXRoRGVwdGggPSBleHBvcnRzLmNvbGxlY3ROb2RlV2l0aEJyZWFkdGggPSBleHBvcnRzLnJldmVyc2VGaW5kTm9kZVdpdGhCcmVhZHRoID0gZXhwb3J0cy5yZXZlcnNlQ29sbGVjdE5vZGVXaXRoQnJlYWR0aCA9IGV4cG9ydHMuZ2V0QW5jZXN0cnkgPSBleHBvcnRzLmlzVGV4dCA9IGV4cG9ydHMuaXNFbGVtZW50ID0gZXhwb3J0cy5pc0RvY3VtZW50Um9vdCA9IGV4cG9ydHMuQ09NTUVOVF9OT0RFID0gZXhwb3J0cy5URVhUX05PREUgPSBleHBvcnRzLkRPQ1VNRU5UX05PREUgPSBleHBvcnRzLkRPQ1VNRU5UX0ZSQUdNRU5UX05PREUgPSBleHBvcnRzLkVMRU1FTlRfTk9ERSA9IHZvaWQgMDtcbmNvbnN0IHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmNvbnN0IGV4dHMgPSByZXF1aXJlKFwiLi9leHRlbnNpb25zXCIpO1xuZXhwb3J0cy5FTEVNRU5UX05PREUgPSAxO1xuZXhwb3J0cy5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFID0gMTE7XG5leHBvcnRzLkRPQ1VNRU5UX05PREUgPSA5O1xuZXhwb3J0cy5URVhUX05PREUgPSAzO1xuZXhwb3J0cy5DT01NRU5UX05PREUgPSA4O1xuY29uc3QgYXR0cmlidXRlcyA9IHV0aWxzXzEuY3JlYXRlTWFwKCk7XG5hdHRyaWJ1dGVzWydzdHlsZSddID0gYXBwbHlTdHlsZTtcbmZ1bmN0aW9uIGlzRG9jdW1lbnRSb290KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMTEgfHwgbm9kZS5ub2RlVHlwZSA9PT0gOTtcbn1cbmV4cG9ydHMuaXNEb2N1bWVudFJvb3QgPSBpc0RvY3VtZW50Um9vdDtcbmZ1bmN0aW9uIGlzRWxlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDE7XG59XG5leHBvcnRzLmlzRWxlbWVudCA9IGlzRWxlbWVudDtcbmZ1bmN0aW9uIGlzVGV4dChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDM7XG59XG5leHBvcnRzLmlzVGV4dCA9IGlzVGV4dDtcbmZ1bmN0aW9uIGdldEFuY2VzdHJ5KG5vZGUsIHJvb3QpIHtcbiAgICBjb25zdCBhbmNlc3RyeSA9IFtdO1xuICAgIGxldCBjdXIgPSBub2RlO1xuICAgIHdoaWxlIChjdXIgIT09IHJvb3QpIHtcbiAgICAgICAgY29uc3QgbiA9IGN1cjtcbiAgICAgICAgYW5jZXN0cnkucHVzaChuKTtcbiAgICAgICAgY3VyID0gbi5wYXJlbnROb2RlO1xuICAgIH1cbiAgICByZXR1cm4gYW5jZXN0cnk7XG59XG5leHBvcnRzLmdldEFuY2VzdHJ5ID0gZ2V0QW5jZXN0cnk7XG5jb25zdCBnZXRSb290Tm9kZSA9IE5vZGUucHJvdG90eXBlLmdldFJvb3ROb2RlIHx8XG4gICAgZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgY3VyID0gdGhpcztcbiAgICAgICAgbGV0IHByZXYgPSBjdXI7XG4gICAgICAgIHdoaWxlIChjdXIpIHtcbiAgICAgICAgICAgIHByZXYgPSBjdXI7XG4gICAgICAgICAgICBjdXIgPSBjdXIucGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJldjtcbiAgICB9O1xuZnVuY3Rpb24gcmV2ZXJzZUNvbGxlY3ROb2RlV2l0aEJyZWFkdGgocGFyZW50LCBtYXRjaGVyLCBtYXRjaGVzKSB7XG4gICAgbGV0IGN1ciA9IHBhcmVudC5sYXN0Q2hpbGQ7XG4gICAgd2hpbGUgKGN1cikge1xuICAgICAgICBpZiAobWF0Y2hlcihjdXIpKSB7XG4gICAgICAgICAgICBtYXRjaGVzLnB1c2goY3VyKTtcbiAgICAgICAgfVxuICAgICAgICBjdXIgPSBjdXIucHJldmlvdXNTaWJsaW5nO1xuICAgIH1cbn1cbmV4cG9ydHMucmV2ZXJzZUNvbGxlY3ROb2RlV2l0aEJyZWFkdGggPSByZXZlcnNlQ29sbGVjdE5vZGVXaXRoQnJlYWR0aDtcbmZ1bmN0aW9uIHJldmVyc2VGaW5kTm9kZVdpdGhCcmVhZHRoKHBhcmVudCwgbWF0Y2hlcikge1xuICAgIGxldCBjdXIgPSBwYXJlbnQubGFzdENoaWxkO1xuICAgIHdoaWxlIChjdXIpIHtcbiAgICAgICAgaWYgKG1hdGNoZXIoY3VyKSkge1xuICAgICAgICAgICAgcmV0dXJuIGN1cjtcbiAgICAgICAgfVxuICAgICAgICBjdXIgPSBjdXIucHJldmlvdXNTaWJsaW5nO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydHMucmV2ZXJzZUZpbmROb2RlV2l0aEJyZWFkdGggPSByZXZlcnNlRmluZE5vZGVXaXRoQnJlYWR0aDtcbmZ1bmN0aW9uIGNvbGxlY3ROb2RlV2l0aEJyZWFkdGgocGFyZW50LCBtYXRjaGVyLCBtYXRjaGVzKSB7XG4gICAgbGV0IGN1ciA9IHBhcmVudC5maXJzdENoaWxkO1xuICAgIGlmIChtYXRjaGVyKGN1cikpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKGN1cik7XG4gICAgfVxuICAgIHdoaWxlIChjdXIpIHtcbiAgICAgICAgaWYgKG1hdGNoZXIoY3VyLm5leHRTaWJsaW5nKSkge1xuICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKGN1cik7XG4gICAgICAgIH1cbiAgICAgICAgY3VyID0gY3VyLm5leHRTaWJsaW5nO1xuICAgIH1cbn1cbmV4cG9ydHMuY29sbGVjdE5vZGVXaXRoQnJlYWR0aCA9IGNvbGxlY3ROb2RlV2l0aEJyZWFkdGg7XG5mdW5jdGlvbiBjb2xsZWN0Tm9kZVdpdGhEZXB0aChwYXJlbnQsIG1hdGNoZXIsIG1hdGNoZXMpIHtcbiAgICBsZXQgY3VyID0gcGFyZW50LmZpcnN0Q2hpbGQ7XG4gICAgd2hpbGUgKGN1cikge1xuICAgICAgICBpZiAobWF0Y2hlcihjdXIpKSB7XG4gICAgICAgICAgICBtYXRjaGVzLnB1c2goY3VyKTtcbiAgICAgICAgfVxuICAgICAgICBjdXIgPSBjdXIuZmlyc3RDaGlsZDtcbiAgICB9XG59XG5leHBvcnRzLmNvbGxlY3ROb2RlV2l0aERlcHRoID0gY29sbGVjdE5vZGVXaXRoRGVwdGg7XG5mdW5jdGlvbiBmaW5kTm9kZVdpdGhCcmVhZHRoKHBhcmVudCwgbWF0Y2hlcikge1xuICAgIGxldCBjdXIgPSBwYXJlbnQuZmlyc3RDaGlsZDtcbiAgICB3aGlsZSAoY3VyKSB7XG4gICAgICAgIGlmIChtYXRjaGVyKGN1cikpIHtcbiAgICAgICAgICAgIHJldHVybiBjdXI7XG4gICAgICAgIH1cbiAgICAgICAgY3VyID0gY3VyLm5leHRTaWJsaW5nO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydHMuZmluZE5vZGVXaXRoQnJlYWR0aCA9IGZpbmROb2RlV2l0aEJyZWFkdGg7XG5mdW5jdGlvbiBmaW5kTm9kZVdpdGhEZXB0aChwYXJlbnQsIG1hdGNoZXIpIHtcbiAgICBsZXQgY3VyID0gcGFyZW50LmZpcnN0Q2hpbGQ7XG4gICAgd2hpbGUgKGN1cikge1xuICAgICAgICBpZiAobWF0Y2hlcihjdXIpKSB7XG4gICAgICAgICAgICByZXR1cm4gY3VyO1xuICAgICAgICB9XG4gICAgICAgIGN1ciA9IGN1ci5maXJzdENoaWxkO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydHMuZmluZE5vZGVXaXRoRGVwdGggPSBmaW5kTm9kZVdpdGhEZXB0aDtcbmZ1bmN0aW9uIGZpbmREZXB0aEZpcnN0KHBhcmVudCwgbWF0Y2hlcikge1xuICAgIGxldCBjdXIgPSBwYXJlbnQuZmlyc3RDaGlsZDtcbiAgICB3aGlsZSAoY3VyKSB7XG4gICAgICAgIGNvbnN0IGZvdW5kID0gZmluZE5vZGVXaXRoRGVwdGgoY3VyLCBtYXRjaGVyKTtcbiAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgIH1cbiAgICAgICAgY3VyID0gY3VyLm5leHRTaWJsaW5nO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbn1cbmV4cG9ydHMuZmluZERlcHRoRmlyc3QgPSBmaW5kRGVwdGhGaXJzdDtcbmZ1bmN0aW9uIGNvbGxlY3REZXB0aEZpcnN0KHBhcmVudCwgbWF0Y2hlciwgbWF0Y2hlcykge1xuICAgIGxldCBjdXIgPSBwYXJlbnQuZmlyc3RDaGlsZDtcbiAgICB3aGlsZSAoY3VyKSB7XG4gICAgICAgIGNvbGxlY3ROb2RlV2l0aERlcHRoKGN1ciwgbWF0Y2hlciwgbWF0Y2hlcyk7XG4gICAgICAgIGN1ciA9IGN1ci5uZXh0U2libGluZztcbiAgICB9XG4gICAgcmV0dXJuO1xufVxuZXhwb3J0cy5jb2xsZWN0RGVwdGhGaXJzdCA9IGNvbGxlY3REZXB0aEZpcnN0O1xuZnVuY3Rpb24gZmluZEJyZWFkdGhGaXJzdChwYXJlbnQsIG1hdGNoZXIpIHtcbiAgICBsZXQgY3VyID0gcGFyZW50LmZpcnN0Q2hpbGQ7XG4gICAgd2hpbGUgKGN1cikge1xuICAgICAgICBjb25zdCBmb3VuZCA9IGZpbmROb2RlV2l0aEJyZWFkdGgoY3VyLCBtYXRjaGVyKTtcbiAgICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gZm91bmQ7XG4gICAgICAgIH1cbiAgICAgICAgY3VyID0gY3VyLmZpcnN0Q2hpbGQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuZXhwb3J0cy5maW5kQnJlYWR0aEZpcnN0ID0gZmluZEJyZWFkdGhGaXJzdDtcbmZ1bmN0aW9uIGFwcGx5Q2hpbGROb2RlKHBhcmVudCwgZm4pIHtcbiAgICBsZXQgY3VyID0gcGFyZW50LmZpcnN0Q2hpbGQ7XG4gICAgd2hpbGUgKGN1cikge1xuICAgICAgICBmbihjdXIpO1xuICAgICAgICBjdXIgPSBjdXIubmV4dFNpYmxpbmc7XG4gICAgfVxufVxuZXhwb3J0cy5hcHBseUNoaWxkTm9kZSA9IGFwcGx5Q2hpbGROb2RlO1xuZnVuY3Rpb24gYXBwbHlFYWNoQ2hpbGROb2RlKHBhcmVudCwgZm4pIHtcbiAgICBsZXQgY3VyID0gcGFyZW50LmZpcnN0Q2hpbGQ7XG4gICAgd2hpbGUgKGN1cikge1xuICAgICAgICBmbihjdXIpO1xuICAgICAgICBhcHBseUVhY2hDaGlsZE5vZGUoY3VyLCBmbik7XG4gICAgICAgIGN1ciA9IGN1ci5uZXh0U2libGluZztcbiAgICB9XG59XG5leHBvcnRzLmFwcGx5RWFjaENoaWxkTm9kZSA9IGFwcGx5RWFjaENoaWxkTm9kZTtcbmZ1bmN0aW9uIGFwcGx5RWFjaE5vZGUocGFyZW50LCBmbikge1xuICAgIGZuKHBhcmVudCk7XG4gICAgbGV0IGN1ciA9IHBhcmVudC5maXJzdENoaWxkO1xuICAgIHdoaWxlIChjdXIpIHtcbiAgICAgICAgYXBwbHlFYWNoTm9kZShjdXIsIGZuKTtcbiAgICAgICAgY3VyID0gY3VyLm5leHRTaWJsaW5nO1xuICAgIH1cbn1cbmV4cG9ydHMuYXBwbHlFYWNoTm9kZSA9IGFwcGx5RWFjaE5vZGU7XG5mdW5jdGlvbiByZXZlcnNlQXBwbHlFYWNoTm9kZShwYXJlbnQsIGZuKSB7XG4gICAgbGV0IGN1ciA9IHBhcmVudC5sYXN0Q2hpbGQ7XG4gICAgd2hpbGUgKGN1cikge1xuICAgICAgICByZXZlcnNlQXBwbHlFYWNoTm9kZShjdXIsIGZuKTtcbiAgICAgICAgZm4oY3VyKTtcbiAgICAgICAgY3VyID0gY3VyLnByZXZpb3VzU2libGluZztcbiAgICB9XG4gICAgZm4ocGFyZW50KTtcbn1cbmV4cG9ydHMucmV2ZXJzZUFwcGx5RWFjaE5vZGUgPSByZXZlcnNlQXBwbHlFYWNoTm9kZTtcbmZ1bmN0aW9uIGVhY2hDaGlsZEFuZE5vZGUobm9kZSwgZm4pIHtcbiAgICBjb25zdCBsaXN0ID0gbm9kZS5jaGlsZE5vZGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBmbihsaXN0W2ldKTtcbiAgICB9XG4gICAgZm4obm9kZSk7XG59XG5leHBvcnRzLmVhY2hDaGlsZEFuZE5vZGUgPSBlYWNoQ2hpbGRBbmROb2RlO1xuZnVuY3Rpb24gbm9kZUxpc3RUb0FycmF5KGl0ZW1zKSB7XG4gICAgY29uc3QgbGlzdCA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaXRlbXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGlzdC5wdXNoKGl0ZW1zW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Q7XG59XG5leHBvcnRzLm5vZGVMaXN0VG9BcnJheSA9IG5vZGVMaXN0VG9BcnJheTtcbmZ1bmN0aW9uIGVhY2hOb2RlQW5kQ2hpbGQobm9kZSwgZm4pIHtcbiAgICBmbihub2RlKTtcbiAgICBjb25zdCBsaXN0ID0gbm9kZS5jaGlsZE5vZGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICBmbihsaXN0W2ldKTtcbiAgICB9XG59XG5leHBvcnRzLmVhY2hOb2RlQW5kQ2hpbGQgPSBlYWNoTm9kZUFuZENoaWxkO1xuZnVuY3Rpb24gdG9IVE1MKG5vZGUsIHNoYWxsb3cpIHtcbiAgICBjb25zdCBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICBkaXYuYXBwZW5kQ2hpbGQobm9kZS5jbG9uZU5vZGUoIXNoYWxsb3cpKTtcbiAgICByZXR1cm4gZGl2LmlubmVySFRNTDtcbn1cbmV4cG9ydHMudG9IVE1MID0gdG9IVE1MO1xuZnVuY3Rpb24gY29sbGVjdEJyZWFkdGhGaXJzdChwYXJlbnQsIG1hdGNoZXIsIG1hdGNoZXMpIHtcbiAgICBsZXQgY3VyID0gcGFyZW50LmZpcnN0Q2hpbGQ7XG4gICAgd2hpbGUgKGN1cikge1xuICAgICAgICBjb2xsZWN0Tm9kZVdpdGhCcmVhZHRoKGN1ciwgbWF0Y2hlciwgbWF0Y2hlcyk7XG4gICAgICAgIGN1ciA9IGN1ci5maXJzdENoaWxkO1xuICAgIH1cbiAgICByZXR1cm47XG59XG5leHBvcnRzLmNvbGxlY3RCcmVhZHRoRmlyc3QgPSBjb2xsZWN0QnJlYWR0aEZpcnN0O1xuZnVuY3Rpb24gZ2V0QWN0aXZlRWxlbWVudChub2RlKSB7XG4gICAgY29uc3Qgcm9vdCA9IGdldFJvb3ROb2RlLmNhbGwobm9kZSk7XG4gICAgcmV0dXJuIGlzRG9jdW1lbnRSb290KHJvb3QpID8gcm9vdC5hY3RpdmVFbGVtZW50IDogbnVsbDtcbn1cbmV4cG9ydHMuZ2V0QWN0aXZlRWxlbWVudCA9IGdldEFjdGl2ZUVsZW1lbnQ7XG5mdW5jdGlvbiBnZXRGb2N1c2VkUGF0aChub2RlLCByb290KSB7XG4gICAgY29uc3QgYWN0aXZlRWxlbWVudCA9IGdldEFjdGl2ZUVsZW1lbnQobm9kZSk7XG4gICAgaWYgKCFhY3RpdmVFbGVtZW50IHx8ICFub2RlLmNvbnRhaW5zKGFjdGl2ZUVsZW1lbnQpKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgcmV0dXJuIGdldEFuY2VzdHJ5KGFjdGl2ZUVsZW1lbnQsIHJvb3QpO1xufVxuZXhwb3J0cy5nZXRGb2N1c2VkUGF0aCA9IGdldEZvY3VzZWRQYXRoO1xuZnVuY3Rpb24gbW92ZUJlZm9yZShwYXJlbnROb2RlLCBub2RlLCByZWZlcmVuY2VOb2RlKSB7XG4gICAgY29uc3QgaW5zZXJ0UmVmZXJlbmNlTm9kZSA9IG5vZGUubmV4dFNpYmxpbmc7XG4gICAgbGV0IGN1ciA9IHJlZmVyZW5jZU5vZGU7XG4gICAgd2hpbGUgKGN1ciAhPT0gbnVsbCAmJiBjdXIgIT09IG5vZGUpIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IGN1ci5uZXh0U2libGluZztcbiAgICAgICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY3VyLCBpbnNlcnRSZWZlcmVuY2VOb2RlKTtcbiAgICAgICAgY3VyID0gbmV4dDtcbiAgICB9XG59XG5leHBvcnRzLm1vdmVCZWZvcmUgPSBtb3ZlQmVmb3JlO1xuZnVuY3Rpb24gaW5zZXJ0QmVmb3JlKHBhcmVudE5vZGUsIG5vZGUsIHJlZmVyZW5jZU5vZGUpIHtcbiAgICBpZiAocmVmZXJlbmNlTm9kZSA9PT0gbnVsbCkge1xuICAgICAgICBwYXJlbnROb2RlLmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobm9kZSwgcmVmZXJlbmNlTm9kZSk7XG4gICAgcmV0dXJuIG51bGw7XG59XG5leHBvcnRzLmluc2VydEJlZm9yZSA9IGluc2VydEJlZm9yZTtcbmZ1bmN0aW9uIHJlcGxhY2VOb2RlKHBhcmVudE5vZGUsIG5vZGUsIHJlcGxhY2VtZW50KSB7XG4gICAgaWYgKHJlcGxhY2VtZW50ID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBwYXJlbnROb2RlLnJlcGxhY2VDaGlsZChyZXBsYWNlbWVudCwgbm9kZSk7XG4gICAgcmV0dXJuIG51bGw7XG59XG5leHBvcnRzLnJlcGxhY2VOb2RlID0gcmVwbGFjZU5vZGU7XG5mdW5jdGlvbiByZXBsYWNlTm9kZUlmKHRhcmdldE5vZGUsIHJlcGxhY2VtZW50KSB7XG4gICAgaWYgKHJlcGxhY2VtZW50ID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29uc3QgcGFyZW50ID0gdGFyZ2V0Tm9kZS5wYXJlbnROb2RlO1xuICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcGFyZW50LnJlcGxhY2VDaGlsZChyZXBsYWNlbWVudCwgdGFyZ2V0Tm9kZSk7XG4gICAgcmV0dXJuIHRydWU7XG59XG5leHBvcnRzLnJlcGxhY2VOb2RlSWYgPSByZXBsYWNlTm9kZUlmO1xuZnVuY3Rpb24gZ2V0TmFtZXNwYWNlKG5hbWUpIHtcbiAgICBpZiAobmFtZS5sYXN0SW5kZXhPZigneG1sOicsIDApID09PSAwKSB7XG4gICAgICAgIHJldHVybiAnaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlJztcbiAgICB9XG4gICAgaWYgKG5hbWUubGFzdEluZGV4T2YoJ3hsaW5rOicsIDApID09PSAwKSB7XG4gICAgICAgIHJldHVybiAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG59XG5leHBvcnRzLmdldE5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZTtcbmZ1bmN0aW9uIGFwcGx5QXR0cihlbCwgbmFtZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBhdHRyTlMgPSBnZXROYW1lc3BhY2UobmFtZSk7XG4gICAgICAgIGlmIChhdHRyTlMpIHtcbiAgICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZU5TKGF0dHJOUywgbmFtZSwgU3RyaW5nKHZhbHVlKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUobmFtZSwgU3RyaW5nKHZhbHVlKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmFwcGx5QXR0ciA9IGFwcGx5QXR0cjtcbmZ1bmN0aW9uIGFwcGx5QXR0cnMoZWwsIHZhbHVlcykge1xuICAgIGZvciAobGV0IGtleSBpbiB2YWx1ZXMpIHtcbiAgICAgICAgaWYgKHZhbHVlc1trZXldID09IG51bGwpIHtcbiAgICAgICAgICAgIGVsLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKGtleSwgdmFsdWVzW2tleV0pO1xuICAgIH1cbn1cbmV4cG9ydHMuYXBwbHlBdHRycyA9IGFwcGx5QXR0cnM7XG5mdW5jdGlvbiBhcHBseVByb3AoZWwsIG5hbWUsIHZhbHVlKSB7XG4gICAgZWxbbmFtZV0gPSB2YWx1ZTtcbn1cbmV4cG9ydHMuYXBwbHlQcm9wID0gYXBwbHlQcm9wO1xuZnVuY3Rpb24gc2V0U3R5bGVWYWx1ZShzdHlsZSwgcHJvcCwgdmFsdWUpIHtcbiAgICBpZiAocHJvcC5pbmRleE9mKCctJykgPj0gMCkge1xuICAgICAgICBzdHlsZS5zZXRQcm9wZXJ0eShwcm9wLCB2YWx1ZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzdHlsZVtwcm9wXSA9IHZhbHVlO1xuICAgIH1cbn1cbmV4cG9ydHMuc2V0U3R5bGVWYWx1ZSA9IHNldFN0eWxlVmFsdWU7XG5mdW5jdGlvbiBhcHBseVNWR1N0eWxlKGVsLCBuYW1lLCBzdHlsZSkge1xuICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGVsLnN0eWxlLmNzc1RleHQgPSBzdHlsZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGVsLnN0eWxlLmNzc1RleHQgPSAnJztcbiAgICAgICAgY29uc3QgZWxTdHlsZSA9IGVsLnN0eWxlO1xuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIGlmICh1dGlsc18xLmhhcyhzdHlsZSwgcHJvcCkpIHtcbiAgICAgICAgICAgICAgICBzZXRTdHlsZVZhbHVlKGVsU3R5bGUsIHByb3AsIHN0eWxlW3Byb3BdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuYXBwbHlTVkdTdHlsZSA9IGFwcGx5U1ZHU3R5bGU7XG5mdW5jdGlvbiBhcHBseVN0eWxlKGVsLCBuYW1lLCBzdHlsZSkge1xuICAgIGlmICh0eXBlb2Ygc3R5bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGVsLnN0eWxlLmNzc1RleHQgPSBzdHlsZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGVsLnN0eWxlLmNzc1RleHQgPSAnJztcbiAgICAgICAgY29uc3QgZWxTdHlsZSA9IGVsLnN0eWxlO1xuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIGlmICh1dGlsc18xLmhhcyhzdHlsZSwgcHJvcCkpIHtcbiAgICAgICAgICAgICAgICBzZXRTdHlsZVZhbHVlKGVsU3R5bGUsIHByb3AsIHN0eWxlW3Byb3BdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuYXBwbHlTdHlsZSA9IGFwcGx5U3R5bGU7XG5mdW5jdGlvbiBhcHBseVN0eWxlcyhlbCwgc3R5bGUpIHtcbiAgICBpZiAodHlwZW9mIHN0eWxlID09PSAnc3RyaW5nJykge1xuICAgICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gc3R5bGU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gJyc7XG4gICAgICAgIGNvbnN0IGVsU3R5bGUgPSBlbC5zdHlsZTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHN0eWxlKSB7XG4gICAgICAgICAgICBpZiAodXRpbHNfMS5oYXMoc3R5bGUsIHByb3ApKSB7XG4gICAgICAgICAgICAgICAgc2V0U3R5bGVWYWx1ZShlbFN0eWxlLCBwcm9wLCBzdHlsZVtwcm9wXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmFwcGx5U3R5bGVzID0gYXBwbHlTdHlsZXM7XG5mdW5jdGlvbiBhcHBseVNWR1N0eWxlcyhlbCwgc3R5bGUpIHtcbiAgICBpZiAodHlwZW9mIHN0eWxlID09PSAnc3RyaW5nJykge1xuICAgICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gc3R5bGU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBlbC5zdHlsZS5jc3NUZXh0ID0gJyc7XG4gICAgICAgIGNvbnN0IGVsU3R5bGUgPSBlbC5zdHlsZTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9wIGluIHN0eWxlKSB7XG4gICAgICAgICAgICBpZiAodXRpbHNfMS5oYXMoc3R5bGUsIHByb3ApKSB7XG4gICAgICAgICAgICAgICAgc2V0U3R5bGVWYWx1ZShlbFN0eWxlLCBwcm9wLCBzdHlsZVtwcm9wXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmFwcGx5U1ZHU3R5bGVzID0gYXBwbHlTVkdTdHlsZXM7XG5mdW5jdGlvbiBhcHBseUF0dHJpYnV0ZVR5cGVkKGVsLCBuYW1lLCB2YWx1ZSkge1xuICAgIGNvbnN0IHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gICAgaWYgKHR5cGUgPT09ICdvYmplY3QnIHx8IHR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgYXBwbHlQcm9wKGVsLCBuYW1lLCB2YWx1ZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBhcHBseUF0dHIoZWwsIG5hbWUsIHZhbHVlKTtcbiAgICB9XG59XG5leHBvcnRzLmFwcGx5QXR0cmlidXRlVHlwZWQgPSBhcHBseUF0dHJpYnV0ZVR5cGVkO1xuZnVuY3Rpb24gZ2V0TmFtZXNwYWNlRm9yVGFnKHRhZywgcGFyZW50KSB7XG4gICAgaWYgKHRhZyA9PT0gJ3N2ZycpIHtcbiAgICAgICAgcmV0dXJuICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gICAgfVxuICAgIGlmICh0YWcgPT09ICdtYXRoJykge1xuICAgICAgICByZXR1cm4gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aC9NYXRoTUwnO1xuICAgIH1cbiAgICBpZiAocGFyZW50ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBwYXJlbnQubmFtZXNwYWNlVVJJO1xufVxuZXhwb3J0cy5nZXROYW1lc3BhY2VGb3JUYWcgPSBnZXROYW1lc3BhY2VGb3JUYWc7XG5mdW5jdGlvbiByZWNvcmRBdHRyaWJ1dGVzKG5vZGUpIHtcbiAgICBjb25zdCBhdHRycyA9IHt9O1xuICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBub2RlLmF0dHJpYnV0ZXM7XG4gICAgY29uc3QgbGVuZ3RoID0gYXR0cmlidXRlcy5sZW5ndGg7XG4gICAgaWYgKCFsZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMCwgaiA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSwgaiArPSAyKSB7XG4gICAgICAgIGNvbnN0IGF0dHIgPSBhdHRyaWJ1dGVzW2ldO1xuICAgICAgICBhdHRyc1thdHRyLm5hbWVdID0gYXR0ci52YWx1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGF0dHJzO1xufVxuZXhwb3J0cy5yZWNvcmRBdHRyaWJ1dGVzID0gcmVjb3JkQXR0cmlidXRlcztcbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQoZG9jLCBuYW1lT3JDdG9yLCBrZXksIGNvbnRlbnQsIGF0dHJpYnV0ZXMsIG5hbWVzcGFjZSkge1xuICAgIGxldCBlbDtcbiAgICBpZiAodHlwZW9mIG5hbWVPckN0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZWwgPSBuZXcgbmFtZU9yQ3RvcigpO1xuICAgICAgICByZXR1cm4gZWw7XG4gICAgfVxuICAgIG5hbWVzcGFjZSA9IG5hbWVzcGFjZS50cmltKCk7XG4gICAgaWYgKG5hbWVzcGFjZS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHN3aXRjaCAobmFtZU9yQ3Rvcikge1xuICAgICAgICAgICAgY2FzZSAnc3ZnJzpcbiAgICAgICAgICAgICAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbmFtZU9yQ3Rvcik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdtYXRoJzpcbiAgICAgICAgICAgICAgICBlbCA9IGRvYy5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aC9NYXRoTUwnLCBuYW1lT3JDdG9yKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgZWwgPSBkb2MuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgbmFtZU9yQ3Rvcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGVsID0gZG9jLmNyZWF0ZUVsZW1lbnQobmFtZU9yQ3Rvcik7XG4gICAgfVxuICAgIGVsLnNldEF0dHJpYnV0ZSgnX2tleScsIGtleSk7XG4gICAgaWYgKGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgYXBwbHlBdHRycyhlbCwgYXR0cmlidXRlcyk7XG4gICAgfVxuICAgIGlmIChjb250ZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgZWwuaW5uZXJIVE1MID0gY29udGVudDtcbiAgICB9XG4gICAgcmV0dXJuIGVsO1xufVxuZXhwb3J0cy5jcmVhdGVFbGVtZW50ID0gY3JlYXRlRWxlbWVudDtcbmZ1bmN0aW9uIGNyZWF0ZVRleHQoZG9jLCB0ZXh0LCBrZXkpIHtcbiAgICBjb25zdCBub2RlID0gZG9jLmNyZWF0ZVRleHROb2RlKHRleHQpO1xuICAgIGV4dHMuT2JqZWN0cy5QYXRjaFdpdGgobm9kZSwgJ2tleScsIGtleSk7XG4gICAgcmV0dXJuIG5vZGU7XG59XG5leHBvcnRzLmNyZWF0ZVRleHQgPSBjcmVhdGVUZXh0O1xuZnVuY3Rpb24gcmVtb3ZlRnJvbU5vZGUoZnJvbU5vZGUsIGVuZE5vZGUpIHtcbiAgICBjb25zdCBwYXJlbnROb2RlID0gZnJvbU5vZGUucGFyZW50Tm9kZTtcbiAgICBsZXQgY2hpbGQgPSBmcm9tTm9kZTtcbiAgICB3aGlsZSAoY2hpbGQgIT09IGVuZE5vZGUpIHtcbiAgICAgICAgY29uc3QgbmV4dCA9IGNoaWxkLm5leHRTaWJsaW5nO1xuICAgICAgICBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbiAgICAgICAgY2hpbGQgPSBuZXh0O1xuICAgIH1cbn1cbmV4cG9ydHMucmVtb3ZlRnJvbU5vZGUgPSByZW1vdmVGcm9tTm9kZTtcbmZ1bmN0aW9uIGZyb21CbG9iKG8pIHtcbiAgICBpZiAobyA9PT0gbnVsbCB8fCBvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgZGF0YSA9IG51bGw7XG4gICAgY29uc3QgZmlsZVJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgZmlsZVJlYWRlci5vbmxvYWRlbmQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRhdGEgPSBuZXcgVWludDhBcnJheShmaWxlUmVhZGVyLnJlc3VsdCk7XG4gICAgfTtcbiAgICBmaWxlUmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKG8pO1xuICAgIHJldHVybiBkYXRhO1xufVxuZXhwb3J0cy5mcm9tQmxvYiA9IGZyb21CbG9iO1xuZnVuY3Rpb24gZnJvbUZpbGUobykge1xuICAgIGlmIChvID09PSBudWxsIHx8IG8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBkYXRhID0gbnVsbDtcbiAgICBjb25zdCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmaWxlUmVhZGVyLm9ubG9hZGVuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZGF0YSA9IG5ldyBVaW50OEFycmF5KGZpbGVSZWFkZXIucmVzdWx0KTtcbiAgICB9O1xuICAgIGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIobyk7XG4gICAgcmV0dXJuIGRhdGE7XG59XG5leHBvcnRzLmZyb21GaWxlID0gZnJvbUZpbGU7XG5mdW5jdGlvbiB0b0lucHV0U291cmNlQ2FwYWJpbGl0eShvKSB7XG4gICAgaWYgKG8gPT09IG51bGwgfHwgbyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRmlyZXNUb3VjaEV2ZW50OiBvLmZpcmVzVG91Y2hFdmVudCxcbiAgICB9O1xufVxuZXhwb3J0cy50b0lucHV0U291cmNlQ2FwYWJpbGl0eSA9IHRvSW5wdXRTb3VyY2VDYXBhYmlsaXR5O1xuZnVuY3Rpb24gdG9Nb3Rpb25EYXRhKG8pIHtcbiAgICBsZXQgbWQgPSB7IFg6IDAuMCwgWTogMC4wLCBaOiAwLjAgfTtcbiAgICBpZiAobyA9PT0gbnVsbCB8fCBvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG1kO1xuICAgIH1cbiAgICBtZC5YID0gby54O1xuICAgIG1kLlkgPSBvLnk7XG4gICAgbWQuWiA9IG8uejtcbiAgICByZXR1cm4gbWQ7XG59XG5leHBvcnRzLnRvTW90aW9uRGF0YSA9IHRvTW90aW9uRGF0YTtcbmZ1bmN0aW9uIHRvUm90YXRpb25EYXRhKG8pIHtcbiAgICBpZiAobyA9PT0gbnVsbCB8fCBvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBtZCA9IHt9O1xuICAgIG1kLkFscGhhID0gby5hbHBoYTtcbiAgICBtZC5CZXRhID0gby5iZXRhO1xuICAgIG1kLkdhbW1hID0gby5nYW1tYTtcbiAgICByZXR1cm4gbWQ7XG59XG5leHBvcnRzLnRvUm90YXRpb25EYXRhID0gdG9Sb3RhdGlvbkRhdGE7XG5mdW5jdGlvbiB0b01lZGlhU3RyZWFtKG8pIHtcbiAgICBpZiAobyA9PT0gbnVsbCB8fCBvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBzdHJlYW0gPSB7IEF1ZGlvczogW10sIFZpZGVvczogW10gfTtcbiAgICBzdHJlYW0uQWN0aXZlID0gby5hY3RpdmU7XG4gICAgc3RyZWFtLkVuZGVkID0gby5lbmRlZDtcbiAgICBzdHJlYW0uSUQgPSBvLmlkO1xuICAgIHN0cmVhbS5BdWRpb3MgPSBbXTtcbiAgICBzdHJlYW0uVmlkZW9zID0gW107XG4gICAgbGV0IGF1ZGlvVHJhY2tzID0gby5nZXRBdWRpb1RyYWNrcygpO1xuICAgIGlmIChhdWRpb1RyYWNrcyAhPT0gbnVsbCAmJiBhdWRpb1RyYWNrcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXVkaW9UcmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCB0cmFjayA9IGF1ZGlvVHJhY2tzW2ldO1xuICAgICAgICAgICAgbGV0IHNldHRpbmdzID0gdHJhY2suZ2V0U2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHN0cmVhbS5BdWRpb3MucHVzaCh7XG4gICAgICAgICAgICAgICAgRW5hYmxlZDogdHJhY2suZW5hYmxlZCxcbiAgICAgICAgICAgICAgICBJRDogdHJhY2suaWQsXG4gICAgICAgICAgICAgICAgS2luZDogdHJhY2sua2luZCxcbiAgICAgICAgICAgICAgICBMYWJlbDogdHJhY2subGFiZWwsXG4gICAgICAgICAgICAgICAgTXV0ZWQ6IHRyYWNrLm11dGVkLFxuICAgICAgICAgICAgICAgIFJlYWR5U3RhdGU6IHRyYWNrLnJlYWR5U3RhdGUsXG4gICAgICAgICAgICAgICAgUmVtb3RlOiB0cmFjay5yZW1vdGUsXG4gICAgICAgICAgICAgICAgQXVkaW9TZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICBDaGFubmVsQ291bnQ6IHNldHRpbmdzLmNoYW5uZWxDb3VudC5JbnQoKSxcbiAgICAgICAgICAgICAgICAgICAgRWNob0NhbmNlbGxhdGlvbjogc2V0dGluZ3MuZWNob0NhbmNlbGxhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgTGF0ZW5jeTogc2V0dGluZ3MubGF0ZW5jeSxcbiAgICAgICAgICAgICAgICAgICAgU2FtcGxlUmF0ZTogc2V0dGluZ3Muc2FtcGxlUmF0ZS5JbnQ2NCgpLFxuICAgICAgICAgICAgICAgICAgICBTYW1wbGVTaXplOiBzZXR0aW5ncy5zYW1wbGVTaXplLkludDY0KCksXG4gICAgICAgICAgICAgICAgICAgIFZvbHVtZTogc2V0dGluZ3Mudm9sdW1lLFxuICAgICAgICAgICAgICAgICAgICBNZWRpYVRyYWNrU2V0dGluZ3M6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIERldmljZUlEOiBzZXR0aW5ncy5kZXZpY2VJZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIEdyb3VwSUQ6IHNldHRpbmdzLmdyb3VwSWQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxldCB2aWRlb3NUcmFja3MgPSBvLmdldFZpZGVvVHJhY2tzKCk7XG4gICAgaWYgKHZpZGVvc1RyYWNrcyAhPT0gbnVsbCAmJiB2aWRlb3NUcmFja3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZGVvc1RyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IHRyYWNrID0gdmlkZW9zVHJhY2tzW2ldO1xuICAgICAgICAgICAgbGV0IHNldHRpbmdzID0gdHJhY2suZ2V0U2V0dGluZ3MoKTtcbiAgICAgICAgICAgIHN0cmVhbS5WaWRlb3MucHVzaCh7XG4gICAgICAgICAgICAgICAgRW5hYmxlZDogdHJhY2suZW5hYmxlZCxcbiAgICAgICAgICAgICAgICBJRDogdHJhY2suaWQsXG4gICAgICAgICAgICAgICAgS2luZDogdHJhY2sua2luZCxcbiAgICAgICAgICAgICAgICBMYWJlbDogdHJhY2subGFiZWwsXG4gICAgICAgICAgICAgICAgTXV0ZWQ6IHRyYWNrLm11dGVkLFxuICAgICAgICAgICAgICAgIFJlYWR5U3RhdGU6IHRyYWNrLnJlYWR5U3RhdGUsXG4gICAgICAgICAgICAgICAgUmVtb3RlOiB0cmFjay5yZW1vdGUsXG4gICAgICAgICAgICAgICAgVmlkZW9TZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICBBc3BlY3RSYXRpbzogc2V0dGluZ3MuYXNwZWN0UmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICBGcmFtZVJhdGU6IHNldHRpbmdzLmZyYW1lUmF0ZSxcbiAgICAgICAgICAgICAgICAgICAgSGVpZ2h0OiBzZXR0aW5ncy5oZWlnaHQuSW50NjQoKSxcbiAgICAgICAgICAgICAgICAgICAgV2lkdGg6IHNldHRpbmdzLndpZHRoLkludDY0KCksXG4gICAgICAgICAgICAgICAgICAgIEZhY2luZ01vZGU6IHNldHRpbmdzLmZhY2luZ01vZGUsXG4gICAgICAgICAgICAgICAgICAgIE1lZGlhVHJhY2tTZXR0aW5nczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgRGV2aWNlSUQ6IHNldHRpbmdzLmRldmljZUlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgR3JvdXBJRDogc2V0dGluZ3MuZ3JvdXBJZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHN0cmVhbTtcbn1cbmV4cG9ydHMudG9NZWRpYVN0cmVhbSA9IHRvTWVkaWFTdHJlYW07XG5mdW5jdGlvbiB0b1RvdWNoZXMobykge1xuICAgIGlmIChvID09PSBudWxsIHx8IG8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHRvdWNoZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG8ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGV2ID0gby5pdGVtKGkpO1xuICAgICAgICB0b3VjaGVzLnB1c2goe1xuICAgICAgICAgICAgQ2xpZW50WDogZXYuY2xpZW50WCxcbiAgICAgICAgICAgIENsaWVudFk6IGV2LmNsaWVudFksXG4gICAgICAgICAgICBPZmZzZXRYOiBldi5vZmZzZXRYLFxuICAgICAgICAgICAgT2Zmc2V0WTogZXYub2Zmc2V0WSxcbiAgICAgICAgICAgIFBhZ2VYOiBldi5wYWdlWCxcbiAgICAgICAgICAgIFBhZ2VZOiBldi5wYWdlWSxcbiAgICAgICAgICAgIFNjcmVlblg6IGV2LnNjcmVlblgsXG4gICAgICAgICAgICBTY3JlZW5ZOiBldi5zY3JlZW5ZLFxuICAgICAgICAgICAgSWRlbnRpZmllcjogZXYuaWRlbnRpZmllcixcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiB0b3VjaGVzO1xufVxuZXhwb3J0cy50b1RvdWNoZXMgPSB0b1RvdWNoZXM7XG5mdW5jdGlvbiB0b0dhbWVwYWQobykge1xuICAgIGxldCBwYWQgPSB7fTtcbiAgICBpZiAobyA9PT0gbnVsbCB8fCBvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHBhZDtcbiAgICB9XG4gICAgcGFkLkRpc3BsYXlJRCA9IG8uZGlzcGxheUlkO1xuICAgIHBhZC5JRCA9IG8uaWQ7XG4gICAgcGFkLkluZGV4ID0gby5pbmRleC5JbnQoKTtcbiAgICBwYWQuTWFwcGluZyA9IG8ubWFwcGluZztcbiAgICBwYWQuQ29ubmVjdGVkID0gby5jb25uZWN0ZWQ7XG4gICAgcGFkLlRpbWVzdGFtcCA9IG8udGltZXN0YW1wO1xuICAgIHBhZC5BeGVzID0gW107XG4gICAgcGFkLkJ1dHRvbnMgPSBbXTtcbiAgICBsZXQgYXhlcyA9IG8uYXhlcztcbiAgICBpZiAoYXhlcyAhPT0gbnVsbCAmJiBheGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBheGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBwYWQuQXhlcy5wdXNoKGF4ZXNbaV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBidXR0b25zID0gby5idXR0b25zO1xuICAgIGlmIChidXR0b25zICE9PSBudWxsICYmIGJ1dHRvbnMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ1dHRvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGJ1dHRvbiA9IGJ1dHRvbnNbaV07XG4gICAgICAgICAgICBwYWQuQnV0dG9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICBWYWx1ZTogYnV0dG9uLnZhbHVlLFxuICAgICAgICAgICAgICAgIFByZXNzZWQ6IGJ1dHRvbi5wcmVzc2VkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBhZDtcbn1cbmV4cG9ydHMudG9HYW1lcGFkID0gdG9HYW1lcGFkO1xuZnVuY3Rpb24gdG9EYXRhVHJhbnNmZXIobykge1xuICAgIGlmIChvID09PSBudWxsIHx8IG8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBkdCA9IHt9O1xuICAgIGR0LkRyb3BFZmZlY3QgPSBvLmRyb3BFZmZlY3Q7XG4gICAgZHQuRWZmZWN0QWxsb3dlZCA9IG8uZWZmZWN0QWxsb3dlZDtcbiAgICBkdC5UeXBlcyA9IG8udHlwZXM7XG4gICAgZHQuSXRlbXMgPSBbXTtcbiAgICBjb25zdCBpdGVtcyA9IG8uaXRlbXM7XG4gICAgaWYgKGl0ZW1zICE9PSBudWxsICYmIGl0ZW1zICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpdGVtcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGl0ZW1zLkRhdGFUcmFuc2Zlckl0ZW0oaSk7XG4gICAgICAgICAgICBkdC5JdGVtcy5wdXNoKHtcbiAgICAgICAgICAgICAgICBOYW1lOiBpdGVtLm5hbWUsXG4gICAgICAgICAgICAgICAgU2l6ZTogaXRlbS5zaXplLkludCgpLFxuICAgICAgICAgICAgICAgIERhdGE6IGZyb21GaWxlKGl0ZW0pLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZHQuRmlsZXMgPSBbXTtcbiAgICBjb25zdCBmaWxlcyA9IG8uZmlsZXM7XG4gICAgaWYgKGZpbGVzICE9PSBudWxsICYmIGZpbGVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGZpbGVzW2ldO1xuICAgICAgICAgICAgZEZpbGVzLnB1c2goe1xuICAgICAgICAgICAgICAgIE5hbWU6IGl0ZW0ubmFtZSxcbiAgICAgICAgICAgICAgICBTaXplOiBpdGVtLnNpemUuSW50KCksXG4gICAgICAgICAgICAgICAgRGF0YTogZnJvbUZpbGUoaXRlbSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZHQ7XG59XG5leHBvcnRzLnRvRGF0YVRyYW5zZmVyID0gdG9EYXRhVHJhbnNmZXI7XG5mdW5jdGlvbiBnZXRNYXRjaGluZ05vZGUobWF0Y2hOb2RlLCBtYXRjaGVyKSB7XG4gICAgaWYgKCFtYXRjaE5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGlmIChtYXRjaGVyKG1hdGNoTm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIG1hdGNoTm9kZTtcbiAgICB9XG4gICAgd2hpbGUgKChtYXRjaE5vZGUgPSBtYXRjaE5vZGUubmV4dFNpYmxpbmcpKSB7XG4gICAgICAgIGlmIChtYXRjaGVyKG1hdGNoTm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaE5vZGU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5leHBvcnRzLmdldE1hdGNoaW5nTm9kZSA9IGdldE1hdGNoaW5nTm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRvbS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuT2JqZWN0cyA9IHZvaWQgMDtcbnZhciBPYmplY3RzO1xuKGZ1bmN0aW9uIChPYmplY3RzKSB7XG4gICAgZnVuY3Rpb24gUGF0Y2hXaXRoKGVsZW0sIGF0dHJOYW1lLCBhdHRycykge1xuICAgICAgICBlbGVtW2F0dHJOYW1lXSA9IGF0dHJzO1xuICAgIH1cbiAgICBPYmplY3RzLlBhdGNoV2l0aCA9IFBhdGNoV2l0aDtcbiAgICBmdW5jdGlvbiBHZXRBdHRyV2l0aChlbGVtLCBhdHRyTmFtZSkge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IGVsZW1bYXR0ck5hbWVdO1xuICAgICAgICByZXR1cm4gdmFsdWUgPyB2YWx1ZSA6ICcnO1xuICAgIH1cbiAgICBPYmplY3RzLkdldEF0dHJXaXRoID0gR2V0QXR0cldpdGg7XG4gICAgZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoZWxlbSkge1xuICAgICAgICByZXR1cm4gZWxlbSA9PT0gbnVsbCB8fCBlbGVtID09PSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIE9iamVjdHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcbiAgICBmdW5jdGlvbiBpc0FueShlbGVtLCAuLi52YWx1ZXMpIHtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggb2YgdmFsdWVzKSB7XG4gICAgICAgICAgICBpZiAoZWxlbSA9PT0gaW5kZXgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIE9iamVjdHMuaXNBbnkgPSBpc0FueTtcbn0pKE9iamVjdHMgPSBleHBvcnRzLk9iamVjdHMgfHwgKGV4cG9ydHMuT2JqZWN0cyA9IHt9KSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1leHRlbnNpb25zLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5tb3VudFRvID0gdm9pZCAwO1xuY29uc3QgdXRpbHMgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmNvbnN0IGV4dHMgPSByZXF1aXJlKFwiLi9leHRlbnNpb25zXCIpO1xuY29uc3QgcGF0Y2ggPSByZXF1aXJlKFwiLi9wYXRjaFwiKTtcbmNvbnN0IG1vdW50ID0gcmVxdWlyZShcIi4vbW91bnRcIik7XG5jb25zdCBkb20gPSByZXF1aXJlKFwiLi9kb21cIik7XG5jb25zdCBuYW1lc3BhY2UgPSBPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKE9iamVjdC5hc3NpZ24oe30sIHV0aWxzKSwgZXh0cyksIHBhdGNoKSwgZG9tKSwgbW91bnQpO1xuZnVuY3Rpb24gbW91bnRUbyhwYXJlbnQpIHtcbiAgICBwYXJlbnQubWFya3VwID0gbmFtZXNwYWNlO1xufVxuZXhwb3J0cy5tb3VudFRvID0gbW91bnRUbztcbmV4cG9ydHMuZGVmYXVsdCA9IG5hbWVzcGFjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5ET01Nb3VudCA9IHZvaWQgMDtcbmNvbnN0IGRvbSA9IHJlcXVpcmUoXCIuL2RvbVwiKTtcbmNvbnN0IHBhdGNoID0gcmVxdWlyZShcIi4vcGF0Y2hcIik7XG5jb25zdCB1dGlscyA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuY2xhc3MgRE9NTW91bnQge1xuICAgIGNvbnN0cnVjdG9yKGRvY3VtZW50LCB0YXJnZXQsIG5vdGlmaWVyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2RvY3VtZW50IHNob3VsZCBiZSBhbiBvYmplY3QnKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRvYyA9IGRvY3VtZW50O1xuICAgICAgICB0aGlzLm5vdGlmaWVyID0gbm90aWZpZXI7XG4gICAgICAgIHRoaXMuZXZlbnRzID0ge307XG4gICAgICAgIHRoaXMuaGFuZGxlciA9IHRoaXMuaGFuZGxlRXZlbnQuYmluZCh0aGlzKTtcbiAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjb25zdCB0YXJnZXRTZWxlY3RvciA9IHRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSB0aGlzLmRvYy5xdWVyeVNlbGVjdG9yKHRhcmdldFNlbGVjdG9yKTtcbiAgICAgICAgICAgIGlmIChub2RlID09PSBudWxsIHx8IG5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5hYmxlIHRvIGxvY2F0ZSBub2RlIGZvciAke3sgdGFyZ2V0U2VsZWN0b3IgfX1gKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubW91bnROb2RlID0gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubW91bnROb2RlID0gdGFyZ2V0O1xuICAgICAgICB9XG4gICAgfVxuICAgIGhhbmRsZUV2ZW50KGV2ZW50KSB7XG4gICAgICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnQudHlwZV0pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICBpZiAodGFyZ2V0Lm5vZGVUeXBlICE9PSBkb20uRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgdGFyZ2V0RWxlbWVudCA9IHRhcmdldDtcbiAgICAgICAgY29uc3Qga2ViYWJFdmVudE5hbWUgPSAnZXZlbnQtJyArIHV0aWxzLlRvS2ViYWJDYXNlKGV2ZW50LnR5cGUpO1xuICAgICAgICBpZiAoIXRhcmdldEVsZW1lbnQuaGFzQXR0cmlidXRlKGtlYmFiRXZlbnROYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRyaWdnZXJzID0gdGFyZ2V0RWxlbWVudC5nZXRBdHRyaWJ1dGUoa2ViYWJFdmVudE5hbWUpO1xuICAgICAgICBpZiAodHJpZ2dlcnMgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm5vdGlmaWVyICYmIHR5cGVvZiB0aGlzLm5vdGlmaWVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICB0aGlzLm5vdGlmaWVyKGV2ZW50LCB0cmlnZ2Vycy5zcGxpdCgnfCcpLCB0YXJnZXRFbGVtZW50KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBwYXRjaChjaGFuZ2UpIHtcbiAgICAgICAgdGhpcy5wYXRjaFdpdGgoY2hhbmdlLCBwYXRjaC5EZWZhdWx0Tm9kZURpY3RhdG9yLCBwYXRjaC5EZWZhdWx0SlNPTkRpY3RhdG9yLCBwYXRjaC5EZWZhdWx0SlNPTk1ha2VyKTtcbiAgICB9XG4gICAgcGF0Y2hXaXRoKGNoYW5nZSwgbm9kZURpY3RhdG9yLCBqc29uRGljdGF0b3IsIGpzb25NYWtlcikge1xuICAgICAgICBpZiAoY2hhbmdlIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudCkge1xuICAgICAgICAgICAgY29uc3QgZnJhZ21lbnQgPSBjaGFuZ2U7XG4gICAgICAgICAgICB0aGlzLnJlZ2lzdGVyTm9kZUV2ZW50cyhmcmFnbWVudCk7XG4gICAgICAgICAgICBwYXRjaC5QYXRjaERPTVRyZWUoZnJhZ21lbnQsIHRoaXMubW91bnROb2RlLCBub2RlRGljdGF0b3IsIGZhbHNlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGNoYW5nZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgICAgIG5vZGUuaW5uZXJIVE1MID0gY2hhbmdlLnRyaW0oKTtcbiAgICAgICAgICAgIHRoaXMucmVnaXN0ZXJOb2RlRXZlbnRzKG5vZGUpO1xuICAgICAgICAgICAgcGF0Y2guUGF0Y2hET01UcmVlKG5vZGUsIHRoaXMubW91bnROb2RlLCBub2RlRGljdGF0b3IsIGZhbHNlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXBhdGNoLmlzSlNPTk5vZGUoY2hhbmdlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5vZGUgPSBjaGFuZ2U7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJKU09OTm9kZUV2ZW50cyhub2RlKTtcbiAgICAgICAgcGF0Y2guUGF0Y2hKU09OTm9kZVRyZWUobm9kZSwgdGhpcy5tb3VudE5vZGUsIGpzb25EaWN0YXRvciwganNvbk1ha2VyKTtcbiAgICB9XG4gICAgcGF0Y2hMaXN0KGNoYW5nZXMpIHtcbiAgICAgICAgY2hhbmdlcy5mb3JFYWNoKHRoaXMucGF0Y2guYmluZCh0aGlzKSk7XG4gICAgfVxuICAgIHN0cmVhbShjaGFuZ2VzKSB7XG4gICAgICAgIGNvbnN0IG5vZGVzID0gSlNPTi5wYXJzZShjaGFuZ2VzKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuc3RyZWFtTGlzdChub2Rlcyk7XG4gICAgfVxuICAgIHN0cmVhbUxpc3QoY2hhbmdlcykge1xuICAgICAgICB0aGlzLnN0cmVhbUxpc3RXaXRoKGNoYW5nZXMsIHBhdGNoLkRlZmF1bHRKU09ORGljdGF0b3IsIHBhdGNoLkRlZmF1bHRKU09OTWFrZXIpO1xuICAgIH1cbiAgICBzdHJlYW1MaXN0V2l0aChjaGFuZ2VzLCBkaWN0YXRvciwgbWFrZXIpIHtcbiAgICAgICAgY2hhbmdlcy5mb3JFYWNoKHRoaXMucmVnaXN0ZXJKU09OTm9kZUV2ZW50cy5iaW5kKHRoaXMpKTtcbiAgICAgICAgcGF0Y2guU3RyZWFtSlNPTk5vZGVzKGNoYW5nZXMsIHRoaXMubW91bnROb2RlLCBwYXRjaC5EZWZhdWx0SlNPTkRpY3RhdG9yLCBwYXRjaC5EZWZhdWx0SlNPTk1ha2VyKTtcbiAgICB9XG4gICAgcmVnaXN0ZXJOb2RlRXZlbnRzKG4pIHtcbiAgICAgICAgY29uc3QgYmluZGVyID0gdGhpcztcbiAgICAgICAgZG9tLmFwcGx5RWFjaE5vZGUobiwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChub2RlLm5vZGVUeXBlICE9PSBkb20uRUxFTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgZWxlbSA9IG5vZGU7XG4gICAgICAgICAgICBjb25zdCBldmVudHMgPSBlbGVtLmdldEF0dHJpYnV0ZSgnZXZlbnRzJyk7XG4gICAgICAgICAgICBpZiAoZXZlbnRzKSB7XG4gICAgICAgICAgICAgICAgZXZlbnRzLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoZGVzYykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBldmVudE5hbWUgPSBkZXNjLnN1YnN0cigwLCBkZXNjLmxlbmd0aCAtIDMpO1xuICAgICAgICAgICAgICAgICAgICBiaW5kZXIucmVnaXN0ZXJFdmVudChldmVudE5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGRlc2Muc3Vic3RyKGRlc2MubGVuZ3RoIC0gMiwgZGVzYy5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICcwMSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICcxMCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbi5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgRE9NTW91bnQucHJldmVudERlZmF1bHQsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJzExJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBET01Nb3VudC5wcmV2ZW50RGVmYXVsdCwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZWdpc3RlckpTT05Ob2RlRXZlbnRzKG5vZGUpIHtcbiAgICAgICAgY29uc3QgYmluZGVyID0gdGhpcztcbiAgICAgICAgcGF0Y2guYXBwbHlKU09OTm9kZUZ1bmN0aW9uKG5vZGUsIGZ1bmN0aW9uIChuKSB7XG4gICAgICAgICAgICBpZiAobi5yZW1vdmVkKSB7XG4gICAgICAgICAgICAgICAgbi5ldmVudHMuZm9yRWFjaChmdW5jdGlvbiAoZGVzYykge1xuICAgICAgICAgICAgICAgICAgICBiaW5kZXIudW5yZWdpc3RlckV2ZW50KGRlc2MuTmFtZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbi5ldmVudHMuZm9yRWFjaChmdW5jdGlvbiAoZGVzYykge1xuICAgICAgICAgICAgICAgIGJpbmRlci5yZWdpc3RlckV2ZW50KGRlc2MuTmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHRleHRDb250ZW50KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb3VudE5vZGUudGV4dENvbnRlbnQ7XG4gICAgfVxuICAgIGlubmVySFRNTCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW91bnROb2RlLmlubmVySFRNTC50cmltKCk7XG4gICAgfVxuICAgIEh0bWwoKSB7XG4gICAgICAgIHJldHVybiBkb20udG9IVE1MKHRoaXMubW91bnROb2RlLCBmYWxzZSk7XG4gICAgfVxuICAgIHJlZ2lzdGVyRXZlbnQoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICh0aGlzLmV2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tb3VudE5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIHRoaXMuaGFuZGxlciwgdHJ1ZSk7XG4gICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gPSB0cnVlO1xuICAgIH1cbiAgICB1bnJlZ2lzdGVyRXZlbnQoZXZlbnROYW1lKSB7XG4gICAgICAgIGlmICghdGhpcy5ldmVudHNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubW91bnROb2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB0aGlzLmhhbmRsZXIsIHRydWUpO1xuICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gZmFsc2U7XG4gICAgfVxuICAgIHN0YXRpYyBwcmV2ZW50RGVmYXVsdChldmVudCkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH1cbiAgICBzdGF0aWMgc3RvcFByb3BhZ2F0aW9uKGV2ZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cbn1cbmV4cG9ydHMuRE9NTW91bnQgPSBET01Nb3VudDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1vdW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5QYXRjaERPTUF0dHJpYnV0ZXMgPSBleHBvcnRzLlBhdGNoRE9NVHJlZSA9IGV4cG9ydHMuUGF0Y2hKU09OQXR0cmlidXRlcyA9IGV4cG9ydHMuUGF0Y2hUZXh0Q29tbWVudFdpdGhKU09OID0gZXhwb3J0cy5BcHBseVN0cmVhbU5vZGUgPSBleHBvcnRzLlN0cmVhbUpTT05Ob2RlcyA9IGV4cG9ydHMuUGF0Y2hKU09OTm9kZSA9IGV4cG9ydHMuUGF0Y2hKU09OTm9kZVRyZWUgPSBleHBvcnRzLmpzb25NYWtlciA9IGV4cG9ydHMuRGVmYXVsdEpTT05NYWtlciA9IGV4cG9ydHMuZmluZEVsZW1lbnRQYXJlbnRieVJlZiA9IGV4cG9ydHMuZmluZEVsZW1lbnRieVJlZiA9IGV4cG9ydHMuZmluZEVsZW1lbnQgPSBleHBvcnRzLmlzSlNPTk5vZGUgPSBleHBvcnRzLmFwcGx5SlNPTk5vZGVLaWRzRnVuY3Rpb24gPSBleHBvcnRzLmFwcGx5SlNPTk5vZGVGdW5jdGlvbiA9IGV4cG9ydHMuSlNPTkV2ZW50ID0gZXhwb3J0cy5Ob2RlVG9KU09OTm9kZSA9IGV4cG9ydHMuVG9KU09OTm9kZSA9IGV4cG9ydHMuRGVmYXVsdEpTT05EaWN0YXRvciA9IGV4cG9ydHMuRGVmYXVsdE5vZGVEaWN0YXRvciA9IHZvaWQgMDtcbmNvbnN0IGRvbSA9IHJlcXVpcmUoXCIuL2RvbVwiKTtcbmNvbnN0IHV0aWxzID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5jb25zdCBleHRzID0gcmVxdWlyZShcIi4vZXh0ZW5zaW9uc1wiKTtcbmNvbnN0IGRvbV8xID0gcmVxdWlyZShcIi4vZG9tXCIpO1xuZXhwb3J0cy5EZWZhdWx0Tm9kZURpY3RhdG9yID0ge1xuICAgIFNhbWU6IChuLCBtKSA9PiB7XG4gICAgICAgIGNvbnN0IHNhbWVOb2RlID0gbi5ub2RlVHlwZSA9PT0gbS5ub2RlVHlwZSAmJiBuLm5vZGVOYW1lID09PSBtLm5vZGVOYW1lO1xuICAgICAgICBpZiAoIXNhbWVOb2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG4ubm9kZVR5cGUgIT09IGRvbS5FTEVNRU5UX05PREUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IG5FbGVtID0gbjtcbiAgICAgICAgY29uc3QgbUVsZW0gPSBtO1xuICAgICAgICByZXR1cm4gbkVsZW0uaWQgPT09IG1FbGVtLmlkO1xuICAgIH0sXG4gICAgQ2hhbmdlZDogKG4sIG0pID0+IHtcbiAgICAgICAgaWYgKG4ubm9kZVR5cGUgPT09IGRvbS5URVhUX05PREUgJiYgbS5ub2RlVHlwZSA9PT0gZG9tLlRFWFRfTk9ERSkge1xuICAgICAgICAgICAgcmV0dXJuIG4udGV4dENvbnRlbnQgPT09IG0udGV4dENvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG4ubm9kZVR5cGUgPT09IGRvbS5DT01NRU5UX05PREUgJiYgbS5ub2RlVHlwZSA9PT0gZG9tLkNPTU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgcmV0dXJuIG4udGV4dENvbnRlbnQgPT09IG0udGV4dENvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbkVsZW0gPSBuO1xuICAgICAgICBjb25zdCBtRWxlbSA9IG07XG4gICAgICAgIGNvbnN0IG5BdHRyID0gZG9tLnJlY29yZEF0dHJpYnV0ZXMobkVsZW0pO1xuICAgICAgICBjb25zdCBtQXR0ciA9IGRvbS5yZWNvcmRBdHRyaWJ1dGVzKG1FbGVtKTtcbiAgICAgICAgaWYgKCFuQXR0ci5oYXNPd25Qcm9wZXJ0eSgnX3RpZCcpICYmIG1BdHRyLmhhc093blByb3BlcnR5KCdfdGlkJykpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuQXR0ci5oYXNPd25Qcm9wZXJ0eSgnX2F0aWQnKSkge1xuICAgICAgICAgICAgcmV0dXJuICEobUF0dHIuX2F0aWQgPT09IG5BdHRyLl90aWQgJiYgbUF0dHIuX3RpZCA9PT0gbUF0dHIuX2F0aWQpO1xuICAgICAgICB9XG4gICAgICAgIGRlbGV0ZSBtQXR0clsnX2F0aWQnXTtcbiAgICAgICAgZGVsZXRlIG5BdHRyWydfYXRpZCddO1xuICAgICAgICBkZWxldGUgbUF0dHJbJ190aWQnXTtcbiAgICAgICAgZGVsZXRlIG5BdHRyWydfdGlkJ107XG4gICAgICAgIGZvciAobGV0IGtleSBpbiBtQXR0cikge1xuICAgICAgICAgICAgaWYgKCFuQXR0ci5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobUF0dHJba2V5XSAhPT0gbkF0dHJba2V5XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuRWxlbS5pbm5lckhUTUwgIT09IG1FbGVtLmlubmVySFRNTDtcbiAgICB9LFxufTtcbmV4cG9ydHMuRGVmYXVsdEpTT05EaWN0YXRvciA9IHtcbiAgICBTYW1lOiAobiwgbSkgPT4ge1xuICAgICAgICBjb25zdCBzYW1lTm9kZSA9IG4ubm9kZVR5cGUgPT09IG0udHlwZSAmJiBuLm5vZGVOYW1lID09PSBtLm5hbWU7XG4gICAgICAgIGlmICghc2FtZU5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobi5ub2RlVHlwZSAhPT0gZG9tLkVMRU1FTlRfTk9ERSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbkVsZW0gPSBuO1xuICAgICAgICByZXR1cm4gbkVsZW0uaWQgPT09IG0uaWQ7XG4gICAgfSxcbiAgICBDaGFuZ2VkOiAobiwgbSkgPT4ge1xuICAgICAgICBpZiAobi5ub2RlVHlwZSA9PT0gZG9tLlRFWFRfTk9ERSAmJiBtLnR5cGUgPT09IGRvbS5URVhUX05PREUpIHtcbiAgICAgICAgICAgIHJldHVybiBuLnRleHRDb250ZW50ICE9PSBtLmNvbnRlbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG4ubm9kZVR5cGUgPT09IGRvbS5DT01NRU5UX05PREUgJiYgbS50eXBlID09PSBkb20uQ09NTUVOVF9OT0RFKSB7XG4gICAgICAgICAgICByZXR1cm4gbi50ZXh0Q29udGVudCAhPT0gbS5jb250ZW50O1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHRub2RlID0gbjtcbiAgICAgICAgaWYgKHRub2RlLmhhc0F0dHJpYnV0ZSgnaWQnKSkge1xuICAgICAgICAgICAgY29uc3QgaWQgPSB0bm9kZS5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgICAgICAgICBpZiAoaWQgIT09IG0uaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodG5vZGUuaGFzQXR0cmlidXRlKCdfcmVmJykpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlZiA9IHRub2RlLmdldEF0dHJpYnV0ZSgnX3JlZicpO1xuICAgICAgICAgICAgaWYgKHJlZiAhPT0gbS5yZWYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0aWQgPSB0bm9kZS5nZXRBdHRyaWJ1dGUoJ190aWQnKTtcbiAgICAgICAgY29uc3QgYXRpZCA9IHRub2RlLmdldEF0dHJpYnV0ZSgnX2F0aWQnKTtcbiAgICAgICAgaWYgKHRub2RlLmhhc0F0dHJpYnV0ZSgnX3RpZCcpKSB7XG4gICAgICAgICAgICBpZiAodGlkICE9PSBtLnRpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRub2RlLmhhc0F0dHJpYnV0ZSgnX2F0aWQnKSkge1xuICAgICAgICAgICAgICAgIGlmICh0aWQgIT09IG0udGlkICYmIGF0aWQgIT09IG0uYXRpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHRpZCAhPT0gbS50aWQgJiYgYXRpZCA9PT0gbS5hdGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRub2RlLmhhc0F0dHJpYnV0ZSgnZXZlbnRzJykgJiYgbS5ldmVudHMubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgbS5ldmVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICBsZXQgZXZlbnQgPSBtLmV2ZW50c1tpbmRleF07XG4gICAgICAgICAgICBsZXQgYXR0ck5hbWUgPSAnZXZlbnQtJyArIGV2ZW50Lk5hbWU7XG4gICAgICAgICAgICBsZXQgYXR0clZhbHVlID0gZXZlbnQuVGFyZ2V0cy5qb2luKCd8Jyk7XG4gICAgICAgICAgICBsZXQgbm9kZUF0dHIgPSB0bm9kZS5hdHRyaWJ1dGVzLmdldE5hbWVkSXRlbShhdHRyTmFtZSk7XG4gICAgICAgICAgICBpZiAobm9kZUF0dHIgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5vZGVBdHRyLnZhbHVlICE9IGF0dHJWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sXG59O1xuZnVuY3Rpb24gVG9KU09OTm9kZShub2RlLCBzaGFsbG93LCBwYXJlbnROb2RlKSB7XG4gICAgY29uc3QgbGlzdCA9IG5ldyBBcnJheSgpO1xuICAgIGlmICh0eXBlb2Ygbm9kZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY29uc3QgcHViID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICAgIHB1Yi5pbm5lckhUTUwgPSBub2RlLnRyaW0oKTtcbiAgICAgICAgZG9tLmFwcGx5Q2hpbGROb2RlKHB1YiwgZnVuY3Rpb24gKGNoaWxkKSB7XG4gICAgICAgICAgICBsaXN0LnB1c2goTm9kZVRvSlNPTk5vZGUoY2hpbGQsIHNoYWxsb3csIHBhcmVudE5vZGUpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBsaXN0O1xuICAgIH1cbiAgICBsaXN0LnB1c2goTm9kZVRvSlNPTk5vZGUobm9kZSwgc2hhbGxvdywgcGFyZW50Tm9kZSkpO1xuICAgIHJldHVybiBsaXN0O1xufVxuZXhwb3J0cy5Ub0pTT05Ob2RlID0gVG9KU09OTm9kZTtcbmZ1bmN0aW9uIE5vZGVUb0pTT05Ob2RlKG5vZGUsIHNoYWxsb3csIHBhcmVudE5vZGUpIHtcbiAgICBjb25zdCBqbm9kZSA9IHt9O1xuICAgIGpub2RlLmNoaWxkcmVuID0gW107XG4gICAgam5vZGUuZXZlbnRzID0gW107XG4gICAgam5vZGUuYXR0cnMgPSBbXTtcbiAgICBqbm9kZS5uYW1lc3BhY2UgPSAnJztcbiAgICBqbm9kZS50eXBlID0gbm9kZS5ub2RlVHlwZTtcbiAgICBqbm9kZS5uYW1lID0gbm9kZS5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIGpub2RlLmlkID0gZXh0cy5PYmplY3RzLkdldEF0dHJXaXRoKG5vZGUsICdfaWQnKTtcbiAgICBqbm9kZS50aWQgPSBleHRzLk9iamVjdHMuR2V0QXR0cldpdGgobm9kZSwgJ190aWQnKTtcbiAgICBqbm9kZS5yZWYgPSBleHRzLk9iamVjdHMuR2V0QXR0cldpdGgobm9kZSwgJ19yZWYnKTtcbiAgICBqbm9kZS5hdGlkID0gZXh0cy5PYmplY3RzLkdldEF0dHJXaXRoKG5vZGUsICdfYXRpZCcpO1xuICAgIGNvbnN0IGVsZW0gPSBub2RlO1xuICAgIGlmIChlbGVtID09PSBudWxsKVxuICAgICAgICByZXR1cm4gam5vZGU7XG4gICAgaWYgKG5vZGUuX3RpZCkge1xuICAgICAgICBqbm9kZS50aWQgPSBub2RlLl90aWQ7XG4gICAgfVxuICAgIHN3aXRjaCAobm9kZS5ub2RlVHlwZSkge1xuICAgICAgICBjYXNlIGRvbV8xLlRFWFRfTk9ERTpcbiAgICAgICAgICAgIGpub2RlLnR5cGVOYW1lID0gJ1RleHQnO1xuICAgICAgICAgICAgam5vZGUuY29udGVudCA9IG5vZGUudGV4dENvbnRlbnQ7XG4gICAgICAgICAgICByZXR1cm4gam5vZGU7XG4gICAgICAgIGNhc2UgZG9tXzEuQ09NTUVOVF9OT0RFOlxuICAgICAgICAgICAgam5vZGUudHlwZU5hbWUgPSAnQ29tbWVudCc7XG4gICAgICAgICAgICBqbm9kZS5jb250ZW50ID0gbm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgICAgIHJldHVybiBqbm9kZTtcbiAgICAgICAgY2FzZSBkb21fMS5FTEVNRU5UX05PREU6XG4gICAgICAgICAgICBqbm9kZS50eXBlTmFtZSA9ICdFbGVtZW50JztcbiAgICAgICAgICAgIGpub2RlLmNoaWxkcmVuID0gbmV3IEFycmF5KCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5hYmxlIHRvIGhhbmRsZSBub2RlIHR5cGUgJHtub2RlLm5vZGVUeXBlfWApO1xuICAgIH1cbiAgICBpZiAoZXh0cy5PYmplY3RzLmlzTnVsbE9yVW5kZWZpbmVkKGVsZW0pKSB7XG4gICAgICAgIGlmIChqbm9kZS5pZCA9PT0gJycpIHtcbiAgICAgICAgICAgIGpub2RlLmlkID0gdXRpbHMuUmFuZG9tSUQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gam5vZGU7XG4gICAgfVxuICAgIGlmIChlbGVtLmhhc0F0dHJpYnV0ZSgnaWQnKSkge1xuICAgICAgICBqbm9kZS5pZCA9IGVsZW0uZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgam5vZGUuaWQgPSB1dGlscy5SYW5kb21JRCgpO1xuICAgIH1cbiAgICBpZiAoam5vZGUucmVmID09PSAnJyAmJiAhZXh0cy5PYmplY3RzLmlzTnVsbE9yVW5kZWZpbmVkKHBhcmVudE5vZGUpKSB7XG4gICAgICAgIGpub2RlLnJlZiA9IGpub2RlLmlkO1xuICAgIH1cbiAgICBpZiAoZWxlbS5oYXNBdHRyaWJ1dGUoJ19yZWYnKSkge1xuICAgICAgICBqbm9kZS5yZWYgPSBlbGVtLmdldEF0dHJpYnV0ZSgnX3JlZicpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKCFleHRzLk9iamVjdHMuaXNOdWxsT3JVbmRlZmluZWQocGFyZW50Tm9kZSkpIHtcbiAgICAgICAgICAgIGlmIChwYXJlbnROb2RlLnJlZiAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICBqbm9kZS5yZWYgPSBwYXJlbnROb2RlLnJlZiArICcvJyArIGpub2RlLmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgam5vZGUucmVmID0gcGFyZW50Tm9kZS5pZCArICcvJyArIGpub2RlLmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChlbGVtLmhhc0F0dHJpYnV0ZSgnX3RpZCcpKSB7XG4gICAgICAgIGpub2RlLnRpZCA9IGVsZW0uZ2V0QXR0cmlidXRlKCdfdGlkJyk7XG4gICAgfVxuICAgIGlmIChlbGVtLmhhc0F0dHJpYnV0ZSgnX2F0aWQnKSkge1xuICAgICAgICBqbm9kZS5hdGlkID0gZWxlbS5nZXRBdHRyaWJ1dGUoJ19hdGlkJyk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZWxlbS5hdHRyaWJ1dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBhdHRyID0gZWxlbS5hdHRyaWJ1dGVzLml0ZW0oaSk7XG4gICAgICAgIGlmIChhdHRyID09IG51bGwpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgaWYgKCFhdHRyLm5hbWUuc3RhcnRzV2l0aCgnZXZlbnQtJykpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGxldCBldmVudE5hbWUgPSBhdHRyLm5hbWUucmVwbGFjZSgnZXZlbnQtJywgJycpO1xuICAgICAgICBqbm9kZS5ldmVudHMucHVzaChKU09ORXZlbnQoZXZlbnROYW1lLCBhdHRyLnZhbHVlLnNwbGl0KCd8JykpKTtcbiAgICB9XG4gICAgaWYgKCFzaGFsbG93KSB7XG4gICAgICAgIGRvbS5hcHBseUNoaWxkTm9kZShub2RlLCBmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgICAgIGlmIChjaGlsZCBpbnN0YW5jZW9mIFRleHQgfHwgY2hpbGQgaW5zdGFuY2VvZiBDb21tZW50KSB7XG4gICAgICAgICAgICAgICAgam5vZGUuY2hpbGRyZW4ucHVzaChOb2RlVG9KU09OTm9kZShjaGlsZCwgZmFsc2UsIGpub2RlKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgY2hpbGRFbGVtID0gY2hpbGQ7XG4gICAgICAgICAgICBpZiAoIWNoaWxkRWxlbS5oYXNBdHRyaWJ1dGUoJ2lkJykpIHtcbiAgICAgICAgICAgICAgICBjaGlsZEVsZW0uaWQgPSB1dGlscy5SYW5kb21JRCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgam5vZGUuY2hpbGRyZW4ucHVzaChOb2RlVG9KU09OTm9kZShjaGlsZEVsZW0sIGZhbHNlLCBqbm9kZSkpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGpub2RlO1xufVxuZXhwb3J0cy5Ob2RlVG9KU09OTm9kZSA9IE5vZGVUb0pTT05Ob2RlO1xuZnVuY3Rpb24gSlNPTkV2ZW50KG5hbWUsIHRhcmdldHMpIHtcbiAgICBjb25zdCBldmVudCA9IHt9O1xuICAgIGV2ZW50Lk5hbWUgPSBuYW1lO1xuICAgIGV2ZW50LlRhcmdldHMgPSB0YXJnZXRzO1xuICAgIHJldHVybiBldmVudDtcbn1cbmV4cG9ydHMuSlNPTkV2ZW50ID0gSlNPTkV2ZW50O1xuZnVuY3Rpb24gYXBwbHlKU09OTm9kZUZ1bmN0aW9uKG5vZGUsIGZuKSB7XG4gICAgZm4obm9kZSk7XG4gICAgbm9kZS5jaGlsZHJlbi5mb3JFYWNoKGZ1bmN0aW9uIChjaGlsZCkge1xuICAgICAgICBhcHBseUpTT05Ob2RlRnVuY3Rpb24oY2hpbGQsIGZuKTtcbiAgICB9KTtcbn1cbmV4cG9ydHMuYXBwbHlKU09OTm9kZUZ1bmN0aW9uID0gYXBwbHlKU09OTm9kZUZ1bmN0aW9uO1xuZnVuY3Rpb24gYXBwbHlKU09OTm9kZUtpZHNGdW5jdGlvbihub2RlLCBmbikge1xuICAgIG5vZGUuY2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbiAoY2hpbGQpIHtcbiAgICAgICAgYXBwbHlKU09OTm9kZUZ1bmN0aW9uKGNoaWxkLCBmbik7XG4gICAgfSk7XG4gICAgZm4obm9kZSk7XG59XG5leHBvcnRzLmFwcGx5SlNPTk5vZGVLaWRzRnVuY3Rpb24gPSBhcHBseUpTT05Ob2RlS2lkc0Z1bmN0aW9uO1xuZnVuY3Rpb24gaXNKU09OTm9kZShuKSB7XG4gICAgY29uc3QgaGFzSUQgPSB0eXBlb2Ygbi5pZCAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgY29uc3QgaGFzUmVmID0gdHlwZW9mIG4ucmVmICE9PSAndW5kZWZpbmVkJztcbiAgICBjb25zdCBoYXNUaWQgPSB0eXBlb2Ygbi50aWQgIT09ICd1bmRlZmluZWQnO1xuICAgIGNvbnN0IGhhc1R5cGVOYW1lID0gdHlwZW9mIG4udHlwZU5hbWUgIT09ICd1bmRlZmluZWQnO1xuICAgIHJldHVybiBoYXNJRCAmJiBoYXNSZWYgJiYgaGFzVHlwZU5hbWUgJiYgaGFzVGlkO1xufVxuZXhwb3J0cy5pc0pTT05Ob2RlID0gaXNKU09OTm9kZTtcbmZ1bmN0aW9uIGZpbmRFbGVtZW50KGRlc2MsIHBhcmVudCkge1xuICAgIGNvbnN0IHNlbGVjdG9yID0gZGVzYy5uYW1lICsgJyMnICsgZGVzYy5pZDtcbiAgICBjb25zdCB0YXJnZXRzID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgIGlmICh0YXJnZXRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBsZXQgYXR0clNlbGVjdG9yID0gZGVzYy5uYW1lICsgYFtfdGlkPScke2Rlc2MudGlkfSddYDtcbiAgICAgICAgbGV0IHRhcmdldCA9IHBhcmVudC5xdWVyeVNlbGVjdG9yKGF0dHJTZWxlY3Rvcik7XG4gICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgICAgIH1cbiAgICAgICAgYXR0clNlbGVjdG9yID0gZGVzYy5uYW1lICsgYFtfYXRpZD0nJHtkZXNjLmF0aWR9J11gO1xuICAgICAgICB0YXJnZXQgPSBwYXJlbnQucXVlcnlTZWxlY3RvcihhdHRyU2VsZWN0b3IpO1xuICAgICAgICBpZiAodGFyZ2V0KSB7XG4gICAgICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgICB9XG4gICAgICAgIGF0dHJTZWxlY3RvciA9IGRlc2MubmFtZSArIGBbX3JlZj0nJHtkZXNjLnJlZn0nXWA7XG4gICAgICAgIHJldHVybiBwYXJlbnQucXVlcnlTZWxlY3RvcihhdHRyU2VsZWN0b3IpO1xuICAgIH1cbiAgICBpZiAodGFyZ2V0cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHRhcmdldHNbMF07XG4gICAgfVxuICAgIGNvbnN0IHRvdGFsID0gdGFyZ2V0cy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGVsZW0gPSB0YXJnZXRzLml0ZW0oaSk7XG4gICAgICAgIGlmIChlbGVtLmdldEF0dHJpYnV0ZSgnX3RpZCcpID09PSBkZXNjLnRpZCkge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsZW0uZ2V0QXR0cmlidXRlKCdfYXRpZCcpID09PSBkZXNjLmF0aWQpIHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlbGVtLmdldEF0dHJpYnV0ZSgnX3JlZicpID09PSBkZXNjLnJlZikge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5leHBvcnRzLmZpbmRFbGVtZW50ID0gZmluZEVsZW1lbnQ7XG5mdW5jdGlvbiBmaW5kRWxlbWVudGJ5UmVmKHJlZiwgcGFyZW50KSB7XG4gICAgY29uc3QgaWRzID0gcmVmLnNwbGl0KCcvJykubWFwKGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgIGlmIChlbGVtLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyMnICsgZWxlbTtcbiAgICB9KTtcbiAgICBpZiAoaWRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgaWYgKGlkc1swXSA9PT0gJycgfHwgaWRzWzBdLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgICAgaWRzLnNoaWZ0KCk7XG4gICAgfVxuICAgIGNvbnN0IGZpcnN0ID0gaWRzWzBdO1xuICAgIGlmIChwYXJlbnQuaWQgPT0gZmlyc3Quc3Vic3RyKDEpKSB7XG4gICAgICAgIGlkcy5zaGlmdCgpO1xuICAgIH1cbiAgICBsZXQgY3VyID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3IoaWRzLnNoaWZ0KCkpO1xuICAgIHdoaWxlIChjdXIpIHtcbiAgICAgICAgaWYgKGlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBjdXI7XG4gICAgICAgIH1cbiAgICAgICAgY3VyID0gY3VyLnF1ZXJ5U2VsZWN0b3IoaWRzLnNoaWZ0KCkpO1xuICAgIH1cbiAgICByZXR1cm4gY3VyO1xufVxuZXhwb3J0cy5maW5kRWxlbWVudGJ5UmVmID0gZmluZEVsZW1lbnRieVJlZjtcbmZ1bmN0aW9uIGZpbmRFbGVtZW50UGFyZW50YnlSZWYocmVmLCBwYXJlbnQpIHtcbiAgICBjb25zdCBpZHMgPSByZWYuc3BsaXQoJy8nKS5tYXAoZnVuY3Rpb24gKGVsZW0pIHtcbiAgICAgICAgaWYgKGVsZW0udHJpbSgpID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnIycgKyBlbGVtO1xuICAgIH0pO1xuICAgIGlmIChpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAoaWRzWzBdID09PSAnJyB8fCBpZHNbMF0udHJpbSgpID09PSAnJykge1xuICAgICAgICBpZHMuc2hpZnQoKTtcbiAgICB9XG4gICAgaWRzLnBvcCgpO1xuICAgIGNvbnN0IGZpcnN0ID0gaWRzWzBdO1xuICAgIGlmIChwYXJlbnQuaWQgPT0gZmlyc3Quc3Vic3RyKDEpKSB7XG4gICAgICAgIGlkcy5zaGlmdCgpO1xuICAgIH1cbiAgICBsZXQgY3VyID0gcGFyZW50LnF1ZXJ5U2VsZWN0b3IoaWRzLnNoaWZ0KCkpO1xuICAgIHdoaWxlIChjdXIpIHtcbiAgICAgICAgaWYgKGlkcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBjdXI7XG4gICAgICAgIH1cbiAgICAgICAgY3VyID0gY3VyLnF1ZXJ5U2VsZWN0b3IoaWRzLnNoaWZ0KCkpO1xuICAgIH1cbiAgICByZXR1cm4gY3VyO1xufVxuZXhwb3J0cy5maW5kRWxlbWVudFBhcmVudGJ5UmVmID0gZmluZEVsZW1lbnRQYXJlbnRieVJlZjtcbmV4cG9ydHMuRGVmYXVsdEpTT05NYWtlciA9IHtcbiAgICBNYWtlOiBqc29uTWFrZXIsXG59O1xuZnVuY3Rpb24ganNvbk1ha2VyKGRvYywgZGVzY05vZGUsIHNoYWxsb3csIHNraXBSZW1vdmVkKSB7XG4gICAgaWYgKGRlc2NOb2RlLnR5cGUgPT09IGRvbV8xLkNPTU1FTlRfTk9ERSkge1xuICAgICAgICBjb25zdCBub2RlID0gZG9jLmNyZWF0ZUNvbW1lbnQoZGVzY05vZGUuY29udGVudCk7XG4gICAgICAgIGV4dHMuT2JqZWN0cy5QYXRjaFdpdGgobm9kZSwgJ19pZCcsIGRlc2NOb2RlLmlkKTtcbiAgICAgICAgZXh0cy5PYmplY3RzLlBhdGNoV2l0aChub2RlLCAnX3JlZicsIGRlc2NOb2RlLnJlZik7XG4gICAgICAgIGV4dHMuT2JqZWN0cy5QYXRjaFdpdGgobm9kZSwgJ190aWQnLCBkZXNjTm9kZS50aWQpO1xuICAgICAgICBleHRzLk9iamVjdHMuUGF0Y2hXaXRoKG5vZGUsICdfYXRpZCcsIGRlc2NOb2RlLmF0aWQpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gICAgaWYgKGRlc2NOb2RlLnR5cGUgPT09IGRvbV8xLlRFWFRfTk9ERSkge1xuICAgICAgICBjb25zdCBub2RlID0gZG9jLmNyZWF0ZVRleHROb2RlKGRlc2NOb2RlLmNvbnRlbnQpO1xuICAgICAgICBleHRzLk9iamVjdHMuUGF0Y2hXaXRoKG5vZGUsICdfaWQnLCBkZXNjTm9kZS5pZCk7XG4gICAgICAgIGV4dHMuT2JqZWN0cy5QYXRjaFdpdGgobm9kZSwgJ19yZWYnLCBkZXNjTm9kZS5yZWYpO1xuICAgICAgICBleHRzLk9iamVjdHMuUGF0Y2hXaXRoKG5vZGUsICdfdGlkJywgZGVzY05vZGUudGlkKTtcbiAgICAgICAgZXh0cy5PYmplY3RzLlBhdGNoV2l0aChub2RlLCAnX2F0aWQnLCBkZXNjTm9kZS5hdGlkKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICAgIGlmIChkZXNjTm9kZS5pZCA9PT0gJycpIHtcbiAgICAgICAgZGVzY05vZGUuaWQgPSB1dGlscy5SYW5kb21JRCgpO1xuICAgIH1cbiAgICBsZXQgbm9kZTtcbiAgICBpZiAoZGVzY05vZGUubmFtZXNwYWNlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICBub2RlID0gZG9jLmNyZWF0ZUVsZW1lbnQoZGVzY05vZGUubmFtZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBub2RlID0gZG9jLmNyZWF0ZUVsZW1lbnROUyhkZXNjTm9kZS5uYW1lc3BhY2UsIGRlc2NOb2RlLm5hbWUpO1xuICAgIH1cbiAgICBleHRzLk9iamVjdHMuUGF0Y2hXaXRoKG5vZGUsICdfaWQnLCBkZXNjTm9kZS5pZCk7XG4gICAgZXh0cy5PYmplY3RzLlBhdGNoV2l0aChub2RlLCAnX3JlZicsIGRlc2NOb2RlLnJlZik7XG4gICAgZXh0cy5PYmplY3RzLlBhdGNoV2l0aChub2RlLCAnX3RpZCcsIGRlc2NOb2RlLnRpZCk7XG4gICAgZXh0cy5PYmplY3RzLlBhdGNoV2l0aChub2RlLCAnX2F0aWQnLCBkZXNjTm9kZS5hdGlkKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZSgnaWQnLCBkZXNjTm9kZS5pZCk7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ190aWQnLCBkZXNjTm9kZS50aWQpO1xuICAgIG5vZGUuc2V0QXR0cmlidXRlKCdfcmVmJywgZGVzY05vZGUucmVmKTtcbiAgICBub2RlLnNldEF0dHJpYnV0ZSgnX2F0aWQnLCBkZXNjTm9kZS5hdGlkKTtcbiAgICBkZXNjTm9kZS5ldmVudHMuZm9yRWFjaChmdW5jdGlvbiBldmVudHMoZXZlbnQpIHtcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ2V2ZW50LScgKyBldmVudC5OYW1lLCBldmVudC5UYXJnZXRzLmpvaW4oJ3wnKSk7XG4gICAgfSk7XG4gICAgZGVzY05vZGUuYXR0cnMuZm9yRWFjaChmdW5jdGlvbiBhdHRycyhhdHRyKSB7XG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKGF0dHIuS2V5LCBhdHRyLlZhbHVlKTtcbiAgICB9KTtcbiAgICBpZiAoZGVzY05vZGUucmVtb3ZlZCkge1xuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZSgnX3JlbW92ZWQnLCAndHJ1ZScpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG4gICAgaWYgKCFzaGFsbG93KSB7XG4gICAgICAgIGRlc2NOb2RlLmNoaWxkcmVuLmZvckVhY2goZnVuY3Rpb24gKGtpZEpTT04pIHtcbiAgICAgICAgICAgIGlmIChza2lwUmVtb3ZlZCAmJiBraWRKU09OLnJlbW92ZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKGpzb25NYWtlcihkb2MsIGtpZEpTT04sIHNoYWxsb3csIHNraXBSZW1vdmVkKSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbn1cbmV4cG9ydHMuanNvbk1ha2VyID0ganNvbk1ha2VyO1xuZnVuY3Rpb24gUGF0Y2hKU09OTm9kZVRyZWUoZnJhZ21lbnQsIG1vdW50LCBkaWN0YXRvciwgbWFrZXIpIHtcbiAgICBsZXQgdGFyZ2V0Tm9kZSA9IGZpbmRFbGVtZW50KGZyYWdtZW50LCBtb3VudCk7XG4gICAgaWYgKGV4dHMuT2JqZWN0cy5pc051bGxPclVuZGVmaW5lZCh0YXJnZXROb2RlKSkge1xuICAgICAgICBjb25zdCB0Tm9kZSA9IG1ha2VyLk1ha2UoZG9jdW1lbnQsIGZyYWdtZW50LCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgIG1vdW50LmFwcGVuZENoaWxkKHROb2RlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBQYXRjaEpTT05Ob2RlKGZyYWdtZW50LCB0YXJnZXROb2RlLCBkaWN0YXRvciwgbWFrZXIpO1xufVxuZXhwb3J0cy5QYXRjaEpTT05Ob2RlVHJlZSA9IFBhdGNoSlNPTk5vZGVUcmVlO1xuZnVuY3Rpb24gUGF0Y2hKU09OTm9kZShmcmFnbWVudCwgdGFyZ2V0Tm9kZSwgZGljdGF0b3IsIG1ha2VyKSB7XG4gICAgaWYgKCFkaWN0YXRvci5TYW1lKHRhcmdldE5vZGUsIGZyYWdtZW50KSkge1xuICAgICAgICBjb25zdCB0Tm9kZSA9IG1ha2VyLk1ha2UoZG9jdW1lbnQsIGZyYWdtZW50LCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgIGRvbS5yZXBsYWNlTm9kZSh0YXJnZXROb2RlLnBhcmVudE5vZGUsIHRhcmdldE5vZGUsIHROb2RlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIWRpY3RhdG9yLkNoYW5nZWQodGFyZ2V0Tm9kZSwgZnJhZ21lbnQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgUGF0Y2hKU09OQXR0cmlidXRlcyhmcmFnbWVudCwgdGFyZ2V0Tm9kZSk7XG4gICAgY29uc3Qga2lkcyA9IGRvbS5ub2RlTGlzdFRvQXJyYXkodGFyZ2V0Tm9kZS5jaGlsZE5vZGVzKTtcbiAgICBjb25zdCB0b3RhbEtpZHMgPSBraWRzLmxlbmd0aDtcbiAgICBjb25zdCBmcmFnbWVudEtpZHMgPSBmcmFnbWVudC5jaGlsZHJlbi5sZW5ndGg7XG4gICAgbGV0IGkgPSAwO1xuICAgIGZvciAoOyBpIDwgdG90YWxLaWRzOyBpKyspIHtcbiAgICAgICAgY29uc3QgY2hpbGROb2RlID0ga2lkc1tpXTtcbiAgICAgICAgaWYgKGkgPj0gZnJhZ21lbnRLaWRzKSB7XG4gICAgICAgICAgICBjb25zdCBjaG5vZGUgPSBjaGlsZE5vZGU7XG4gICAgICAgICAgICBpZiAoY2hub2RlKSB7XG4gICAgICAgICAgICAgICAgY2hub2RlLnJlbW92ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY2hpbGRGcmFnbWVudCA9IGZyYWdtZW50LmNoaWxkcmVuW2ldO1xuICAgICAgICBQYXRjaEpTT05Ob2RlKGNoaWxkRnJhZ21lbnQsIGNoaWxkTm9kZSwgZGljdGF0b3IsIG1ha2VyKTtcbiAgICB9XG4gICAgZm9yICg7IGkgPCBmcmFnbWVudEtpZHM7IGkrKykge1xuICAgICAgICBjb25zdCB0Tm9kZSA9IG1ha2VyLk1ha2UoZG9jdW1lbnQsIGZyYWdtZW50LCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgIHRhcmdldE5vZGUuYXBwZW5kQ2hpbGQodE5vZGUpO1xuICAgIH1cbiAgICByZXR1cm47XG59XG5leHBvcnRzLlBhdGNoSlNPTk5vZGUgPSBQYXRjaEpTT05Ob2RlO1xuZnVuY3Rpb24gU3RyZWFtSlNPTk5vZGVzKGZyYWdtZW50LCBtb3VudCwgZGljdGF0b3IsIG1ha2VyKSB7XG4gICAgY29uc3QgY2hhbmdlcyA9IGZyYWdtZW50LmZpbHRlcihmdW5jdGlvbiAoZWxlbSkge1xuICAgICAgICByZXR1cm4gIWVsZW0ucmVtb3ZlZDtcbiAgICB9KTtcbiAgICBmcmFnbWVudFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChlbGVtKSB7XG4gICAgICAgIGlmICghZWxlbS5yZW1vdmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGZpbHRlcmVkID0gdHJ1ZTtcbiAgICAgICAgY2hhbmdlcy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgaWYgKGVsZW0udGlkID09PSBlbC50aWQgfHwgZWxlbS50aWQgPT0gZWwuYXRpZCB8fCBlbGVtLnJlZiA9PT0gZWwucmVmKSB7XG4gICAgICAgICAgICAgICAgZmlsdGVyZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9KVxuICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAocmVtb3ZhbCkge1xuICAgICAgICBjb25zdCB0YXJnZXQgPSBmaW5kRWxlbWVudChyZW1vdmFsLCBtb3VudCk7XG4gICAgICAgIGlmICh0YXJnZXQpIHtcbiAgICAgICAgICAgIHRhcmdldC5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIGNoYW5nZXMuZm9yRWFjaChmdW5jdGlvbiAoY2hhbmdlKSB7XG4gICAgICAgIGNvbnN0IHRhcmdldE5vZGUgPSBmaW5kRWxlbWVudChjaGFuZ2UsIG1vdW50KTtcbiAgICAgICAgaWYgKGV4dHMuT2JqZWN0cy5pc051bGxPclVuZGVmaW5lZCh0YXJnZXROb2RlKSkge1xuICAgICAgICAgICAgY29uc3QgdGFyZ2V0Tm9kZVBhcmVudCA9IGZpbmRFbGVtZW50UGFyZW50YnlSZWYoY2hhbmdlLnJlZiwgbW91bnQpO1xuICAgICAgICAgICAgaWYgKGV4dHMuT2JqZWN0cy5pc051bGxPclVuZGVmaW5lZCh0YXJnZXROb2RlUGFyZW50KSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdVbmFibGUgdG8gYXBwbHkgbmV3IGNoYW5nZSBzdHJlYW06ICcsIGNoYW5nZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdE5vZGUgPSBtYWtlci5NYWtlKGRvY3VtZW50LCBjaGFuZ2UsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgIHRhcmdldE5vZGVQYXJlbnQuYXBwZW5kQ2hpbGQodE5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIEFwcGx5U3RyZWFtTm9kZShjaGFuZ2UsIHRhcmdldE5vZGUsIGRpY3RhdG9yLCBtYWtlcik7XG4gICAgfSk7XG4gICAgcmV0dXJuO1xufVxuZXhwb3J0cy5TdHJlYW1KU09OTm9kZXMgPSBTdHJlYW1KU09OTm9kZXM7XG5mdW5jdGlvbiBBcHBseVN0cmVhbU5vZGUoZnJhZ21lbnQsIHRhcmdldE5vZGUsIGRpY3RhdG9yLCBtYWtlcikge1xuICAgIGlmICghZGljdGF0b3IuU2FtZSh0YXJnZXROb2RlLCBmcmFnbWVudCkpIHtcbiAgICAgICAgY29uc3QgdE5vZGUgPSBtYWtlci5NYWtlKGRvY3VtZW50LCBmcmFnbWVudCwgZmFsc2UsIHRydWUpO1xuICAgICAgICBkb20ucmVwbGFjZU5vZGUodGFyZ2V0Tm9kZS5wYXJlbnROb2RlLCB0YXJnZXROb2RlLCB0Tm9kZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGRpY3RhdG9yLkNoYW5nZWQodGFyZ2V0Tm9kZSwgZnJhZ21lbnQpKSB7XG4gICAgICAgIFBhdGNoSlNPTkF0dHJpYnV0ZXMoZnJhZ21lbnQsIHRhcmdldE5vZGUpO1xuICAgIH1cbiAgICBjb25zdCB0b3RhbEtpZHMgPSB0YXJnZXROb2RlLmNoaWxkTm9kZXMubGVuZ3RoO1xuICAgIGNvbnN0IGZyYWdtZW50S2lkcyA9IGZyYWdtZW50LmNoaWxkcmVuLmxlbmd0aDtcbiAgICBsZXQgaSA9IDA7XG4gICAgZm9yICg7IGkgPCB0b3RhbEtpZHM7IGkrKykge1xuICAgICAgICBjb25zdCBjaGlsZE5vZGUgPSB0YXJnZXROb2RlLmNoaWxkTm9kZXNbaV07XG4gICAgICAgIGlmIChpID49IGZyYWdtZW50S2lkcykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNoaWxkRnJhZ21lbnQgPSBmcmFnbWVudC5jaGlsZHJlbltpXTtcbiAgICAgICAgUGF0Y2hKU09OTm9kZShjaGlsZEZyYWdtZW50LCBjaGlsZE5vZGUsIGRpY3RhdG9yLCBtYWtlcik7XG4gICAgfVxuICAgIGZvciAoOyBpIDwgZnJhZ21lbnRLaWRzOyBpKyspIHtcbiAgICAgICAgY29uc3QgdE5vZGUgPSBtYWtlci5NYWtlKGRvY3VtZW50LCBmcmFnbWVudCwgZmFsc2UsIHRydWUpO1xuICAgICAgICB0YXJnZXROb2RlLmFwcGVuZENoaWxkKHROb2RlKTtcbiAgICB9XG4gICAgcmV0dXJuO1xufVxuZXhwb3J0cy5BcHBseVN0cmVhbU5vZGUgPSBBcHBseVN0cmVhbU5vZGU7XG5mdW5jdGlvbiBQYXRjaFRleHRDb21tZW50V2l0aEpTT04oZnJhZ21lbnQsIHRhcmdldCkge1xuICAgIGlmIChmcmFnbWVudC50eXBlICE9PSBkb21fMS5DT01NRU5UX05PREUgJiYgZnJhZ21lbnQudHlwZSAhPT0gZG9tXzEuVEVYVF9OT0RFKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGZyYWdtZW50LnR5cGUgIT09IGRvbV8xLkNPTU1FTlRfTk9ERSAmJiBmcmFnbWVudC50eXBlICE9PSBkb21fMS5URVhUX05PREUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGFyZ2V0LnRleHRDb250ZW50ID09PSBmcmFnbWVudC5jb250ZW50KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGFyZ2V0LnRleHRDb250ZW50ID0gZnJhZ21lbnQuY29udGVudDtcbiAgICBleHRzLk9iamVjdHMuUGF0Y2hXaXRoKHRhcmdldCwgJ19yZWYnLCBmcmFnbWVudC5yZWYpO1xuICAgIGV4dHMuT2JqZWN0cy5QYXRjaFdpdGgodGFyZ2V0LCAnX3RpZCcsIGZyYWdtZW50LnRpZCk7XG4gICAgZXh0cy5PYmplY3RzLlBhdGNoV2l0aCh0YXJnZXQsICdfYXRpZCcsIGZyYWdtZW50LmF0aWQpO1xufVxuZXhwb3J0cy5QYXRjaFRleHRDb21tZW50V2l0aEpTT04gPSBQYXRjaFRleHRDb21tZW50V2l0aEpTT047XG5mdW5jdGlvbiBQYXRjaEpTT05BdHRyaWJ1dGVzKG5vZGUsIHRhcmdldCkge1xuICAgIGNvbnN0IG9sZE5vZGVBdHRycyA9IGRvbS5yZWNvcmRBdHRyaWJ1dGVzKHRhcmdldCk7XG4gICAgbm9kZS5hdHRycy5mb3JFYWNoKGZ1bmN0aW9uIChhdHRyKSB7XG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gb2xkTm9kZUF0dHJzW2F0dHIuS2V5XTtcbiAgICAgICAgZGVsZXRlIG9sZE5vZGVBdHRyc1thdHRyLktleV07XG4gICAgICAgIGlmIChhdHRyLlZhbHVlID09PSBvbGRWYWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGFyZ2V0LnNldEF0dHJpYnV0ZShhdHRyLktleSwgYXR0ci5WYWx1ZSk7XG4gICAgfSk7XG4gICAgZm9yIChsZXQgaW5kZXggaW4gb2xkTm9kZUF0dHJzKSB7XG4gICAgICAgIHRhcmdldC5yZW1vdmVBdHRyaWJ1dGUoaW5kZXgpO1xuICAgIH1cbiAgICB0YXJnZXQuc2V0QXR0cmlidXRlKCdfdGlkJywgbm9kZS50aWQpO1xuICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoJ19yZWYnLCBub2RlLnJlZik7XG4gICAgdGFyZ2V0LnNldEF0dHJpYnV0ZSgnX2F0aWQnLCBub2RlLmF0aWQpO1xuICAgIG5vZGUuZXZlbnRzLmZvckVhY2goZnVuY3Rpb24gZXZlbnRzKGV2ZW50KSB7XG4gICAgICAgIHRhcmdldC5zZXRBdHRyaWJ1dGUoJ2V2ZW50LScgKyBldmVudC5OYW1lLCBldmVudC5UYXJnZXRzLmpvaW4oJ3wnKSk7XG4gICAgfSk7XG4gICAgZXh0cy5PYmplY3RzLlBhdGNoV2l0aCh0YXJnZXQsICdfaWQnLCBub2RlLmlkKTtcbiAgICBleHRzLk9iamVjdHMuUGF0Y2hXaXRoKHRhcmdldCwgJ19yZWYnLCBub2RlLnJlZik7XG4gICAgZXh0cy5PYmplY3RzLlBhdGNoV2l0aCh0YXJnZXQsICdfdGlkJywgbm9kZS50aWQpO1xuICAgIGV4dHMuT2JqZWN0cy5QYXRjaFdpdGgodGFyZ2V0LCAnX2F0aWQnLCBub2RlLmF0aWQpO1xufVxuZXhwb3J0cy5QYXRjaEpTT05BdHRyaWJ1dGVzID0gUGF0Y2hKU09OQXR0cmlidXRlcztcbmZ1bmN0aW9uIFBhdGNoRE9NVHJlZShuZXdGcmFnbWVudCwgb2xkTm9kZU9yTW91bnQsIGRpY3RhdG9yLCBpc0NoaWxkUmVjdXJzaW9uKSB7XG4gICAgaWYgKGlzQ2hpbGRSZWN1cnNpb24pIHtcbiAgICAgICAgY29uc3Qgcm9vdE5vZGUgPSBvbGROb2RlT3JNb3VudC5wYXJlbnROb2RlO1xuICAgICAgICBpZiAoIWRpY3RhdG9yLlNhbWUob2xkTm9kZU9yTW91bnQsIG5ld0ZyYWdtZW50KSkge1xuICAgICAgICAgICAgZG9tLnJlcGxhY2VOb2RlKHJvb3ROb2RlLCBvbGROb2RlT3JNb3VudCwgbmV3RnJhZ21lbnQpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFvbGROb2RlT3JNb3VudC5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICAgIGRvbS5yZXBsYWNlTm9kZShyb290Tm9kZSwgb2xkTm9kZU9yTW91bnQsIG5ld0ZyYWdtZW50KTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IG5ld0NoaWxkcmVuID0gZG9tLm5vZGVMaXN0VG9BcnJheShuZXdGcmFnbWVudC5jaGlsZE5vZGVzKTtcbiAgICBjb25zdCBvbGRDaGlsZHJlbiA9IGRvbS5ub2RlTGlzdFRvQXJyYXkob2xkTm9kZU9yTW91bnQuY2hpbGROb2Rlcyk7XG4gICAgY29uc3Qgb2xkQ2hpbGRyZW5MZW5ndGggPSBvbGRDaGlsZHJlbi5sZW5ndGg7XG4gICAgY29uc3QgbmV3Q2hpbGRyZW5MZW5ndGggPSBuZXdDaGlsZHJlbi5sZW5ndGg7XG4gICAgY29uc3QgcmVtb3ZlT2xkTGVmdCA9IG5ld0NoaWxkcmVuTGVuZ3RoIDwgb2xkQ2hpbGRyZW5MZW5ndGg7XG4gICAgbGV0IGxhc3RJbmRleCA9IDA7XG4gICAgbGV0IGxhc3ROb2RlO1xuICAgIGxldCBuZXdDaGlsZE5vZGU7XG4gICAgbGV0IGxhc3ROb2RlTmV4dFNpYmxpbmcgPSBudWxsO1xuICAgIGZvciAoOyBsYXN0SW5kZXggPCBvbGRDaGlsZHJlbkxlbmd0aDsgbGFzdEluZGV4KyspIHtcbiAgICAgICAgaWYgKGxhc3RJbmRleCA+PSBuZXdDaGlsZHJlbkxlbmd0aCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdE5vZGUgPSBvbGRDaGlsZHJlbltsYXN0SW5kZXhdO1xuICAgICAgICBuZXdDaGlsZE5vZGUgPSBuZXdDaGlsZHJlbltsYXN0SW5kZXhdO1xuICAgICAgICBsYXN0Tm9kZU5leHRTaWJsaW5nID0gbGFzdE5vZGUubmV4dFNpYmxpbmc7XG4gICAgICAgIGlmICgobGFzdE5vZGUubm9kZVR5cGUgPT09IGRvbS5URVhUX05PREUgfHwgbGFzdE5vZGUubm9kZVR5cGUgPT09IGRvbS5DT01NRU5UX05PREUpICYmXG4gICAgICAgICAgICBuZXdDaGlsZE5vZGUubm9kZVR5cGUgPT09IGxhc3ROb2RlLm5vZGVUeXBlKSB7XG4gICAgICAgICAgICBpZiAobGFzdE5vZGUudGV4dENvbnRlbnQgIT09IG5ld0NoaWxkTm9kZS50ZXh0Q29udGVudCkge1xuICAgICAgICAgICAgICAgIGxhc3ROb2RlLnRleHRDb250ZW50ID0gbmV3Q2hpbGROb2RlLnRleHRDb250ZW50O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkaWN0YXRvci5TYW1lKGxhc3ROb2RlLCBuZXdDaGlsZE5vZGUpKSB7XG4gICAgICAgICAgICBkb20ucmVwbGFjZU5vZGUob2xkTm9kZU9yTW91bnQsIGxhc3ROb2RlLCBuZXdDaGlsZE5vZGUpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkaWN0YXRvci5DaGFuZ2VkKGxhc3ROb2RlLCBuZXdDaGlsZE5vZGUpKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGFzdE5vZGUubm9kZVR5cGUgIT09IG5ld0NoaWxkTm9kZS5ub2RlVHlwZSkge1xuICAgICAgICAgICAgZG9tLnJlcGxhY2VOb2RlKG9sZE5vZGVPck1vdW50LCBsYXN0Tm9kZSwgbmV3Q2hpbGROb2RlKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbGFzdE5vZGUuaGFzQ2hpbGROb2RlcygpICYmIG5ld0NoaWxkTm9kZS5oYXNDaGlsZE5vZGVzKCkpIHtcbiAgICAgICAgICAgIGRvbS5yZXBsYWNlTm9kZShvbGROb2RlT3JNb3VudCwgbGFzdE5vZGUsIG5ld0NoaWxkTm9kZSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGFzdE5vZGUuaGFzQ2hpbGROb2RlcygpICYmICFuZXdDaGlsZE5vZGUuaGFzQ2hpbGROb2RlcygpKSB7XG4gICAgICAgICAgICBkb20ucmVwbGFjZU5vZGUob2xkTm9kZU9yTW91bnQsIGxhc3ROb2RlLCBuZXdDaGlsZE5vZGUpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGFzdEVsZW1lbnQgPSBsYXN0Tm9kZTtcbiAgICAgICAgY29uc3QgbmV3RWxlbWVudCA9IG5ld0NoaWxkTm9kZTtcbiAgICAgICAgUGF0Y2hET01BdHRyaWJ1dGVzKG5ld0VsZW1lbnQsIGxhc3RFbGVtZW50KTtcbiAgICAgICAgbGFzdEVsZW1lbnQuc2V0QXR0cmlidXRlKCdfcGF0Y2hlZCcsICd0cnVlJyk7XG4gICAgICAgIFBhdGNoRE9NVHJlZShuZXdFbGVtZW50LCBsYXN0RWxlbWVudCwgZGljdGF0b3IsIHRydWUpO1xuICAgICAgICBsYXN0RWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ19wYXRjaGVkJyk7XG4gICAgfVxuICAgIGlmIChyZW1vdmVPbGRMZWZ0ICYmIGxhc3ROb2RlTmV4dFNpYmxpbmcgIT09IG51bGwpIHtcbiAgICAgICAgZG9tLnJlbW92ZUZyb21Ob2RlKGxhc3ROb2RlTmV4dFNpYmxpbmcsIG51bGwpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgZm9yICg7IGxhc3RJbmRleCA8IG5ld0NoaWxkcmVuTGVuZ3RoOyBsYXN0SW5kZXgrKykge1xuICAgICAgICBsZXQgbmV3Tm9kZSA9IG5ld0NoaWxkcmVuW2xhc3RJbmRleF07XG4gICAgICAgIGlmICghZXh0cy5PYmplY3RzLmlzTnVsbE9yVW5kZWZpbmVkKG5ld05vZGUpKSB7XG4gICAgICAgICAgICBvbGROb2RlT3JNb3VudC5hcHBlbmRDaGlsZChuZXdOb2RlKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuUGF0Y2hET01UcmVlID0gUGF0Y2hET01UcmVlO1xuZnVuY3Rpb24gUGF0Y2hET01BdHRyaWJ1dGVzKG5ld0VsZW1lbnQsIG9sZEVsZW1lbnQpIHtcbiAgICBjb25zdCBvbGROb2RlQXR0cnMgPSBkb20ucmVjb3JkQXR0cmlidXRlcyhvbGRFbGVtZW50KTtcbiAgICBmb3IgKGxldCBpbmRleCBpbiBuZXdFbGVtZW50LmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgY29uc3QgYXR0ciA9IG5ld0VsZW1lbnQuYXR0cmlidXRlc1tpbmRleF07XG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gb2xkTm9kZUF0dHJzW2F0dHIubmFtZV07XG4gICAgICAgIGRlbGV0ZSBvbGROb2RlQXR0cnNbYXR0ci5uYW1lXTtcbiAgICAgICAgaWYgKGF0dHIudmFsdWUgPT09IG9sZFZhbHVlKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBvbGRFbGVtZW50LnNldEF0dHJpYnV0ZShhdHRyLm5hbWUsIGF0dHIudmFsdWUpO1xuICAgIH1cbiAgICBmb3IgKGxldCBpbmRleCBpbiBvbGROb2RlQXR0cnMpIHtcbiAgICAgICAgb2xkRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoaW5kZXgpO1xuICAgIH1cbn1cbmV4cG9ydHMuUGF0Y2hET01BdHRyaWJ1dGVzID0gUGF0Y2hET01BdHRyaWJ1dGVzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGF0Y2guanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmlzRXF1YWwgPSBleHBvcnRzLlJhbmRvbUlEID0gZXhwb3J0cy50cnVuY2F0ZUFycmF5ID0gZXhwb3J0cy5jcmVhdGVNYXAgPSBleHBvcnRzLmhhcyA9IGV4cG9ydHMuQmxhbmsgPSBleHBvcnRzLlRvS2ViYWJDYXNlID0gdm9pZCAwO1xuY29uc3QgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuZnVuY3Rpb24gVG9LZWJhYkNhc2Uoc3RyKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gc3RyLnJlcGxhY2UoL1tBLVpcXHUwMEMwLVxcdTAwRDZcXHUwMEQ4LVxcdTAwREVdL2csIChtYXRjaCkgPT4gJy0nICsgbWF0Y2gudG9Mb3dlckNhc2UoKSk7XG4gICAgcmV0dXJuIHN0clswXSA9PT0gc3RyWzBdLnRvVXBwZXJDYXNlKCkgPyByZXN1bHQuc3Vic3RyaW5nKDEpIDogcmVzdWx0O1xufVxuZXhwb3J0cy5Ub0tlYmFiQ2FzZSA9IFRvS2ViYWJDYXNlO1xuZnVuY3Rpb24gQmxhbmsoKSB7IH1cbmV4cG9ydHMuQmxhbmsgPSBCbGFuaztcbkJsYW5rLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5mdW5jdGlvbiBoYXMobWFwLCBwcm9wZXJ0eSkge1xuICAgIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKG1hcCwgcHJvcGVydHkpO1xufVxuZXhwb3J0cy5oYXMgPSBoYXM7XG5mdW5jdGlvbiBjcmVhdGVNYXAoKSB7XG4gICAgcmV0dXJuIG5ldyBCbGFuaygpO1xufVxuZXhwb3J0cy5jcmVhdGVNYXAgPSBjcmVhdGVNYXA7XG5mdW5jdGlvbiB0cnVuY2F0ZUFycmF5KGFyciwgbGVuZ3RoKSB7XG4gICAgd2hpbGUgKGFyci5sZW5ndGggPiBsZW5ndGgpIHtcbiAgICAgICAgYXJyLnBvcCgpO1xuICAgIH1cbn1cbmV4cG9ydHMudHJ1bmNhdGVBcnJheSA9IHRydW5jYXRlQXJyYXk7XG5mdW5jdGlvbiBSYW5kb21JRCgpIHtcbiAgICByZXR1cm4gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDkpO1xufVxuZXhwb3J0cy5SYW5kb21JRCA9IFJhbmRvbUlEO1xuZnVuY3Rpb24gaXNFcXVhbChhLCBiKSB7XG4gICAgY29uc3QgYVByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYSk7XG4gICAgY29uc3QgYlByb3BzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYik7XG4gICAgaWYgKGFQcm9wcy5sZW5ndGggIT0gYlByb3BzLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYVByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHByb3BOYW1lID0gYVByb3BzW2ldO1xuICAgICAgICBpZiAoYVtwcm9wTmFtZV0gIT09IGJbcHJvcE5hbWVdKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5leHBvcnRzLmlzRXF1YWwgPSBpc0VxdWFsO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLkRPTUV4Y2VwdGlvbiA9IGV4cG9ydHMuUmVzcG9uc2UgPSBleHBvcnRzLlJlcXVlc3QgPSBleHBvcnRzLkhlYWRlcnMgPSBleHBvcnRzLmZldGNoID0gdm9pZCAwO1xuY29uc3QgZmV0Y2ggPSByZXF1aXJlKFwid2hhdHdnLWZldGNoXCIpO1xuaWYgKCFzZWxmLmZldGNoKSB7XG4gICAgc2VsZi5mZXRjaCA9IGV4cG9ydHMuZmV0Y2guZmV0Y2g7XG4gICAgc2VsZi5IZWFkZXJzID0gZXhwb3J0cy5mZXRjaC5IZWFkZXJzO1xuICAgIHNlbGYuUmVxdWVzdCA9IGV4cG9ydHMuZmV0Y2guUmVxdWVzdDtcbiAgICBzZWxmLlJlc3BvbnNlID0gZXhwb3J0cy5mZXRjaC5SZXNwb25zZTtcbiAgICBzZWxmLkRPTUV4Y2VwdGlvbiA9IGV4cG9ydHMuZmV0Y2guRE9NRXhjZXB0aW9uO1xufVxuZXhwb3J0cy5mZXRjaCA9IHNlbGYuZmV0Y2g7XG5leHBvcnRzLkhlYWRlcnMgPSBzZWxmLkhlYWRlcnM7XG5leHBvcnRzLlJlcXVlc3QgPSBzZWxmLlJlcXVlc3Q7XG5leHBvcnRzLlJlc3BvbnNlID0gc2VsZi5SZXNwb25zZTtcbmV4cG9ydHMuRE9NRXhjZXB0aW9uID0gc2VsZi5ET01FeGNlcHRpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1mZXRjaC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHt9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aHR0cC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMubW91bnRUbyA9IHZvaWQgMDtcbmNvbnN0IGZldGNoID0gcmVxdWlyZShcIi4vZmV0Y2hcIik7XG5jb25zdCBodHRwID0gcmVxdWlyZShcIi4vaHR0cFwiKTtcbmNvbnN0IHdlYnNvY2tldCA9IHJlcXVpcmUoXCIuL3dlYnNvY2tldFwiKTtcbmNvbnN0IG5hbWVzcGFjZSA9IE9iamVjdC5hc3NpZ24oT2JqZWN0LmFzc2lnbihPYmplY3QuYXNzaWduKHt9LCBmZXRjaCksIGh0dHApLCB3ZWJzb2NrZXQpO1xuZnVuY3Rpb24gbW91bnRUbyhwYXJlbnQpIHtcbiAgICBwYXJlbnQuaHR0cCA9IG5hbWVzcGFjZTtcbn1cbmV4cG9ydHMubW91bnRUbyA9IG1vdW50VG87XG5leHBvcnRzLmRlZmF1bHQgPSBuYW1lc3BhY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuU29ja2V0ID0gZXhwb3J0cy5PbmVNaW51dGUgPSBleHBvcnRzLk9uZVNlY29uZCA9IHZvaWQgMDtcbmV4cG9ydHMuT25lU2Vjb25kID0gMTAwMDtcbmV4cG9ydHMuT25lTWludXRlID0gZXhwb3J0cy5PbmVTZWNvbmQgKiA2MDtcbmNsYXNzIFNvY2tldCB7XG4gICAgY29uc3RydWN0b3IoYWRkciwgcmVhZGVyLCBleHBvbmVudCwgbWF4UmVjb25uZWN0cywgbWF4V2FpdCkge1xuICAgICAgICB0aGlzLmFkZHIgPSBhZGRyO1xuICAgICAgICB0aGlzLnNvY2tldCA9IG51bGw7XG4gICAgICAgIHRoaXMucmVhZGVyID0gcmVhZGVyO1xuICAgICAgICB0aGlzLm1heFdhaXQgPSBtYXhXYWl0O1xuICAgICAgICB0aGlzLnVzZXJDbG9zZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5leHBvbmVudCA9IGV4cG9uZW50O1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLmF0dGVtcHRlZENvbm5lY3RzID0gMDtcbiAgICAgICAgdGhpcy5sYXN0V2FpdCA9IGV4cG9ydHMuT25lU2Vjb25kO1xuICAgICAgICB0aGlzLm1heFJlY29ubmVjdCA9IG1heFJlY29ubmVjdHM7XG4gICAgICAgIHRoaXMud3JpdGVCdWZmZXIgPSBuZXcgQXJyYXkoKTtcbiAgICB9XG4gICAgY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuc29ja2V0KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuYXR0ZW1wdGVkQ29ubmVjdHMgPj0gdGhpcy5tYXhSZWNvbm5lY3QpIHtcbiAgICAgICAgICAgIHRoaXMucmVhZGVyLkV4aGF1c3RlZCh0aGlzKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzb2NrZXQgPSBuZXcgV2ViU29ja2V0KHRoaXMuYWRkcik7XG4gICAgICAgIHNvY2tldC5hZGRFdmVudExpc3RlbmVyKCdvcGVuJywgdGhpcy5fb3BlbmVkLmJpbmQodGhpcykpO1xuICAgICAgICBzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCB0aGlzLl9lcnJvcmVkLmJpbmQodGhpcykpO1xuICAgICAgICBzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIHRoaXMuX21lc3NhZ2VkLmJpbmQodGhpcykpO1xuICAgICAgICBzb2NrZXQuYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCB0aGlzLl9kaXNjb25uZWN0ZWQuYmluZCh0aGlzKSk7XG4gICAgICAgIHRoaXMuc29ja2V0ID0gc29ja2V0O1xuICAgICAgICB0aGlzLmRpc2Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBzZW5kKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKHRoaXMuZGlzY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLndyaXRlQnVmZmVyLnB1c2gobWVzc2FnZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zb2NrZXQuc2VuZChtZXNzYWdlKTtcbiAgICB9XG4gICAgcmVzZXQoKSB7XG4gICAgICAgIHRoaXMuYXR0ZW1wdGVkQ29ubmVjdHMgPSAwO1xuICAgICAgICB0aGlzLmxhc3RXYWl0ID0gZXhwb3J0cy5PbmVTZWNvbmQ7XG4gICAgfVxuICAgIGVuZCgpIHtcbiAgICAgICAgdGhpcy51c2VyQ2xvc2VkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5yZWFkZXIuQ2xvc2VkKHRoaXMpO1xuICAgICAgICB0aGlzLnNvY2tldC5jbG9zZSgpO1xuICAgICAgICB0aGlzLnNvY2tldCA9IG51bGw7XG4gICAgfVxuICAgIF9kaXNjb25uZWN0ZWQoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5yZWFkZXIuRGlzY29ubmVjdGVkKGV2ZW50LCB0aGlzKTtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0ZWQgPSB0cnVlO1xuICAgICAgICB0aGlzLnNvY2tldCA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLnVzZXJDbG9zZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgbmV4dFdhaXQgPSB0aGlzLmxhc3RXYWl0O1xuICAgICAgICBpZiAodGhpcy5leHBvbmVudCkge1xuICAgICAgICAgICAgbmV4dFdhaXQgPSB0aGlzLmV4cG9uZW50KG5leHRXYWl0KTtcbiAgICAgICAgICAgIGlmIChuZXh0V2FpdCA+IHRoaXMubWF4V2FpdCkge1xuICAgICAgICAgICAgICAgIG5leHRXYWl0ID0gdGhpcy5tYXhXYWl0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHNldFRpbWVvdXQodGhpcy5jb25uZWN0LmJpbmQodGhpcyksIG5leHRXYWl0KTtcbiAgICAgICAgdGhpcy5hdHRlbXB0ZWRDb25uZWN0cysrO1xuICAgIH1cbiAgICBfb3BlbmVkKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucmVhZGVyLkNvbm5lY3RlZChldmVudCwgdGhpcyk7XG4gICAgICAgIHdoaWxlICh0aGlzLndyaXRlQnVmZmVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLndyaXRlQnVmZmVyLnNoaWZ0KCk7XG4gICAgICAgICAgICB0aGlzLnNvY2tldC5zZW5kKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9lcnJvcmVkKGV2ZW50KSB7XG4gICAgICAgIHRoaXMucmVhZGVyLkVycm9yZWQoZXZlbnQsIHRoaXMpO1xuICAgIH1cbiAgICBfbWVzc2FnZWQoZXZlbnQpIHtcbiAgICAgICAgdGhpcy5yZWFkZXIuTWVzc2FnZShldmVudCwgdGhpcyk7XG4gICAgfVxufVxuZXhwb3J0cy5Tb2NrZXQgPSBTb2NrZXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD13ZWJzb2NrZXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBkb20gPSByZXF1aXJlKFwiLi4vLi4vZG9tL3NyY1wiKTtcbmNvbnN0IGFuaW1hdGlvbnMgPSByZXF1aXJlKFwiLi4vLi4vYW5pbWF0aW9uL3NyY1wiKTtcbmNvbnN0IGh0dHAgPSByZXF1aXJlKFwiLi4vLi4vaHR0cC9zcmNcIik7XG5jb25zdCBwcm9taXNlcyA9IHJlcXVpcmUoXCIuLi8uLi9wcm9taXNlcy9zcmNcIik7XG5jb25zdCBtYXJrdXAgPSB7XG4gICAgZG9tLFxuICAgIGFuaW1hdGlvbnMsXG4gICAgaHR0cCxcbiAgICBwcm9taXNlcyxcbn07XG5pZiAod2luZG93KSB7XG4gICAgd2luZG93Lm1hcmt1cCA9IG1hcmt1cDtcbn1cbmV4cG9ydHMuZGVmYXVsdCA9IG1hcmt1cDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5tb3VudFRvID0gdm9pZCAwO1xuY29uc3QgcHJvbWlzZSA9IHJlcXVpcmUoXCJwcm9taXNlLXBvbHlmaWxsXCIpO1xuaWYgKCFzZWxmLlByb21pc2UpIHtcbiAgICBzZWxmLlByb21pc2UgPSBwcm9taXNlO1xufVxuY29uc3QgbmFtZXNwYWNlID0gc2VsZi5Qcm9taXNlO1xuZnVuY3Rpb24gbW91bnRUbyhwYXJlbnQpIHtcbiAgICBwYXJlbnQucHJvbWlzZXMgPSBuYW1lc3BhY2U7XG59XG5leHBvcnRzLm1vdW50VG8gPSBtb3VudFRvO1xuZXhwb3J0cy5kZWZhdWx0ID0gbmFtZXNwYWNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIl19
