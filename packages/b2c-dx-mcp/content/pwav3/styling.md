# Styling with Chakra UI and Emotion

## Overview

PWA Kit applications use Chakra UI V2 for component styling and theming, with Emotion as the underlying CSS-in-JS engine.

## Chakra UI Components

Import from the Retail React App shared/ui barrel for consistency with the template:

```jsx
import {
    Box,
    Flex,
    Stack,
    Button,
    Heading,
    Text,
    Image
} from '@salesforce/retail-react-app/app/components/shared/ui';

const ProductCard = ({product}) => {
    return (
        <Box borderWidth="1px" borderRadius="lg" p={4}>
            <Image src={product.image} alt={product.name} />
            <Heading size="md" mt={2}>{product.name}</Heading>
            <Text color="gray.600">${product.price}</Text>
            <Button colorScheme="blue" mt={4} width="full">
                Add to Cart
            </Button>
        </Box>
    );
};
```

## Style Props

```jsx
<Box
    // Layout
    display="flex"
    flexDirection="column"
    w="100%"
    maxW="container.lg"

    // Colors
    bg="gray.50"
    color="gray.800"

    // Spacing
    p={8}
    px={4}
    m={4}

    // Typography
    fontSize="lg"
    fontWeight="bold"

    // Borders
    borderWidth="1px"
    borderRadius="md"

    // Effects
    shadow="lg"

    // Pseudo selectors
    _hover={{bg: 'gray.100'}}
/>
```

## Responsive Design

```jsx
<Box
    // Array syntax: [base, sm, md, lg]
    fontSize={['sm', 'md', 'lg', 'xl']}

    // Object syntax
    display={{base: 'block', md: 'flex'}}
    width={{base: '100%', md: '50%'}}
>
    Content
</Box>

<SimpleGrid columns={{base: 1, sm: 2, md: 3, lg: 4}} spacing={6}>
    {products.map(product => (
        <ProductCard key={product.id} product={product} />
    ))}
</SimpleGrid>
```

## Theme Customization

```javascript
// app/theme/index.js (or overrides/app/theme/index.js)
import baseTheme from '@salesforce/retail-react-app/app/theme';
import {extendTheme} from '@salesforce/retail-react-app/app/components/shared/ui';

const theme = extendTheme(baseTheme, {
    colors: {
        brand: {
            50: '#e6f2ff',
            500: '#0073e6',
            900: '#00111a'
        }
    },
    fonts: {
        heading: 'Montserrat, sans-serif',
        body: 'Open Sans, sans-serif'
    },
    components: {
        Button: {
            baseStyle: {
                fontWeight: 'bold'
            },
            variants: {
                solid: {
                    bg: 'brand.500',
                    color: 'white',
                    _hover: {bg: 'brand.600'}
                }
            }
        }
    }
});

export default theme;
```

### Applying Theme

```jsx
// app/components/_app-config/index.jsx
import {ChakraProvider} from '@salesforce/retail-react-app/app/components/shared/ui';
import theme from '@salesforce/retail-react-app/app/theme';

const AppConfig = ({children}) => {
    return (
        <ChakraProvider theme={theme}>
            {children}
        </ChakraProvider>
    );
};
```

## Emotion CSS-in-JS

```jsx
import {css} from '@emotion/react';

const customStyles = css`
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    transition: transform 0.2s;

    &:hover {
        transform: scale(1.05);
    }
`;

const GradientBox = ({children}) => {
    return <Box css={customStyles}>{children}</Box>;
};
```

## Layout Components

### Flex Layout

```jsx
<Flex direction="row" justify="space-between" align="center" gap={4}>
    <Box>Item 1</Box>
    <Box>Item 2</Box>
</Flex>
```

### Grid Layout

```jsx
<Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
    {products.map(product => (
        <ProductCard key={product.id} product={product} />
    ))}
</Grid>
```

### Stack Layout

```jsx
<Stack direction="column" spacing={4}>
    <Heading>Title</Heading>
    <Text>Description</Text>
    <Button>Action</Button>
</Stack>
```

## Pseudo Selectors

```jsx
<Button
    _hover={{
        bg: 'brand.600',
        transform: 'translateY(-2px)'
    }}
    _active={{
        transform: 'translateY(0)'
    }}
    _focus={{
        outline: '2px solid',
        outlineColor: 'brand.500'
    }}
>
    Click me
</Button>
```

## Color Mode (Dark Mode)

```jsx
import {useColorMode, useColorModeValue} from '@chakra-ui/react';

const ThemedComponent = () => {
    const {colorMode, toggleColorMode} = useColorMode();
    const bg = useColorModeValue('white', 'gray.800');
    const color = useColorModeValue('gray.800', 'white');

    return (
        <Box bg={bg} color={color}>
            <Button onClick={toggleColorMode}>
                Toggle {colorMode === 'light' ? 'Dark' : 'Light'}
            </Button>
        </Box>
    );
};
```

## Best Practices

1. Use Chakra UI components
2. Leverage style props
3. Make designs responsive
4. Follow theme structure
5. Use semantic HTML with `as` prop
6. Ensure accessibility
7. Optimize images
8. Test in multiple browsers
9. Use theme tokens
10. Consider performance
