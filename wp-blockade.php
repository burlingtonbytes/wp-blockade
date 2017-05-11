<?php if(!defined('ABSPATH')) { die(); } // Include in all php files, to prevent direct execution
/*
 * Plugin Name: WP Blockade
 * Plugin URI: https://www.wpblockade.com/
 * Author: Burlington Bytes
 * Author URI: https://www.burlingtonbytes.com
 * Description: Lightweight and intuitive Visual Editor for Designers, Developers, and End Users.
 * Version: 0.9.5
 */
if( !class_exists('WP_Blockade') ) {
	class WP_Blockade {
		private $version = 'v0.9.5';
		private static $_this;
		private $plugin_dir;
		private $plugin_dir_url;
		private $editors;
		private $post_types;
		private $wpautop_disabled = false;
		private $default_opts = array(
			'editors' => array(),
			'required_plugins' => array(
				'blockade'            => "{{PLUGIN_DIR}}core-plugins/blockade/plugin.js?v={{VERSION}}",
			),
			'required_buttons' => array(
				'hideblocks',
				'blockade',
			),
			'available_post_types' => array(),
			'required_post_types'  => array(),
			'selected_post_types'  => array( 'page' ),
			'active_post_types'    => array(),
			'available_addons' => array(),
			'active_addons'    => 'ALL', //string 'ALL' or string 'NONE' or array() of slugs
			'custom_buttons' => array(),
			'bad_plugins' => array(
				'lists',
				// all of the known wordpress plugins are listed here:
				//'wordpress','wpautoresize','wpeditimage',
				//'wpemoji','wpgallery','wplink','wpdialogs','wpview'
			),
			'color_palette' => array(
				'rows' => 5,
				'cols' => 8,
				'colors' => array(
					"000000", "Black",
					"993300", "Burnt orange",
					"333300", "Dark olive",
					"003300", "Dark green",
					"003366", "Dark azure",
					"000080", "Navy Blue",
					"333399", "Indigo",
					"333333", "Very dark gray",
					"800000", "Maroon",
					"FF6600", "Orange",
					"808000", "Olive",
					"008000", "Green",
					"008080", "Teal",
					"0000FF", "Blue",
					"666699", "Grayish blue",
					"808080", "Gray",
					"FF0000", "Red",
					"FF9900", "Amber",
					"99CC00", "Yellow green",
					"339966", "Sea green",
					"33CCCC", "Turquoise",
					"3366FF", "Royal blue",
					"800080", "Purple",
					"999999", "Medium gray",
					"FF00FF", "Magenta",
					"FFCC00", "Gold",
					"FFFF00", "Yellow",
					"00FF00", "Lime",
					"00FFFF", "Aqua",
					"00CCFF", "Sky blue",
					"993366", "Red violet",
					"FFFFFF", "White",
					"FF99CC", "Pink",
					"FFCC99", "Peach",
					"FFFF99", "Light yellow",
					"CCFFCC", "Pale green",
					"CCFFFF", "Pale cyan",
					"99CCFF", "Light sky blue",
					"CC99FF", "Plum"
				),
				'custom_colors' => true
			)
		);
		private $options;

		public static function Instance() {
			static $instance = null;
			if ($instance === null) {
				$instance = new self();
			}
			return $instance;
		}

		private function __construct() {
			$this->plugin_dir = dirname( __FILE__ );
			$this->plugin_dir_url = plugin_dir_url( __FILE__ );
			add_action( 'init'              , array( $this, 'load_blockade' ), PHP_INT_MAX ); // run this action last, so all post types are populated
			add_filter( 'extra_wp_blockade_custom_block_headers', array( $this, 'wp_blockade_custom_block_headers' ) );
			add_action( 'the_post'          , array( $this, 'wp_blockade_disable_wpautop' ) );
			add_filter( 'the_content'       , array( $this, 'filter_blockade_shortcodes' ), ~PHP_INT_MAX );
			add_filter( 'the_content'       , array( $this, 'wp_blockade_strip_data_tags' ) );
			add_action( 'loop_end'          , array( $this, 'wp_blockade_enable_wpautop' ) );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles_and_scripts' ) );
			add_action( 'admin_post_wp-blockade-shortcode-render', array( $this, 'render_shortcode_preview') );
		}

		// Public Static Functions ACCESSIBLE WITHOUT INSTANTIATION
		public static function scan_folder_for_blocks( $dir ) {
			$blocks = array();
			if( is_dir( $dir ) ) {
				$files = WP_Blockade::rglob( $dir, '*.php' );
				foreach( $files as $file ) {
					$header = get_file_data( $file, array(), "wp_blockade_custom_block" );
					if( isset( $header['Block Name'] ) && $header['Block Name'] ) {
						if( isset( $header['Slug'] ) && $header['Slug'] ) {
							$slug = sanitize_title( $header['Slug'] );
						} else {
							$slug = sanitize_title( $header['Block Name'] );
						}
						$slug = str_replace( '-', '_', $slug );
						$header['File'] = $file;
						$blocks[ $slug ] = $header;
					}
				}
			}
			return $blocks;
		}

		// Public Functions
		public function wp_blockade_custom_block_headers( $headers ) {
			$headers[] = "Block Name";
			$headers[] = "Block URI";
			$headers[] = "Slug";
			$headers[] = "Description";
			$headers[] = "Icon";
			$headers[] = "Version";
			$headers[] = "Author";
			$headers[] = "Author URI";
			$headers[] = "License";
			$headers[] = "License URI";
			return $headers;
		}

		public function load_blockade() {
			$this->populate_settings();
			if( ( defined( 'WP_BLOCKADE_FORCE_LOAD' ) && WP_BLOCKADE_FORCE_LOAD ) || ( is_admin() && !( defined( 'DOING_AJAX' ) && DOING_AJAX ) && current_user_can( 'edit_pages' ) ) ) {
				add_filter('tiny_mce_before_init', array( $this, 'blockade_modify_tinymce_options' ) );
			}
		}

		public function force_blockade() {
			define( 'WP_BLOCKADE_FORCE_LOAD', true );
			remove_filter('tiny_mce_before_init', array( $this, 'blockade_modify_tinymce_options' ) );
			add_filter('tiny_mce_before_init', array( $this, 'blockade_modify_tinymce_options' ) );
		}

		public function blockade_modify_tinymce_options( $tinymce_options ) {
			$post_type = "";
			try {
				if( function_exists('get_current_screen') )
				$screen = get_current_screen();
				$post_type = $screen->post_type;
			} catch( Exception $e ) {
				// do something?
			}
			$editor = ltrim( $tinymce_options['selector'], '#' );
			if(
				( defined( 'WP_BLOCKADE_FORCE_LOAD' ) && WP_BLOCKADE_FORCE_LOAD ) || // blockade was forced or
				( $editor == 'content' && in_array( $post_type, $this->post_types ) ) ||   // this is the main editor of a known post type or
				( in_array( $editor, $this->editors ) )                                    // this is a custom editor
			) {
				define( 'WP_BLOCKADE_FORCE_LOAD', false );
				// add our plugins
				$plugins = array();
				$custom_plugins = apply_filters( 'wp-blockade-tinymce-plugins', array() );
				$external_plugins = array_merge( $this->options['required_plugins'], $custom_plugins );
				$external_plugins = $this->parse_path_variables( $external_plugins );
				if( isset( $tinymce_options['external_plugins'] ) && $tinymce_options['external_plugins'] ) {
					$plugins = json_decode( $tinymce_options['external_plugins'], true );
				}
				if( isset( $plugins ) && is_array( $plugins ) ) {
					$plugins = array_merge( $plugins, $external_plugins );
				} else {
					$plugins = $external_plugins;
				}
				$tinymce_options['external_plugins'] = json_encode( $plugins );
				// remove unwanted buttons
				$tinymce_options['toolbar1'] = $this->blockade_modify_csl( $tinymce_options['toolbar1'], null, array( 'wp_more', 'wp_adv' ) );
				$tinymce_options['toolbar2'] = $this->blockade_modify_csl( $tinymce_options['toolbar2'], null, array( 'outdent', 'indent' ) );
				// add our buttons
				$custom_buttons = apply_filters( 'wp-blockade-top-level-buttons', array() );
				$buttons = array_merge( $this->options['required_buttons'], $custom_buttons );
				if( isset( $tinymce_options['toolbar3'] ) && $tinymce_options['toolbar3'] ) {
					$tinymce_options['toolbar3'] = $this->blockade_modify_csl( $tinymce_options['toolbar3'], $buttons );
				} else {
					$tinymce_options['toolbar3'] = implode( ',', $buttons );
				}
				// set color palette
				if( isset( $this->options['color_palette'] ) ) {
					$palette = $this->options['color_palette'];
					if( isset( $palette['rows'] ) && $palette['rows'] !== null ) {
						$tinymce_options['textcolor_rows'] = $palette['rows'];
					}
					if( isset( $palette['cols'] ) && $palette['cols'] !== null  ) {
						$tinymce_options['textcolor_cols'] = $palette['cols'];
					}
					if( isset( $palette['colors'] ) && $palette['colors'] !== "null"  ) {
						$tinymce_options['textcolor_map'] = json_encode( $palette['colors'] );
					}
					$tinymce_options['wp_blockade_allow_custom_colors'] = true;
					if( isset( $palette['custom_colors'] ) && !$palette['custom_colors'] ) {
						$this->options['bad_plugins'][] = 'colorpicker';
						$tinymce_options['blockade_allow_custom_colors'] = false;
					}
				}
				$bootstrap = get_theme_support( 'bootstrap' );
				$bootstrap_major_version = "3";
				if( $bootstrap && !empty( $bootstrap[0] ) ) {
					$bootstrap = $bootstrap[0];
					$bootstrap_major_version = $bootstrap[0];
				}
				$framework_css = $this->plugin_dir_url . 'assets/css/wp-blockade-bootstrap.v3.3.7.min.css';
				if( $bootstrap && version_compare( $bootstrap, '4.0.0.a.0', '>=' ) ) {
					$framework_css = $this->plugin_dir_url . 'assets/css/wp-blockade-bootstrap.v4.0.0.a6.min.css';
				}
				$tinymce_options['wp_blockade_bootstrap_major_version'] = $bootstrap_major_version;
				$tinymce_options['wp_blockade_framework_css'] = apply_filters( 'wp-blockade-framework-css', $framework_css );
				// remove offending plugins
				$tinymce_options['plugins'                ] = $this->blockade_modify_csl( $tinymce_options['plugins'], null, $this->options['bad_plugins'] );
				// fix the &nbsp; issue
				$tinymce_options['entities'               ] = '160,nbsp,38,amp,60,lt,62,gt';
				$tinymce_options['entity_encoding'        ] = 'named';
				// let's allow links to wrap block-level elements
				$valid_children = "+a[div|h1|h2|h3|h4|h5|h6|p|ol|ul|dl|pre|address|blockquote|div|hr|table]";
				if( !empty( $tinymce_options['valid_children'] ) ) {
					$tinymce_options['valid_children'] .= ',' . $valid_children;
				} else {
					$tinymce_options['valid_children'] = $valid_children;
				}
				// further tinymce tweaks
				$tinymce_options['wordpress_adv_hidden'   ] = false;
				$tinymce_options['wpautop'                ] = false;
				$tinymce_options['remove_linebreaks'      ] = false;
				$tinymce_options['apply_source_formatting'] = true;
				$tinymce_options['forced_root_block'      ] = '';
			}
			// explicitly set variable so non-blockade tinymce's dont accidentally inherit it
			if(!isset($tinymce_options['external_plugins']) || !$tinymce_options['external_plugins']) {
				$tinymce_options['external_plugins'] = "{}";
			}
			return $tinymce_options;
		}

		public function wp_blockade_disable_wpautop( $post ) {
			if( !empty( $this->post_types ) && in_array( $post->post_type, $this->post_types ) ) {
				remove_filter( 'the_content', 'wpautop' );
				remove_filter( 'the_excerpt', 'wpautop' );
				$this->wpautop_disabled = true;
			} elseif( $this->wpautop_disabled ) {
				add_filter( 'the_content', 'wpautop' );
				add_filter( 'the_excerpt', 'wpautop' );
				$this->wpautop_disabled = false;
			}
		}

		public function wp_blockade_enable_wpautop($query) {
			if( $this->wpautop_disabled ) {
				add_filter( 'the_content', 'wpautop' );
				add_filter( 'the_excerpt', 'wpautop' );
				$this->wpautop_disabled = false;
			}
		}

		public function filter_blockade_shortcodes( $content ) {
			$pattern = '/<!--wp-blockade-shortcode::(\[[^\]]+\])-->/';
			$content = preg_replace( $pattern , "$1" , $content );
			return $content;
		}

		public function wp_blockade_strip_data_tags($content) {
			$post_type = get_post_type();
			if( !in_array( $post_type, $this->post_types ) ) {
				return $content;
			}
			$attributes = array(
				"data-wp-blockade-role",
				"data-wp-blockade-type",
				"data-wp-blockade-flags"
			);
			$attributes = apply_filters( 'wp-blockade-data-attributes', $attributes );

			$filtered = $content;
			foreach($attributes as $attribute) {
				$pattern = "/<[^>]*?(\s+".$attribute."\s*=\s*(?:(?:[\"][^\"]*[\"])|(?:'[^']*')))[^>]*?>/m";
				$matches = array();
				preg_match_all( $pattern, $filtered, $matches, PREG_OFFSET_CAPTURE );
				if( isset( $matches[1] ) && count( $matches[1] ) ) {
					$toKill = array_reverse( $matches[1] );
					foreach( $toKill as $match ) {
						$filtered = substr_replace( $filtered, "", $match[1], strlen( $match[0] ) );
					}
				}
			}
			$filtered = '<div class="wp-blockade">' . $filtered . '</div>';
			return $filtered;
		}

		public function enqueue_styles_and_scripts() {
			// bootstrap 3
			$bootstrap = get_theme_support( 'bootstrap' );
			$blockade  = get_theme_support( 'wp-blockade' );
			if( !$blockade && !$bootstrap ) {
				wp_enqueue_style( 'wp-blockade-bootstrap', $this->plugin_dir_url . 'assets/css/wp-blockade-bootstrap.v3.3.7.min.css', false, 'v3.3.7' );
			}
			wp_enqueue_style( 'wp-blockade-defaults', $this->plugin_dir_url . 'assets/css/wp-blockade-defaults.css', false );
		}

		public function get_active_post_types() {
			$post_types = apply_filters( 'wp-blockade-override-post-types', $this->options['active_post_types'] );
			$post_types = array_merge( $this->options['required_post_types'], $post_types );
			return $post_types;
		}

		public function render_shortcode_preview() {
			add_filter('show_admin_bar', '__return_false');
			if( isset( $_GET['shortcode'] ) && $_GET['shortcode'] ) {
				$shortcode = stripslashes( $_GET['shortcode'] );
				$wrapping_classes = "";
				if( isset( $_GET['classes'] ) && $_GET['classes'] ) {
					$wrapping_classes = esc_attr( $_GET['classes'] );
				}
				$post_id = get_option('page_on_front');
				if( isset( $_GET['post'] ) && $_GET['post'] ) {
					$post_id = intval( $_GET['post'] );
				}
				$this->masquerade_as_post( $post_id );
				?>
				<!DOCTYPE html>
				<html lang="en">
					<head>
						<meta charset="utf-8">
						<meta http-equiv="X-UA-Compatible" content="IE=edge">
						<meta name="viewport" content="width=device-width, initial-scale=1">
						<?php wp_head(); ?>
						<style>
							#wpadminbar {
								display: none;
							}
							html, body, body > .wp_blockade {
								margin: 0 !important;
								padding: 0 !important;
								background-color: transparent !important;
							}
						</style>
					</head>
					<body <?php body_class('wp-blockade-shortcode-preview'); ?>>
						<div class="wp_blockade">
							<div class="<?php echo $wrapping_classes; ?>">
								<?php echo do_shortcode( $shortcode ); ?>
							</div>
						</div>
						<?php wp_footer(); ?>
					</body>
				</html>
				<?php
			}
			die();
		}

		// Private Functions
		private function populate_settings() {
			$disallowed_post_types = array(
				'attachment',
				'revision',
				'nav_menu_item'
			);
			$disallowed_post_types = apply_filters( 'wp-blockade-disallowed-post-types', $disallowed_post_types );
			$saved_options = get_option('wp-blockade');
			if( !$saved_options ) {
				$saved_options = array();
			}
			$this->options = array_merge( $this->default_opts, $saved_options );
			$addons_dir = $this->plugin_dir . '/addons';
			$custom_dirs = apply_filters( 'wp-blockade-register-addon-dir', array() );
			$parent_dir = get_template_directory() . '/blockade';
			$child_dir  = get_stylesheet_directory() . '/blockade';
			$available_addons = $this->scan_folder_for_blocks( $addons_dir );
			foreach( $custom_dirs as $dir ) {
				$available_addons = array_merge($available_addons, $this->scan_folder_for_blocks( $dir ) );
			}
			$available_addons = array_merge($available_addons, $this->scan_folder_for_blocks( $parent_dir ) );
			if( $parent_dir != $child_dir ) {
				$available_addons = array_merge($available_addons, $this->scan_folder_for_blocks( $child_dir ) );
			}
			$this->options['available_addons'] = apply_filters( 'wp-blockade-available-addons', $available_addons );
			$plugins = array();

			if( is_array( $this->options['active_addons'] ) ) {
				foreach( $this->options['active_addons'] as $slug ) {
					if( isset( $this->options['available_addons'][$slug] ) ) {
						$plugins[] = $this->options['available_addons'][$slug]['File'];
					}
				}
			} else {
				if( $this->options['active_addons'] == 'ALL' ) {
					foreach( $this->options['available_addons'] as $plugin ) {
						$plugins[] = $plugin['File'];
					}
				}
			}
			foreach( $plugins as $plugin ) {
				include( $plugin );
			}
			$post_types = get_post_types();
			$this->options['available_post_types'] = array_diff( $post_types, $disallowed_post_types );
			// set active post types from available post types
			$active_post_types = array();
			foreach( $this->options['selected_post_types'] as $post_type ) {
				if( in_array( $post_type, $this->options['available_post_types'] ) ) {
					$active_post_types[] = $post_type;
				}
			}
			$this->options['active_post_types'] = $active_post_types;
			// color options
			$palette = get_theme_support('wp-blockade-palette');
			if( $palette ) {
				$colors = null;
				$rows   = null;
				$cols   = null;
				$custom_colors = true;
				if( isset( $palette[0] ) && is_array( $palette[0] ) ) {
					$colors = array();
					foreach($palette[0] as $name => $hex ) {
						$colors[] = str_replace('#', '', $hex);
						$colors[] = $name;
					}
					$this->options['color_palette']['colors'] = $colors;
					// <- if we want an option to include the default colors, we'd do it here
					$count = count( $colors ) / 2 + 1; // the additional entry is for the "clear" option
					$cols  = ceil( sqrt( $count ) );
					$rows  = 0;
					if( $cols >  0 ) {
						$rows  = ceil( $count / $cols );
					}
					$this->options['color_palette']['cols'] = $cols;
					$this->options['color_palette']['rows'] = $rows;
				}
				$this->options['color_palette']['custom_colors'] = !isset( $palette[1] ) || $palette[1];
			}
			$post_types = apply_filters( 'wp-blockade-override-post-types', $this->options['active_post_types'] );
			$this->post_types = array_merge( $this->options['required_post_types'], $post_types );
			$this->editors = apply_filters( 'wp-blockade-override-editors', $this->options['editors'] );
		}

		private function parse_path_variables( $paths ) {
			if( is_array( $paths ) ) {
				$parsed_paths = array();
				foreach( $paths as $name => $path ) {
					$find = array(
						'{{PLUGIN_DIR}}',
						'{{PARENT_DIR}}',
						'{{CHILD_DIR}}',
						'{{THEME_DIR}}',
						'{{VERSION}}'
					);
					$replace = array(
						$this->plugin_dir_url,
						get_template_directory_uri(),
						get_stylesheet_directory_uri(),
						get_stylesheet_directory_uri(),
						$this->version
					);
					$path = apply_filters( 'wp-blockade-parse-path', $path );
					$path = str_replace( $find, $replace, $path );
					$parsed_paths[$name] = $path;
				}
				$paths = $parsed_paths;
			}
			return $paths;
		}

		private function blockade_modify_csl($list, $add = null, $remove = null) {
			if(!$add) {
				$add = array();
			}
			if(!$remove) {
				$remove = array();
			}
			$list = explode(',', $list);
			$new_list = array();
			foreach($list as $item) {
				if(!in_array($item, $remove)) {
					$new_list[] = $item;
				}
			}
			foreach($add as $item) {
				if(!in_array($item, $new_list)) {
					$new_list[] = $item;
				}
			}
			return implode(',', $new_list);
		}
		// after running this, you are essentially on this post's page until the script exits;
		private function masquerade_as_post( $post_id ) {
			$post = get_post( $post_id );
			if( $post ) {
				$permalink = get_the_permalink( $post );
				$_SERVER['PHP_SELF'   ] = '/'. trim( parse_url( home_url(), PHP_URL_PATH ), '/' ) . '/index.php';
				$_SERVER['PATH_INFO'  ] = "";
				$_SERVER['REQUEST_URI'] = '/'. trim( parse_url( $permalink, PHP_URL_PATH ), '/' );
				global $wp, $wp_query, $wp_the_query;
				$wp = $wp_query = $wp_the_query = null;
				$wp_the_query = $wp_query = new WP_Query();
				$wp = new WP();
				wp();
			}
		}
		// Private Static Functions ACCESSIBLE TO PUBLIC STATIC FUNCTIONS
		private static function rglob($dir, $pattern, $flags = 0) {
			$files = glob( $dir . '/' . $pattern, $flags );
			foreach( glob( $dir.'/*', GLOB_ONLYDIR|GLOB_NOSORT ) as $dir ) {
				$files = array_merge( $files, WP_Blockade::rglob( $dir, $pattern, $flags ) );
			}
			return $files;
		}
	}
	WP_Blockade::Instance();
}
