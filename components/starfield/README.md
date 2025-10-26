# Starfield Component

An interactive, animated starfield background component with hover effects and performance optimizations.

## Features

- **Upward Drift Animation**: Stars gently drift upward at varying speeds
- **Interactive Hover Effect**: On mouse hover, stars accelerate and align into a horizontal band with smooth easing
- **Performance Optimized**: 
  - Offscreen canvas rendering
  - Throttled resize handling
  - RequestAnimationFrame-based animation
- **Accessibility**: 
  - Respects `prefers-reduced-motion` media query
  - Proper ARIA attributes
  - Fallback static gradient for reduced-motion users
- **Configurable**: Customizable density, color, speed, and glow intensity

## Usage

```tsx
import { Starfield } from '@/components/starfield';

function MyComponent() {
  return (
    <Starfield 
      density={200}
      color="rgba(163, 163, 163, 1)"
      baseSpeed={0.5}
      hoverSpeedMultiplier={3}
      glowIntensity={0.8}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `density` | `number` | `200` | Number of stars to render |
| `color` | `string` | `'rgba(163, 163, 163, 1)'` | Color of the stars (supports rgba format) |
| `baseSpeed` | `number` | `0.5` | Base speed of star upward drift |
| `hoverSpeedMultiplier` | `number` | `3` | Speed multiplier when hovering |
| `glowIntensity` | `number` | `0.8` | Intensity of the star glow effect (0-1) |
| `className` | `string` | `''` | Additional CSS classes to apply |

## Implementation Details

### Animation Behavior

**Default State**: Stars drift upward at varying speeds based on their individual `baseSpeed` multiplied by a random factor (0.5-2.0).

**Hover State**: When the user moves their mouse over the canvas:
- Stars accelerate to `baseSpeed * hoverSpeedMultiplier`
- Stars smoothly transition to align horizontally around the mouse Y position
- A cubic ease-in-out easing function is applied for smooth transitions

**Hover Exit**: Stars revert to their default upward drift behavior

### Performance Optimizations

1. **Offscreen Canvas**: Rendering is done on an offscreen canvas and then copied to the visible canvas, reducing flickering and improving performance
2. **Throttled Resize**: Window resize events are throttled with a 150ms delay to prevent excessive recomputations
3. **Delta Time**: Animation uses delta time to ensure consistent speed regardless of frame rate
4. **Efficient Drawing**: Uses gradient fills and requestAnimationFrame for optimal rendering

### Accessibility

- **Reduced Motion**: Component checks for `prefers-reduced-motion` and:
  - Reduces animation speed by 90%
  - Shows a simple static gradient fallback instead of animated stars
- **ARIA Attributes**: Canvas is marked with `aria-hidden="true"` and `role="presentation"` as it's decorative
- **Pointer Events**: Canvas has `pointer-events-none` to ensure it doesn't interfere with foreground UI interactions

## Browser Compatibility

Compatible with all modern browsers that support:
- Canvas API
- RequestAnimationFrame
- CSS `prefers-reduced-motion` media query

## Performance Considerations

- Tested to maintain 60fps on modern desktop and mobile devices
- Star density can be adjusted for lower-powered devices
- Automatically pauses when the component is unmounted
- Memory-efficient star recycling (stars reset position when off-screen)
