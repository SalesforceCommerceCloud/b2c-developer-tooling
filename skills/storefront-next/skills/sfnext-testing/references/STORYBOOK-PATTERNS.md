# Storybook Patterns Reference

## Story File Structure

```typescript
// src/components/my-component/stories/index.stories.tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from 'storybook/test';
import { waitForStorybookReady } from '@storybook/test-utils';
import { MyComponent } from '../my-component';
import { ConfigProvider } from '@/config/context';
import { mockConfig } from '@/test-utils/config';

const meta: Meta<typeof MyComponent> = {
    title: 'Components/MyComponent',
    component: MyComponent,
    tags: ['autodocs', 'interaction'],
    decorators: [
        (Story) => (
            <ConfigProvider config={mockConfig}>
                <Story />
            </ConfigProvider>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof MyComponent>;
```

## Story Variants

Create stories for different component states:

```typescript
export const Default: Story = {
    args: { title: 'Default Title' },
};

export const Loading: Story = {
    args: { isLoading: true },
};

export const Error: Story = {
    args: { error: 'Something went wrong' },
};

export const Empty: Story = {
    args: { items: [] },
};
```

## Interaction Tests (Play Functions)

```typescript
export const WithInteraction: Story = {
    args: { title: 'Interactive' },
    play: async ({ canvasElement }) => {
        await waitForStorybookReady(canvasElement);
        const canvas = within(canvasElement);

        // Assert initial state
        await expect(canvas.getByText('Interactive')).toBeInTheDocument();

        // Simulate user interaction
        const button = canvas.getByRole('button');
        await userEvent.click(button);

        // Assert result
        await expect(canvas.getByText('Clicked!')).toBeInTheDocument();
    },
};
```

## Decorators

Wrap stories with required providers:

```typescript
// Single provider
decorators: [
    (Story) => (
        <ConfigProvider config={mockConfig}>
            <Story />
        </ConfigProvider>
    ),
],

// Multiple providers
decorators: [
    (Story) => (
        <ConfigProvider config={mockConfig}>
            <AuthProvider auth={mockAuth}>
                <Story />
            </AuthProvider>
        </ConfigProvider>
    ),
],
```

## Responsive Testing

Use Storybook's built-in viewport toolbar instead of creating separate Mobile/Tablet/Desktop stories. The viewport selector in the toolbar lets you test components at different screen sizes interactively.

## Accessibility Testing

Stories with the `autodocs` tag are automatically included in a11y test runs. Use `skip-a11y` only for stories that intentionally violate a11y rules (e.g., testing error states):

```typescript
export const ErrorState: Story = {
    tags: ['skip-a11y'],
    args: { error: 'Missing required field' },
};
```

## Story Coverage

Run `pnpm generate:story-tests:coverage` to check which components have stories and which need them. Every reusable component in `src/components/` should have a corresponding `.stories.tsx` file.
