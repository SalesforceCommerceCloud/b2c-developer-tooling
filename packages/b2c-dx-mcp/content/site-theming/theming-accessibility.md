---
description: Accessibility guidelines and WCAG compliance rules for theming
alwaysApply: false
---
# Accessibility Guidelines for Theming

## 🎯 Accessibility Requirements

**All theming implementations MUST comply with WCAG 2.1 Level AA standards at minimum.**

### Color Contrast Requirements

**WCAG 2.1 Contrast Ratios:**
- **Normal text (16px and below)**: Minimum 4.5:1 contrast ratio
- **Large text (18pt+ or 14pt+ bold)**: Minimum 3:1 contrast ratio
- **AAA compliance (recommended)**: 7:1 for normal text, 4.5:1 for large text

**Critical Color Combinations to Validate:**
1. Primary text on primary background
2. Secondary text on secondary background
3. Button text on button background
4. Link text on page background
5. Accent colors on all background variations
6. Muted text on muted backgrounds
7. Border colors against adjacent backgrounds

### Visual Hierarchy and Readability

**Text Readability:**
- Ensure sufficient contrast for all text sizes
- Avoid using similar brightness levels for text and background
- Test color combinations in both light and dark themes
- Consider users with color vision deficiencies

**Interactive Elements:**
- Buttons must have clear visual distinction from backgrounds
- Hover states must maintain or improve contrast
- Focus indicators must be clearly visible (minimum 3:1 contrast)
- Disabled states should still be readable (minimum 3:1 contrast)

### Font Accessibility

**Font Readability Requirements:**
- Body text should use fonts optimized for screen reading
- Minimum font size: 16px for body text (recommended)
- Line height: Minimum 1.5 for body text
- Letter spacing: Ensure adequate spacing for readability
- Font weights: Ensure sufficient contrast between weights

**Font Loading Performance:**
- Web fonts should not block rendering
- Provide appropriate fallback fonts
- Consider font-display: swap for better performance
- Test font loading on slow connections

### Color Vision Deficiency Considerations

**Design for Color Blindness:**
- Don't rely solely on color to convey information
- Use patterns, icons, or text labels in addition to color
- Test color combinations with color blindness simulators
- Ensure sufficient contrast even when colors are desaturated

**Common Color Blindness Types:**
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)
- Monochromacy (total color blindness)

### Focus and Keyboard Navigation

**Focus Indicators:**
- All interactive elements must have visible focus indicators
- Focus indicators must have minimum 3:1 contrast ratio
- Focus indicators should be at least 2px thick
- Use outline or border to indicate focus state

**Keyboard Accessibility:**
- All interactive elements must be keyboard accessible
- Tab order should be logical and intuitive
- Skip links should be provided for long pages
- Focus trap should be implemented in modals

### Screen Reader Considerations

**Semantic HTML:**
- Use proper heading hierarchy (h1-h6)
- Use semantic HTML elements (nav, main, article, etc.)
- Provide alt text for images
- Use ARIA labels when necessary

**Color and Screen Readers:**
- Screen readers don't convey color information
- Ensure information is accessible without color
- Use text labels, icons, or patterns in addition to color

### Testing and Validation

**Required Testing:**
1. Automated contrast checking (WCAG AA/AAA)
2. Manual visual inspection
3. Color blindness simulator testing
4. Screen reader testing
5. Keyboard navigation testing

**Tools for Validation:**
- Color contrast analyzers (WebAIM, WAVE)
- Color blindness simulators
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Browser accessibility inspectors

### Implementation Guidelines

**When Implementing Themes:**
1. Always validate color contrast ratios before implementation
2. Test with multiple color combinations
3. Provide alternative color suggestions if contrast fails
4. Document accessibility decisions
5. Test with assistive technologies

**If Accessibility Issues Are Found:**
- Present findings clearly to the user
- Provide specific contrast ratios and WCAG compliance status
- Suggest concrete alternatives with improved contrast
- Explain the accessibility impact
- Wait for user confirmation before proceeding
