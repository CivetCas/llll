module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,vue}'],
  theme: {
    flex: {
      1: '1 1 0%',
      auto: '1 1 auto',
      initial: '0 1 auto',
      inherit: 'inherit',
      none: 'none',
      2: '2 2 0%'
    },
    extend: {
      textColor: {
        link: 'var(--link-default-color)',
        default: 'var(--text-default-color)',
        subtitle: 'var(--text-subtitle-color)',
        'sidebar-hover': 'var(--sidebar-hover-text-color)',
        icon: 'var(--icon-default-color)',
        play: 'var(--player-icon-color)',
        'play-hover': 'var(--player-icon-hover-color)',
        prevnext: 'var(--player-left-icon-color)',
        disabled: 'var(--disabled-color)',
        inactive: 'var(--link-inactive-color)'
      },
      backgroundColor: {
        theme: 'var(--theme-background-color)',
        sidebar: 'var(--sidebar-background-color)',
        content: 'var(--content-background-color)',
        'sidebar-hover': 'var(--sidebar-hover-background-color)',
        'search-input': 'var(--search-input-background-color)',
        'footer-main': 'var(--footer-main-background-color)',
        'draggable-bar': 'var(--footer-player-bar-background-color)',
        'draggable-bar-current': 'var(--footer-player-bar-cur-background-color)',
        'draggable-bar-button': 'var(--footer-player-bar-cur-button-color)',
        menu: 'var(--footer-header-background-color)',
        button: 'var(--button-background-color)'
      },
      borderColor: {
        default: 'var(--line-default-color)',
        active: 'var(--link-active-color)'
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
};
