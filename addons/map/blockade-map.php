<?php if(!defined('ABSPATH')) { die(); } // Include in all php files, to prevent direct execution
/*
 * Block Name: Map Block
 * Slug: map_block
 * Author: Burlington Bytes, LLC
 * Description: Insert a Google map as a block-level element
 * Version: 0.9.5
 */
 if( !class_exists('BlockadeMapBlock') ) {
	class BlockadeMapBlock {
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
			add_filter( 'wp-blockade-tinymce-plugins', array( $this, "register_tinymce_plugin" ), 50 );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ) );
		}
		// PUBLIC FUNCTIONS
		public function register_tinymce_plugin( $plugins ) {
			$plugins['map_block'] = $this->addon_dir_url . 'plugin.js?v=' . $this->version;
			return $plugins;
		}
		public function enqueue_styles() {
			wp_enqueue_style( 'wp-blockade-map-styles', $this->addon_dir_url . 'styles.css', array(), $this->version );
		}
	}
	BlockadeMapBlock::Instance();
}
