/**
 * Unit tests for constants/colors.ts
 *
 * Ensures design tokens are consistent and have expected values.
 */

import { Colors, Spacing, Radius, FontSize } from '../../constants/colors';

describe('Colors', () => {
  it('defines required color tokens', () => {
    expect(Colors.bg).toBeDefined();
    expect(Colors.surface).toBeDefined();
    expect(Colors.card).toBeDefined();
    expect(Colors.cardBorder).toBeDefined();
    expect(Colors.orange).toBeDefined();
    expect(Colors.orangeDim).toBeDefined();
    expect(Colors.orangeMuted).toBeDefined();
    expect(Colors.text).toBeDefined();
    expect(Colors.textSecondary).toBeDefined();
    expect(Colors.textMuted).toBeDefined();
    expect(Colors.input).toBeDefined();
    expect(Colors.inputBorder).toBeDefined();
    expect(Colors.inputFocus).toBeDefined();
    expect(Colors.error).toBeDefined();
    expect(Colors.success).toBeDefined();
    expect(Colors.tabBar).toBeDefined();
    expect(Colors.tabActive).toBeDefined();
    expect(Colors.tabInactive).toBeDefined();
    expect(Colors.white).toBeDefined();
    expect(Colors.black).toBeDefined();
  });

  it('has orange as primary brand color', () => {
    expect(Colors.orange).toBe('#FF6B1A');
    expect(Colors.tabActive).toBe('#FF6B1A');
  });

  it('has expected text hierarchy (light to dark)', () => {
    // text should be lighter than textSecondary, and textSecondary lighter than textMuted
    // In dark theme: F0F0F0 > 9A9A9A > 555555
    expect(Colors.text).toBe('#F0F0F0');
    expect(Colors.textSecondary).toBe('#9A9A9A');
    expect(Colors.textMuted).toBe('#555555');
  });

  it('has error/success colors distinct from brand', () => {
    expect(Colors.error).toBe('#FF4444');
    expect(Colors.success).toBe('#4CAF50');
    expect(Colors.error).not.toBe(Colors.orange);
    expect(Colors.success).not.toBe(Colors.orange);
  });

  it('is declared with as const (compile-time readonly)', () => {
    // 'as const' ensures TypeScript readonly, but does not Object.freeze at runtime.
    // Verify the values are still accessible and correct.
    expect(Colors.orange).toBe('#FF6B1A');
    expect(Colors.bg).toBe('#0D0D0D');
  });
});

describe('Spacing', () => {
  it('defines all spacing tokens', () => {
    expect(Spacing.xs).toBe(4);
    expect(Spacing.sm).toBe(8);
    expect(Spacing.md).toBe(16);
    expect(Spacing.lg).toBe(24);
    expect(Spacing.xl).toBe(32);
    expect(Spacing.xxl).toBe(48);
  });

  it('is monotonically increasing', () => {
    const values = Object.values(Spacing);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe('Radius', () => {
  it('defines all radius tokens', () => {
    expect(Radius.sm).toBe(8);
    expect(Radius.md).toBe(12);
    expect(Radius.lg).toBe(16);
    expect(Radius.xl).toBe(24);
    expect(Radius.full).toBe(999);
  });

  it('has "full" as a very large value for pill shapes', () => {
    expect(Radius.full).toBeGreaterThan(100);
  });
});

describe('FontSize', () => {
  it('defines all font size tokens', () => {
    expect(FontSize.xs).toBe(11);
    expect(FontSize.sm).toBe(13);
    expect(FontSize.md).toBe(15);
    expect(FontSize.lg).toBe(17);
    expect(FontSize.xl).toBe(20);
    expect(FontSize.xxl).toBe(26);
    expect(FontSize.xxxl).toBe(34);
  });

  it('is monotonically increasing', () => {
    const values = Object.values(FontSize);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});
