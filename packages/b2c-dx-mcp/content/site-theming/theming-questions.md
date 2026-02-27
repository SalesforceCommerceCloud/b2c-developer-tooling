---
description: Theming questions and information gathering guidelines
alwaysApply: false
---
# Theming Questions and Information Gathering

## ⚠️ CRITICAL: Layout Preservation Rules

**NEVER modify positioning, layout, or structural CSS properties when applying theming changes. Only change colors, typography, and visual styling.**

### What NOT to Change:
- `position` properties (fixed, absolute, relative)
- `top`, `left`, `right`, `bottom` positioning
- `margin` and `padding` values
- `width`, `height`, `min-height`, `max-height`
- `display` properties (flex, grid, block)
- `z-index` values (unless specifically requested)
- `transform` properties
- Grid/flexbox layout properties

### What TO Change:
- `color`, `background-color`, `border-color`
- `text-decoration`, `font-weight`, `font-size`
- `opacity`, `box-shadow`, `border-radius`
- CSS custom properties (CSS variables)
- Hover states and transitions
- Theme-specific styling

### Example of CORRECT theming:
```css
/* ✅ CORRECT - Only changing colors and visual styling */
.navigation-item {
  color: var(--foreground);
  background-color: var(--background);
  border-color: var(--border);
  transition: color 0.2s ease;
}

.navigation-item:hover {
  color: var(--accent);
  background-color: var(--accent/10);
}
```

### Example of INCORRECT theming:
```css
/* ❌ INCORRECT - Changing layout/positioning */
.navigation-item {
  margin-left: 20px; /* DON'T change margins */
  position: relative; /* DON'T change positioning */
  z-index: 100; /* DON'T change z-index */
  width: 200px; /* DON'T change dimensions */
}
```

### When Layout Changes Are Needed:
If layout modifications are required, they should be:
1. Explicitly requested by the user
2. Clearly separated from theming changes
3. Documented as layout fixes, not theming
4. Tested thoroughly for responsive behavior

## 📋 Specification Compliance Rules

**ALWAYS follow user specifications exactly. Never make assumptions or interpretations.**

### ⚠️ **CRITICAL: WAIT FOR USER RESPONSE RULE**

**NEVER implement changes after asking clarifying questions without waiting for the user's response.**

**Required Process:**
1. Ask clarifying questions
2. **WAIT for user response** ⚠️ **CRITICAL STEP**
3. Only implement after receiving explicit guidance
4. Never proceed with assumptions

**Violations:**
- ❌ Ask questions then immediately implement
- ❌ Make assumptions about color/font mapping
- ❌ Proceed without explicit user guidance
- ❌ Implement "best guess" solutions

### ✅ **Color Specification Rules:**
1. **Use exact hex values** provided by the user
2. **Ask for clarification** on color type mapping (e.g., "brand" vs "accent")
3. **Propose color combinations** before implementing:
   - Which color should be primary vs secondary?
   - How should "brand" colors be used vs "accent" colors?
   - Should "dark" colors be used for text or backgrounds?
   - What should be the hover state colors?
4. **Never assume** color usage without explicit user guidance

### ✅ **Font Specification Rules:**
1. **Use exact font names** as provided by the user
2. **Ask for clarification** if font names are unclear or unfamiliar
3. **Verify font availability** before implementing
4. **Never substitute** similar fonts without user permission

### ✅ **General Specification Rules:**
1. **Follow exact specifications** without interpretation
2. **Ask clarifying questions** when specifications are ambiguous
3. **Propose implementation approaches** before making changes
4. **Confirm understanding** of requirements before proceeding

### Example of CORRECT specification handling:
```
User: "Use these colors: #635BFF (accent), #0A2540 (dark), #F6F9FC (brand), #FFFFFF (light)"

AI Response: "I see you've provided 4 colors. Before implementing, I'd like to clarify:
- Should #635BFF be used for primary actions and hover states?
- Should #0A2540 be used for text color or background?
- Should #F6F9FC be used for secondary elements or primary branding?
- What should be the light theme vs dark theme color mapping?"

[WAITS for user response before implementing]
```

