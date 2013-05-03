(function($) {
	"use strict";

	var words, replaceWords, runPlugin, findWords, findWordNodes, filterNodeTypes, preparedWords, prepareWords, wordTree, replaceWord, createNode, opts;

	opts = {
		'defTag': 'abbr',             // The element to use around definitions.
		'attrKey': 'data-definition', // The attribute name to use for the word's key. Empty string to omit.
		'attrDef': 'title',           // The attribute name to use for the word's definition. Empty string to omit.
		'addClass': 'definition',     // A class to attach to your definition elements. Empty string to omit.
		'includeWord': 'true',        // Whether or not to include the word itself in the definition attr, format 'word: definition'
		'onComplete': null            // A function to run once glossary tags have been added
	};

	$.fn.autoabbr = function(options) {
		var el = this;

		$.extend(opts, options);

		words = {};

		if (opts.words) {
			words = opts.words;
		}

		if (opts.src) {
			$.get(opts.src, function(data) {
				$.extend(words, data);
				runPlugin(el);
			}, 'json');
		} else {
			runPlugin(el);
		}
	};

	// Run the plugin on the given element(s), execute callback
	runPlugin = function(el) {
		prepareWords();
		findWordNodes(el);
		if (typeof opts.onComplete === 'function') {
			opts.onComplete.call(el);
		}
	}

	// Convert our words into a nested alphabetical hash
	//   Stick .word = true in the hash to mark the end of a word
	//   e.g. ('lor', 'lorem') becomes {l: {o: {r: {word:true, e: {m: {word:true}}}}}}
	prepareWords = function() {
		var p = {};
		for (var word in words) {
			if (words.hasOwnProperty(word)) {
				wordTree(word,p, 0);
			}
		}
		preparedWords = p;
	}

	// Recurse through the word, building out the hash
	wordTree = function(word, p, l) {
		var p2 = p[word[l]] || {}; // don't overwrite existing hashes
		if (word[l+1]) {
			wordTree(word, p2, l+1);
		} else {
			p2.word = true;
		}
		p[word[l]] = p2;
	}

	// Given a DOM Element, recursively find all text nodes, and then do a findWords on them
	findWordNodes = function(el) {
		var i, l;
		var elChildren, elContents;

		elChildren = el.children();
		for (i=0, l=elChildren.length; i<l; i++) {
			findWordNodes($(elChildren[i]));
		}

		elContents = el.contents();
		for (i=0, l=elContents.length; i<l; i++) {
			if (elContents[i].nodeType === 3) { // magic number 3 is a text node
				findWords(elContents[i]);
			}
		}

	}

	// Simple parser, walks all chars and finds words from the hash
	findWords = function(el) {
		var i, l, letter;
		var foundWords = [];
		var text = el.nodeValue;
		var charset = preparedWords;
		var word = '';
		var key = ''; // used for wildcards so we know what word we had

		for (i=0, l=text.length; i<l; i++) {
			letter = text[i].toLowerCase();

			if (charset.hasOwnProperty(letter)) { // a valid character in the charset, add it to the word and keep going
				charset = charset[letter];
				word += letter;
			} else if (letter.match(/^\W$/)) { // Not text, and not in the character set, stop.
				// a charset terminates at this point, so we've found a word
				if (charset.word) {
					foundWords.push({ i: i, word: word, key: key || word });
				}
				// word is over, so reset word and charset
				key = '';
				word = '';
				charset = preparedWords;
			} else if (charset.hasOwnProperty('*')) { // Wildcards, match anything until we find a \W
				charset = { '*': true, word: true };
				if (!key) {
					key = word + '*';
				}
				word += letter;
			} else { // It's a word, but not in the set. Do nothing until we find a new word
				charset = {};
			}

		}
		if (charset.word) { // We ended on a successful word
			foundWords.push({ i: i, word: word, key: key || word });
		}

		if (foundWords.length) {
			replaceWords(el, foundWords);
		}
	}

	// Divide out the text for this text Node into chunks, based on found words,
	//   and re-assemble with definition DOM elements in place
	replaceWords = function(el, foundWords) {
		var foundWord, parentNode, node, i, l;
		var chunks = [];
		var last = 0;
		var text = el.nodeValue;

		for (i=0, l=foundWords.length; i<l; i++) {
			foundWord = foundWords[i];
			chunks.push({
				type: 'text',
				text: text.slice(last, foundWord.i-foundWord.word.length)
			});
			chunks.push({
				type: 'word',
				text: text.slice(foundWord.i-foundWord.word.length, foundWord.i),
				word: foundWord.key
			});
			last = foundWord.i;
		}
		chunks.push({
			type: 'text',
			text: text.slice(last)
		});

		parentNode = el.parentNode;
		parentNode.removeChild(el);
		for (i=0, l=chunks.length; i<l; i++) {
			node = createNode(chunks[i]);
			if (node !== null) {
				parentNode.appendChild(node);
			}
		}
	}

	// Given a chunk, create an appropriate DOM node
	createNode = function(chunk) {
		var node, def;

		if (!chunk.text || chunk.text.length===0) {
			return null;
		}

		if (chunk.word) {
			node = document.createElement(opts.defTag);
			node.innerHTML = chunk.text;

			if (opts.attrDef) {
				def = words[chunk.word];
				if (opts.includeWord) {
					def = chunk.text + ': ' + def;
				}
				node.setAttribute(opts.attrDef, def);
			}

			if (opts.attrKey) {	
				node.setAttribute(opts.attrKey, chunk.word);
			}

			if (opts.addClass) {
				node.className = opts.addClass;
			}
		} else {
			node = document.createTextNode(chunk.text);
		}

		return node;
	}

})(jQuery);
