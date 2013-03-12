verbose = true;

requirejs.config({
	baseUrl: '/livebg',
	paths: {
		text: '/lib/third/requirejs/text',
		creator: 'creator',
		jquery: [ '//code.jquery.com/jquery-1.9.1',
			'/lib/third/jquery/jquery-1.9.1.min' ],
		jqueryUi: [ '//code.jquery.com/ui/1.10.1/jquery-ui',
			'/lib/third/jquery/jquery-ui/jquery-ui-1.10.1.min' ],
		jqueryUiWidgets: '/lib/third/jquery/jquery-ui/jquery-ui-widgets', 
		colorpicker: [
			'/lib/third/jquery/jquery-ui/colorpicker/jquery.colorpicker',
			'//raw.github.com/vanderlee/colorpicker/master/jquery.colorpicker'
		],
		underscore: [ '//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min',
			'/lib/third/underscore/underscore.min'
		]
	},
	shim: {
		'jqueryUi': {
			deps: [ 'jquery']
		},
		'colorpicker': {
			deps: [ 'jquery', 'jqueryUi' ]
		},
		'jqueryUiWidgets': {
			deps: [ 'jqueryUi', 'colorpicker' ]
		},
	}
});

require([ 'jquery', 'creator/creator', 'jqueryUi' ],
	function($, ShapeCreator, domReady) {
		var creator = new ShapeCreator();

		$(function() {
			creator.init(document.getElementById('creator'));
		});
	}
);
