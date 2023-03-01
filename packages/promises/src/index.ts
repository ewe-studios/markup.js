import * as promise from 'promise-polyfill';
import * as utils from "../../dom/src/utils";
import * as exts from "../../dom/src/extensions";
import * as patch from "../../dom/src/patch";
import * as dom from "../../dom/src/dom";
import * as mount from "../../dom/src/mount";

//@ts-ignore
if (!self.Promise!) {
  //@ts-ignore
  self.Promise = promise;
}

const namespace = self.Promise;

export function mountTo(parent: object & { promises: object }) {
  parent.promises = namespace;
}

export default namespace;
