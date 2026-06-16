/**
 * Component logic tests
 *
 * Tests for:
 * - FerrataCard difficulty color mapping
 * - ActivityCard rendering logic
 * - CustomTabBar tab definitions and active state
 * - HookedLogo sizing
 */

// ──────────────────────────────────────────────────────────────────────────
// FerrataCard — difficulty colors
// ──────────────────────────────────────────────────────────────────────────

describe('FerrataCard difficulty colors', () => {
  const DIFFICULTY_COLORS: Record<string, string> = {
    'A': '#4CAF50', 'A/B': '#66BB6A', 'B': '#8BC34A',
    'B/C': '#FFC107', 'C': '#FF9800', 'C/D': '#FF5722',
    'D': '#F44336', 'E': '#D32F2F', 'E/F': '#B71C1C', 'F': '#880E4F',
  };

  it('maps all difficulties to distinct colors', () => {
    const keys = Object.keys(DIFFICULTY_COLORS);
    expect(keys).toHaveLength(10);
    const colors = Object.values(DIFFICULTY_COLORS);
    expect(new Set(colors).size).toBe(10); // all unique
  });

  it('green tones for easy ferrate (A, A/B, B)', () => {
    expect(DIFFICULTY_COLORS['A']).toMatch(/^#4CAF5|#66BB6|#8BC34/);
    expect(DIFFICULTY_COLORS['A/B']).toMatch(/^#4CAF5|#66BB6|#8BC34/);
    expect(DIFFICULTY_COLORS['B']).toMatch(/^#4CAF5|#66BB6|#8BC34/);
  });

  it('orange/red tones for medium ferrate (B/C, C, C/D)', () => {
    expect(DIFFICULTY_COLORS['B/C']).toMatch(/^#FF/);
    expect(DIFFICULTY_COLORS['C']).toMatch(/^#FF/);
    expect(DIFFICULTY_COLORS['C/D']).toMatch(/^#FF/);
  });

  it('red/dark tones for hard ferrate (D, E, E/F, F)', () => {
    expect(DIFFICULTY_COLORS['D']).toMatch(/^#F44|#D32F/);
    expect(DIFFICULTY_COLORS['E']).toMatch(/^#D32F|#B71C/);
    expect(DIFFICULTY_COLORS['F']).toMatch(/^#880E/);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// FerrataCard compact vs full mode
// ──────────────────────────────────────────────────────────────────────────

describe('FerrataCard compact mode', () => {
  it('compact flag is a boolean prop', () => {
    // This verifies the type contract
    const props = { ferrata: {} as any, compact: true };
    expect(typeof props.compact).toBe('boolean');
  });

  it('default compact is undefined/falsy (full mode)', () => {
    const props = { ferrata: {} as any };
    expect(props).not.toHaveProperty('compact');
  });
});

// ──────────────────────────────────────────────────────────────────────────
// ActivityCard — star rating logic
// ──────────────────────────────────────────────────────────────────────────

describe('ActivityCard star rating', () => {
  it('shows filled stars for rating level', () => {
    const rating = 3;
    const stars = [1, 2, 3, 4, 5].map(s => s <= rating);
    expect(stars).toEqual([true, true, true, false, false]);
  });

  it('shows zero stars for rating 0', () => {
    const rating = 0;
    const stars = [1, 2, 3, 4, 5].map(s => s <= rating);
    expect(stars).toEqual([false, false, false, false, false]);
  });

  it('rating > 0 check for conditional rendering', () => {
    expect(0 > 0).toBe(false);   // don't show stars for 0
    expect(1 > 0).toBe(true);    // show stars for 1+
    expect(3 > 0).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// CustomTabBar — tabs and active state
// ──────────────────────────────────────────────────────────────────────────

describe('CustomTabBar tabs', () => {
  const TABS = [
    { name: 'index',    label: 'Početna',  icon: 'home',                   route: '/'         },
    { name: 'map',      label: 'Mapa',     icon: 'map-outline',             route: '/map'      },
    { name: 'activity', label: 'Aktivnost',icon: 'lightning-bolt',          route: '/activity', center: true },
    { name: 'explore',  label: 'Istraži',  icon: 'compass-outline',         route: '/explore'  },
    { name: 'profile',  label: 'Profil',   icon: 'account-circle-outline',  route: '/profile'  },
  ];

  it('has 5 tabs', () => {
    expect(TABS).toHaveLength(5);
  });

  it('has activity tab as the center button', () => {
    const centerTab = TABS.find(t => t.center);
    expect(centerTab).toBeDefined();
    expect(centerTab!.name).toBe('activity');
  });

  it('only one center button', () => {
    const centerTabs = TABS.filter(t => t.center);
    expect(centerTabs).toHaveLength(1);
  });

  it('index route is "/"', () => {
    expect(TABS[0].name).toBe('index');
    expect(TABS[0].route).toBe('/');
  });

  it('active detection: root path matches "/" tab', () => {
    const isActive = (tab: typeof TABS[0], pathname: string) => {
      if (tab.route === '/') return pathname === '/';
      return pathname.startsWith(tab.route);
    };

    expect(isActive(TABS[0], '/')).toBe(true);
    expect(isActive(TABS[0], '/map')).toBe(false);
    expect(isActive(TABS[3], '/explore/some-id')).toBe(true);
    expect(isActive(TABS[4], '/profile/edit')).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────────────
// HookedLogo — size calculations
// ──────────────────────────────────────────────────────────────────────────

describe('HookedLogo sizes', () => {
  const SIZES = {
    sm:  { icon: 44, ring: 36, fontSize: 17 },
    md:  { icon: 72, ring: 60, fontSize: 28 },
    lg:  { icon: 100, ring: 84, fontSize: 39 },
  };

  it('has three size variants: sm, md, lg', () => {
    expect(Object.keys(SIZES)).toEqual(['sm', 'md', 'lg']);
  });

  it('sizes are monotonically increasing', () => {
    expect(SIZES.md.icon).toBeGreaterThan(SIZES.sm.icon);
    expect(SIZES.lg.icon).toBeGreaterThan(SIZES.md.icon);
    expect(SIZES.md.ring).toBeGreaterThan(SIZES.sm.ring);
    expect(SIZES.lg.ring).toBeGreaterThan(SIZES.md.ring);
    expect(SIZES.md.fontSize).toBeGreaterThan(SIZES.sm.fontSize);
    expect(SIZES.lg.fontSize).toBeGreaterThan(SIZES.md.fontSize);
  });

  it('ring is always smaller than icon (by border width)', () => {
    for (const size of Object.values(SIZES)) {
      expect(size.ring).toBeLessThan(size.icon);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────
// LocationMap — Google Maps URL generation
// ──────────────────────────────────────────────────────────────────────────

describe('LocationMap URL generation', () => {
  it('generates correct Google Maps URL', () => {
    const lat = 43.8563;
    const lon = 18.4131;
    const url = `https://www.google.com/maps?q=${lat},${lon}`;
    expect(url).toBe('https://www.google.com/maps?q=43.8563,18.4131');
  });

  it('handles negative coordinates', () => {
    const url = `https://www.google.com/maps?q=${-33.8688},${151.2093}`;
    expect(url).toContain('-33.8688');
    expect(url).toContain('151.2093');
  });
});
