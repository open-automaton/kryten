"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ConsoleIO = void 0;
var _index = require("./index.cjs");
var _browserOrNode = require("browser-or-node");
var mod = _interopRequireWildcard(require("module"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
let internalRequire = null;
if (typeof require !== 'undefined') internalRequire = require;
let ensureRequire = null;
let prompts = null;
class ConsoleIO extends _index.IOSource {
  constructor(options = {}) {
    super(options);
    const name = this.options.name || 'bob';
    if (!(_browserOrNode.isBrowser || _browserOrNode.isJsDom) && !prompts) {
      if (!ensureRequire) ensureRequire = () => !internalRequire && (internalRequire = mod.createRequire(require('url').pathToFileURL(__filename).toString()));
      ensureRequire();
      prompts = internalRequire('prompts');
    }
    this.on('response', async response => {
      console.log('  \u001b[1m' + name + '\u001b[22m' + `: ${response.message}`);
      this.emit('response-end', {
        qid: response.qid
      });
    });
  }
  async listenForInput(looped = false) {
    const name = this.options.name || 'bob';
    this.setupRunLoop(looped, async () => {
      if (!(_browserOrNode.isBrowser || _browserOrNode.isJsDom)) {
        const written = await prompts({
          type: 'text',
          name: 'query',
          message: 'me'.padStart(name.length, ' ') + ':',
          initial: 'Give me a 1 page biography on your background.'
        });
        return await this.query(written);
      } else {
        //TBD
      }
    });
  }
}
exports.ConsoleIO = ConsoleIO;