### Example of INCORRECT specification handling:
```
❌ DON'T: Assume "sohne-var" means "Sohne" font
❌ DON'T: Guess color usage without asking
❌ DON'T: Make assumptions about font weights or styles
❌ DON'T: Implement without confirming understanding
❌ DON'T: Ask clarifying questions then immediately implement
```

## 🔄 WORKFLOW - PHASE 1: INFORMATION GATHERING

**YOU MUST FOLLOW THIS WORKFLOW - NO EXCEPTIONS:**

1. **DO NOT implement any changes yet**
2. **Ask the questions below ONE AT A TIME**
3. **WAIT for the user's response** before asking the next question
4. **Only proceed after ALL required questions are answered**
5. **Even if the user provided colors/fonts upfront, you MUST still ask ALL these clarifying questions**
   - Colors provided? Still ask about color mapping, usage, hover states, etc.
   - Fonts provided? Still ask about font usage, availability, headings vs body, etc.
6. **You MUST ask questions from ALL categories (colors, fonts, general) - do not skip any**

**VIOLATION OF THIS WORKFLOW IS A CRITICAL ERROR.**

### 📝 EXTRACTION

**BEFORE generating questions, you MUST extract and provide the theming information from the user's input.**

1. **Review the user's input** carefully for any theming information:
   - Colors (hex values like "#635BFF", color types like "accent", "primary", "dark", "light")
   - Fonts (font names like "Sohne Var", font types like "title", "body", "heading")
   - Any other theming preferences (spacing, sizes, etc.)

2. **Extract and structure the information** in the following format:
   - Colors: Array of objects with `hex` (string) and `type` (string, optional) properties
   - Fonts: Array of objects with `name` (string) and `type` (string, optional) properties
   - Other info: Key-value pairs as needed

3. **Call this tool again** with the extracted information in `conversationContext.collectedAnswers`:
   ```
   {
     conversationContext: {
       collectedAnswers: {
         colors: [{ hex: "#635BFF", type: "accent" }, { hex: "#0A2540", type: "dark" }, ...],
         fonts: [{ name: "Sohne Var", type: "title" }, ...],
         // ... other info
       }
     }
   }
   ```

4. **Only after providing this information** will the tool generate the appropriate questions.

**IMPORTANT:**
- If the user did NOT mention colors or fonts, you can still call the tool with empty arrays or skip this step
- But if the user DID mention colors/fonts, you MUST extract them before proceeding
- **DO NOT proceed with questions until you have extracted and provided the theming information.**

### 🔄 UPDATING INFORMATION (MANDATORY)

**⚠️ CRITICAL: Whenever the user provides NEW or UPDATED theming information, you MUST call the tool again with the updated information.**

**This applies to:** New/updated colors, fonts, color mappings, or any theming preferences.

**Required Process:**
1. Extract the new/updated information from the user's message
2. Merge with ALL previously collected information (include everything, not just new data)
3. Call the `site_theming` tool IMMEDIATELY with complete updated information
4. If `colorMapping` is provided, validation will trigger automatically (see validation phase)

**Tool call structure:**
```
{
  conversationContext: {
    currentStep: "updating-information" | "validation",
    collectedAnswers: {
      colors: [...all colors, including previous and new...],
      fonts: [...all fonts, including previous and new...],
      colorMapping: {...all mappings, including previous and updated...},
      // ... all other collected information
    },
    questionsAsked: [...previous questions...]
  }
}
```

**⚠️ CRITICAL RULES:**
- Every update requires a new tool call (not optional)
- Include ALL previously collected information in each call
- If user provides `colorMapping`, it triggers automatic validation
- DO NOT implement without calling the tool with updated information first
