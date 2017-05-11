<?php if(!defined('ABSPATH')) { die(); } // Include in all php files, to prevent direct execution
/*
 * Block Name: Sidebar
 * Slug: blockade_sidebar
 * Author: Burlington Bytes, LLC
 * Description: create and embed widget areas
 * Version: 0.9.5
 */
 if( !class_exists('BlockadeSidebar') ) {
	class BlockadeSidebar {
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
			add_action( 'wp_ajax_wp-blockade-sidebar-list', array( $this, 'list_sidebars' ) );
			add_shortcode( 'wp_blockade_sidebar', array( $this, 'sidebar_shortcode' ) );
		}
		// PUBLIC FUNCTIONS
		public function register_tinymce_plugin( $plugins ) {
			$plugins['blockade_sidebar'] = $this->addon_dir_url . 'plugin.js?v=' . $this->version;
			return $plugins;
		}
		public function list_sidebars() {
			$sidebars = array();
			foreach ( $GLOBALS['wp_registered_sidebars'] as $name => $sidebar ) {
				$sidebars[$sidebar['id']] = $sidebar['name'];
			}
			echo json_encode( $sidebars );
			wp_die();
		}
		public function sidebar_shortcode( $atts ) {
			$atts = shortcode_atts( array(
				'slug' => ''
			), $atts );
			ob_start();
			if($atts['slug'] && is_active_sidebar( $atts['slug'] ) ) {
				?>
				<div class="wp-blockade-sidebar wp-blockade-sidebar-<?php echo sanitize_title( $atts['slug'] ); ?>" role="aside">
					<?php dynamic_sidebar( $atts['slug'] ); ?>
				</div>
				<?php
			}
			return ob_get_clean();
		}
	}
	BlockadeSidebar::Instance();
}
