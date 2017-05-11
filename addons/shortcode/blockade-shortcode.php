<?php if(!defined('ABSPATH')) { die(); } // Include in all php files, to prevent direct execution
/*
 * Block Name: Shortcode
 * Slug: blockade_shortcode
 * Author: Burlington Bytes, LLC
 * Description: add shortcode blocks with live preview
 * Version: 0.9.5
 */
 if( !class_exists('BlockadeShortcode') ) {
	class BlockadeShortcode {
		private $version = 'v0.9.5';
		private static $_this;
		private $addon_dir;
		private $addon_dir_url;
		private $hide_sidebar = false;

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
			add_filter( 'wp-blockade-tinymce-plugins', array( $this, "register_tinymce_plugin" ), 50 );
		}
		// PUBLIC FUNCTIONS
		public function register_tinymce_plugin( $plugins ) {
			$plugins['blockade_shortcode'] = $this->addon_dir_url . 'plugin.js?v=' . $this->version;
			return $plugins;
		}
	}
	BlockadeShortcode::Instance();
}
