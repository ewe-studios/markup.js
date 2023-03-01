import * as dom from '../../dom/src';
import * as animations from '../../animation/src';
import * as http from '../../http/src';
import * as promises from '../../promises/src';

const markup = {
	dom,
    animations,
    http,
    promises,
}

if (window) {
	//@ts-ignore
	window.markup = markup;
}

export default markup
