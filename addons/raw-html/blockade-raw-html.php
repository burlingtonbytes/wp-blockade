<?php if(!defined('ABSPATH')) { die(); } // Include in all php files, to prevent direct execution
/*
 * Block Name: Raw HTML
 * Slug: blockade_raw_html
 * Author: Burlington Bytes, LLC
 * Description: Create Raw HTML elements, and incorporate container and editable areas directly
 * Version: 0.9.5
 */
 if( !class_exists('BlockadeRawHTML') ) {
	class BlockadeRawHTML {
		private $version = 'v0.9.5';
		private static $_this;
		private $addon_dir;
		private $addon_dir_url;

		public static function Instance() {
			static $instance = null;
			if ($instance === null) {
				$instance = new self();
			}
			return $instance;
		}

		private function __construct() {
			$this->addon_dir = dirname( __FILE__ );
			$this->addon_dir_url = plugin_dir_url( __FILE__ );
			add_filter( 'wp-blockade-tinymce-plugins', array( $this, "register_tinymce_plugin" ), 80 );
			// add_filter( 'wp-blockade-top-level-buttons', array( $this, "register_tinymce_top_level_buttons" ) ); // this should rarely be used
		}
		// PUBLIC FUNCTIONS
		public function register_tinymce_plugin( $plugins ) {
			$plugins['blockade_raw_html'] = $this->addon_dir_url . 'plugin.js?v=' . $this->version;
			return $plugins;
		}

		/*
		// this should rarely be used
		public function register_tinymce_top_level_buttons( $buttons ) {
			$buttons[] = 'BUTTON_NAME!';
			return $buttons;
		}
		*/
	}
	BlockadeRawHTML::Instance();
}
