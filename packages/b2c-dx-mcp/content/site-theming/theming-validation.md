---
description: Theming validation rules and validation gate workflow
alwaysApply: false
---
# Theming Validation Rules

## 🔄 WORKFLOW - PHASE 2: VALIDATION GATE (MANDATORY - CANNOT SKIP)

**⚠️ CRITICAL: YOU CANNOT PROCEED TO IMPLEMENTATION WITHOUT COMPLETING THIS PHASE**

**STEP 7: CONSTRUCT COLOR MAPPING (MANDATORY IF COLORS PROVIDED)**
- **After collecting all user answers, you MUST construct a `colorMapping` object**
- **Map each color to its specific usage based on user answers:**
  - Text colors (foreground on background)
  - Button colors (button text on button background)
  - Link colors (link text on page background)
  - Accent colors (accent elements on various backgrounds)
  - All other color combinations that will be used
- **This mapping is REQUIRED - you cannot skip this step**

**STEP 8: MANDATORY VALIDATION TOOL CALL**
- **YOU MUST call the `site_theming` tool AGAIN with `colorMapping` in `conversationContext.collectedAnswers`**
- **This is a SEPARATE tool call - do NOT implement after collecting answers**
- **This triggers automatic validation that you CANNOT skip**
- **See "HOW TO TRIGGER VALIDATION" section below for details**
- **⚠️ CRITICAL: If you skip this tool call and proceed to implementation, you are making a CRITICAL ERROR**

**STEP 9: PRESENT VALIDATION FINDINGS**
- **After the tool returns validation results, you MUST present ALL validation results to the user**
- **Show the complete validation output from the tool, including:**
  - All contrast ratios for each color combination
  - WCAG compliance status (AA/AAA/FAIL)
  - Visual assessment (excellent/good/acceptable/poor)
  - Any recommendations provided by the tool
- **If ANY issues found:**
  - Show contrast ratios and WCAG compliance status
  - Explain accessibility problems clearly
  - Provide concrete alternative suggestions
  - **WAIT for user confirmation before proceeding**
- **Even if all validations pass, you MUST still present the results to the user**

**STEP 10: USER CONFIRMATION**
- **You MUST wait for explicit user confirmation to proceed**
- **User must acknowledge validation findings (even if they choose to proceed with issues)**
- **Do NOT implement until user explicitly confirms they want to proceed**

### PHASE 3: IMPLEMENTATION (ONLY AFTER PHASE 2 COMPLETE)

**STEP 11: Implementation**
- **ONLY after completing ALL steps above may you implement the theme**
- **Specifically, you MUST have:**
  1. Collected all user answers
  2. Constructed colorMapping object
  3. Called the tool with colorMapping (STEP 8)
  4. Received validation results from the tool
  5. Presented validation results to user (STEP 9)
  6. Received user confirmation (STEP 10)
- **If you implement before completing Phase 2, you are making a CRITICAL ERROR**
- **If you implement without calling the tool with colorMapping, you are making a CRITICAL ERROR**

**Where to apply theme changes:**
- **For StorefrontNext/Odyssey projects:** Apply theme changes to `app.css`
  - Standalone project: `src/app.css`
  - Monorepo: `packages/template-retail-rsc-app/src/app.css`
- Update CSS custom properties in the `:root` block (light theme) and `.dark` / `[data-theme='dark']` blocks (dark theme) as needed
- **If the project uses a different theme file structure** (e.g., multiple CSS files, custom theme location): Ask the user to specify the destination file before implementing

### ✅ PRE-IMPLEMENTATION CHECKLIST (BLOCKING GATE)

**🛑 YOU CANNOT IMPLEMENT UNTIL ALL ITEMS BELOW ARE COMPLETE**

**This checklist is a MANDATORY BLOCKING GATE - you MUST verify each item before proceeding:**

