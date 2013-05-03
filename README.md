# autoabbr.js

**autoabbr.js** is a jQuery plugin
that takes a list of words
and automatically inserts &lt;abbr&gt; tags into the DOM
whenever it finds one of these words.
The intended usage is for inserting glossary definitions inline into a page purely with JavaScript.

## Installation

Install it like you would any jQuery plugin by including it after jQuery:

	<script src="http://code.jquery.com/jquery-1.9.1.min.js"></script>
	<script src="autoabbr.js"></script>

## Basic Usage

The most basic usage is just to run this on your paragraph tags and to supply a word file.

	$('p').autoabbr({ src: 'words.json' });
    
The words file should just be a simple hash of `{ word1: definition1, word2: definition2 }`
    
You can also supply your words directly inline:

	$('p').autoabbr({ words: {
		"lorem": "word 1",
		"ipsum": "word 2"
	}});
    
You could also supply both `words` and `src`, in which case the words loaded from the file will append/overwrite
the words supplied inline.

### Words

* Word matching is case-insensitive but exact.
e.g. "Lorem" in the text will match "lorem" in the word file, but will not match "lor" or "lorems".
* Words break on *any* non-letter.
e.g. "lorem" in the word file would apply to the lorem in "lorem-ipsum".
* You can use a wildcard at the end of a word
e.g. "lor*" in the word file would match "lor" or "lorem" in the text.

### Other Options

The options parameter lets you customise things a bit.

	{
		'defTag': 'abbr',             // The element to use around definitions.
		'attrKey': 'data-definition', // The attribute name to use for the word's key. Empty string to omit.
		'attrDef': 'title',           // The attribute name to use for the word's definition. Empty string to omit.
		'addClass': 'definition',     // A class to attach to your definition elements. Empty string to omit.
		'includeWord': 'true'         // Whether or not to include the word itself in the definition attr, format 'word: definition'
		'onComplete': function(){...} // A callback function to run when adding words is complete. e.g. for attaching a toolTip library
	}
