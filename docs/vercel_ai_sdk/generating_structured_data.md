Title: AI SDK Core: Generating Structured Data

URL Source: https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data

Markdown Content:
While text generation can be useful, your use case will likely call for generating structured data. For example, you might want to extract information from text, classify data, or generate synthetic data.

Many language models are capable of generating structured data, often defined as using "JSON modes" or "tools". However, you need to manually provide schemas and then validate the generated data as LLMs can produce incorrect or incomplete structured data.

The AI SDK standardises structured object generation across model providers with the [`generateObject`](https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-object) and [`streamObject`](https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-object) functions. You can use both functions with different output strategies, e.g. `array`, `object`, or `no-schema`, and with different generation modes, e.g. `auto`, `tool`, or `json`. You can use [Zod schemas](https://sdk.vercel.ai/docs/ai-sdk-core/schemas-and-zod) or [JSON schemas](https://sdk.vercel.ai/docs/reference/ai-sdk-core/json-schema) to specify the shape of the data that you want, and the AI model will generate data that conforms to that structure.

[Generate Object](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#generate-object)
----------------------------------------------------------------------------------------------------

The `generateObject` generates structured data from a prompt. The schema is also used to validate the generated data, ensuring type safety and correctness.

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
  model: yourModel,
  schema: z.object({
    recipe: z.object({
      name: z.string(),
      ingredients: z.array(z.object({ 
        name: z.string(), 
        amount: z.string() 
      })),
      steps: z.array(z.string()),
    }),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```

[Stream Object](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#stream-object)
------------------------------------------------------------------------------------------------

Given the added complexity of returning structured data, model response time can be unacceptable for your interactive use case. With the [`streamObject`](https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-object) function, you can stream the model's response as it is generated.

```typescript
import { streamObject } from 'ai';

const { partialObjectStream } = await streamObject({
  // ...
});

// use partialObjectStream as an async iterable
for await (const partialObject of partialObjectStream) {
  console.log(partialObject);
}
```

You can use `streamObject` to stream generated UIs in combination with React Server Components (see [Generative UI](https://sdk.vercel.ai/docs/ai-sdk-rsc))) or the [`useObject`](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-object) hook.

[Output Strategy](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#output-strategy)
----------------------------------------------------------------------------------------------------

You can use both functions with different output strategies, e.g. `array`, `object`, or `no-schema`.

### [Object](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#object)

The default output strategy is `object`, which returns the generated data as an object. You don't need to specify the output strategy if you want to use the default.

### [Array](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#array)

If you want to generate an array of objects, you can set the output strategy to `array`. When you use the `array` output strategy, the schema specifies the shape of an array element. With `streamObject`, you can also stream the generated array elements using `elementStream`.

```typescript
import { openai } from '@ai-sdk/openai';
import { streamObject } from 'ai';
import { z } from 'zod';

const { elementStream } = await streamObject({
  model: openai('gpt-4-turbo'),
  output: 'array',
  schema: z.object({
    name: z.string(),
    class: z
      .string()
      .describe('Character class, e.g. warrior, mage, or thief.'),
    description: z.string(),
  }),
  prompt: 'Generate 3 hero descriptions for a fantasy role playing game.',
});

for await (const hero of elementStream) {
  console.log(hero);
}
```

### [Enum](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#enum)

If you want to generate a specific enum value, e.g. for classification tasks, you can set the output strategy to `enum` and provide a list of possible values in the `enum` parameter.

Enum output is only available with `generateObject`.

```typescript
import { generateObject } from 'ai';

const { object } = await generateObject({
  model: yourModel,
  output: 'enum',
  enum: ['action', 'comedy', 'drama', 'horror', 'sci-fi'],
  prompt:
    'Classify the genre of this movie plot: ' +
    '"A group of astronauts travel through a wormhole in search of a ' +
    'new habitable planet for humanity."',
});
```

### [No Schema](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#no-schema)

In some cases, you might not want to use a schema, for example when the data is a dynamic user request. You can use the `output` setting to set the output format to `no-schema` in those cases and omit the schema parameter.

```typescript
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';

const { object } = await generateObject({
  model: openai('gpt-4-turbo'),
  output: 'no-schema',
  prompt: 'Generate a lasagna recipe.',
});
```

[Generation Mode](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#generation-mode)
----------------------------------------------------------------------------------------------------

While some models (like OpenAI) natively support object generation, others require alternative methods, like modified [tool calling](https://sdk.vercel.ai/docs/ai-sdk-core/tools-and-tool-calling). The `generateObject` function allows you to specify the method it will use to return structured data.

*   `auto`: The provider will choose the best mode for the model. This recommended mode is used by default.
*   `tool`: A tool with the JSON schema as parameters is provided and the provider is instructed to use it.
*   `json`: The response format is set to JSON when supported by the provider, e.g. via json modes or grammar-guided generation. If grammar-guided generation is not supported, the JSON schema and instructions to generate JSON that conforms to the schema are injected into the system prompt.

Please note that not every provider supports all generation modes. Some providers do not support object generation at all.

[Schema Name and Description](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#schema-name-and-description)
----------------------------------------------------------------------------------------------------------------------------

You can optionally specify a name and description for the schema. These are used by some providers for additional LLM guidance, e.g. via tool or schema name.

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
  model: yourModel,
  schemaName: 'Recipe',
  schemaDescription: 'A recipe for a dish.',
  schema: z.object({
    name: z.string(),
    ingredients: z.array(z.object({ 
      name: z.string(), 
      amount: z.string() 
    })),
    steps: z.array(z.string()),
  }),
  prompt: 'Generate a lasagna recipe.',
});
```

[Error Handling](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#error-handling)
--------------------------------------------------------------------------------------------------

When you use `generateObject`, errors are thrown when the model fails to generate proper JSON (`JSONParseError`) or when the generated JSON does not match the schema (`TypeValidationError`). Both error types contain additional information, e.g. the generated text or the invalid value.

You can use this to e.g. design a function that safely process the result object and also returns values in error cases:

```typescript
import { openai } from '@ai-sdk/openai';
import { JSONParseError, TypeValidationError, generateObject } from 'ai';
import { z } from 'zod';

const recipeSchema = z.object({
  recipe: z.object({
    name: z.string(),
    ingredients: z.array(z.object({ 
      name: z.string(), 
      amount: z.string() 
    })),
    steps: z.array(z.string()),
  }),
});

type Recipe = z.infer<typeof recipeSchema>;

async function generateRecipe(
  food: string,
): Promise<
  | { type: 'success'; recipe: Recipe }
  | { type: 'parse-error'; text: string }
  | { type: 'validation-error'; value: unknown }
  | { type: 'unknown-error'; error: unknown }
> {
  try {
    const result = await generateObject({
      model: openai('gpt-4-turbo'),
      schema: recipeSchema,
      prompt: `Generate a ${food} recipe.`,
    });
    return { type: 'success', recipe: result.object };
  } catch (error) {
    if (TypeValidationError.isTypeValidationError(error)) {
      return { type: 'validation-error', value: error.value };
    } else if (JSONParseError.isJSONParseError(error)) {
      return { type: 'parse-error', text: error.text };
    } else {
      return { type: 'unknown-error', error };
    }
  }
}
```

[More Examples](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#more-examples)
------------------------------------------------------------------------------------------------

You can see `generateObject` and `streamObject` in action using various frameworks in the following examples:

### [`generateObject`](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#generateobject)

### [`streamObject`](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data#streamobject)