- [ ] **Item 1:** All required questions answered
- [ ] **Item 2:** Constructed `colorMapping` object mapping all colors to their usage (text, buttons, links, accents, etc.)
- [ ] **Item 3:** Called `site_theming` tool AGAIN with `colorMapping` in `conversationContext.collectedAnswers` (this is a separate tool call, not the same call where you collected answers)
- [ ] **Item 4:** Received validation results from the tool (the tool automatically validates when colorMapping is provided)
- [ ] **Item 5:** Presented ALL validation findings to user (even if all pass) - show contrast ratios, WCAG status, visual assessment
- [ ] **Item 6:** If issues found, provided specific contrast ratios, WCAG status, and alternative suggestions
- [ ] **Item 7:** Received explicit user confirmation to proceed (user acknowledged findings)
- [ ] **Item 8:** Font validation completed (if fonts provided)
- [ ] **Item 9:** All validation concerns addressed or user explicitly chose to proceed despite issues

**ONLY when ALL items above are checked may you proceed to implementation.**

**⚠️ IF YOU IMPLEMENT WITHOUT COMPLETING THIS CHECKLIST, YOU ARE MAKING A CRITICAL ERROR.**

## ✅ VALIDATION

**⚠️ MANDATORY: Input Validation** - BEFORE implementing, you MUST validate ALL user-provided inputs:

### A. Color Combination Validation (MANDATORY if colors provided):

- Calculate contrast ratios for ALL color combinations (text on background, accent on backgrounds, etc.)
- Check WCAG AA/AAA compliance (4.5:1 for normal text, 3:1 for large text)
- Identify ANY accessibility issues or poor contrast combinations
- Visual/UX impact explanation - whether the combinations look good, are readable, and maintain visual hierarchy
- If issues are found, present them to the user with:
  * Specific contrast ratios and WCAG compliance status
  * Clear explanation of the accessibility problem
  * Concrete alternative suggestions with improved contrast ratios

### B. Font Validation (MANDATORY if fonts provided):

- Verify font availability and accessibility (can it be loaded? Is it a real font?)
- Check if font is available on Google Fonts, Adobe Fonts, or needs custom hosting
- Validate font weights availability (does the font support the weights needed?)
- Assess font readability/legibility (especially for body text)
- Check font loading performance implications (web fonts vs system fonts)
- Evaluate font pairing (if multiple fonts provided, do they work well together?)
- Verify fallback fonts are appropriate
- If issues are found, present them to the user with:
  * Specific concerns (availability, readability, performance, etc.)
  * Clear explanation of the problem
  * Concrete alternative suggestions (e.g., Google Fonts equivalents, better pairings)
  * Performance/UX impact explanation

### C. General Input Validation:

- Validate any other user-provided inputs (spacing, sizes, etc.) if applicable
- Check for potential conflicts or issues

### IMPORTANT:

- **Validation is MANDATORY even if inputs seem fine**
- **DO NOT skip validation or implement without validating ALL provided inputs**
- **Call the tool with `colorMapping` to trigger automatic validation (see "HOW TO TRIGGER VALIDATION" above)**
- **Always respect the user's final decision** - if they insist on their choices after your suggestions, use them as specified

### 🚨 HOW TO TRIGGER VALIDATION:

**⚠️ CRITICAL: This is a SEPARATE tool call that you MUST make AFTER collecting all user answers OR when user provides/updates colorMapping.**

**Process:**
1. Construct `colorMapping` object mapping colors to usage (text, buttons, links, accents, hover states, etc.)
2. Call the `site_theming` tool with `colorMapping` (include ALL previously collected information):

```javascript
{
  conversationContext: {
    currentStep: "validation",
    collectedAnswers: {
      colors: [...all colors...],
      fonts: [...all fonts...],
      colorMapping: {
        textColor: "#635BFF",
        background: "#FFFFFF",
        buttonBackground: "#0A2540",
        buttonText: "#FFFFFF",
        linkColor: "#0A2540",
        accent: "#0A2540",
        // ... all combinations
      },
      // ... all other collected information
    },
    questionsAsked: [...]
  }
}
```

**The tool automatically:**
- Calculates contrast ratios for all color combinations
- Checks WCAG AA/AAA compliance
- Provides visual assessment
- Returns validation results

**You MUST then:**
- Present ALL validation results to the user
- Wait for user confirmation
- Only then proceed to implementation

**⚠️ IF YOU SKIP THIS TOOL CALL AND PROCEED TO IMPLEMENTATION, YOU ARE MAKING A CRITICAL ERROR.**

**Note:** If user provides updated colorMapping at any time, call the tool with updated information (see information gathering phase for update process). Validation will trigger automatically when colorMapping is provided.
