jQuery(document).ready(function($) {
	// handle hiding the sidebar
	$('div.wp-blockade-sidebar-prefix').next().hide();

	var wp_blockade_breakout = function() {
		$('.wp-blockade-breakout').each(function(){
			var $wrapper = $(this);
			var $breakin = $wrapper.find('.wp-blockade-breakin');
			$wrapper.css({
				'position' : 'relative',
				'left'     : 'initial',
				'width'    : 'initial'
			});
			$breakin.css({
				'position' : 'relative',
				'left'  : 'initial',
				'width' : 'initial'
			});
			var pos   = Math.ceil( $wrapper.offset().left );
			var width = $wrapper.width();
			$wrapper.css({
				'left'     : -1 * pos,
				'width'    : $('body').width(),
				'overflow' : 'hidden'
			});
			$breakin.css({
				'left'     : pos,
				'width'    : width
			});
		});
	};
	wp_blockade_breakout();
	$(window).resize(function() {
		wp_blockade_breakout();
	});
});
