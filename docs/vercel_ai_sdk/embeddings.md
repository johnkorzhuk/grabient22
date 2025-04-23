Title: AI SDK Core: Embeddings

URL Source: https://sdk.vercel.ai/docs/ai-sdk-core/embeddings

Markdown Content:
Embeddings are a way to represent words, phrases, or images as vectors in a high-dimensional space. In this space, similar words are close to each other, and the distance between words can be used to measure their similarity.

[Embedding a Single Value](https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#embedding-a-single-value)
------------------------------------------------------------------------------------------------------

The AI SDK provides the [`embed`](https://sdk.vercel.ai/docs/reference/ai-sdk-core/embed) function to embed single values, which is useful for tasks such as finding similar words or phrases or clustering text. You can use it with embeddings models, e.g. `openai.embedding('text-embedding-3-large')` or `mistral.embedding('mistral-embed')`.

```typescript
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

// 'embedding' is a single embedding object (number[])
const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
});
```

[Embedding Many Values](https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#embedding-many-values)
------------------------------------------------------------------------------------------------

When loading data, e.g. when preparing a data store for retrieval-augmented generation (RAG), it is often useful to embed many values at once (batch embedding).

The AI SDK provides the [`embedMany`](https://sdk.vercel.ai/docs/reference/ai-sdk-core/embed-many) function for this purpose. Similar to `embed`, you can use it with embeddings models, e.g. `openai.embedding('text-embedding-3-large')` or `mistral.embedding('mistral-embed')`.

```typescript
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';

// 'embeddings' is an array of embedding objects (number[][]).
// It is sorted in the same order as the input values.
const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: [
    'sunny day at the beach',
    'rainy afternoon in the city',
    'snowy night in the mountains',
  ],
});
```

[Embedding Similarity](https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#embedding-similarity)
----------------------------------------------------------------------------------------------

After embedding values, you can calculate the similarity between them using the [`cosineSimilarity`](https://sdk.vercel.ai/docs/reference/ai-sdk-core/cosine-similarity) function. This is useful to e.g. find similar words or phrases in a dataset. You can also rank and filter related items based on their similarity.

```typescript
import { openai } from '@ai-sdk/openai';
import { cosineSimilarity, embedMany } from 'ai';

const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: ['sunny day at the beach', 'rainy afternoon in the city'],
}); 

console.log(
  `cosine similarity: ${cosineSimilarity(embeddings[0], embeddings[1])}`,
);
```

[Token Usage](https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#token-usage)
----------------------------------------------------------------------------

Many providers charge based on the number of tokens used to generate embeddings. Both `embed` and `embedMany` provide token usage information in the `usage` property of the result object:

```typescript
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const { embedding, usage } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
});

console.log(usage); // { tokens: 10 }
```

[Settings](https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#settings)
----------------------------------------------------------------------

### [Retries](https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#retries)

Both `embed` and `embedMany` accept an optional `maxRetries` parameter of type `number` that you can use to set the maximum number of retries for the embedding process. It defaults to `2` retries (3 attempts in total). You can set it to `0` to disable retries.

```typescript
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
  maxRetries: 0, // Disable retries
});
```

### [Abort Signals and Timeouts](https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#abort-signals-and-timeouts)

Both `embed` and `embedMany` accept an optional `abortSignal` parameter of type [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) that you can use to abort the embedding process or set a timeout.

```typescript
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
  abortSignal: AbortSignal.timeout(1000), // Abort after 1 second
});
```

### [Custom Headers](https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#custom-headers)

Both `embed` and `embedMany` accept an optional `headers` parameter of type `Record<string, string>` that you can use to add custom headers to the embedding request.

```typescript
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'sunny day at the beach',
  headers: { 'X-Custom-Header': 'custom-value' },
});
```

[Embedding Providers & Models](https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#embedding-providers--models)
-------------------------------------------------------------------------------------------------------------

Several providers offer embedding models:

| Provider             | Model                         | Embedding Dimensions |
|----------------------|-------------------------------|----------------------|
| OpenAI               | text-embedding-3-large        | 3072                 |
| OpenAI               | text-embedding-3-small        | 1536                 |
| OpenAI               | text-embedding-ada-002        | 1536                 |
| Google Generative AI | text-embedding-004            | 768                  |
| Mistral              | mistral-embed                 | 1024                 |
| Cohere               | embed-english-v3.0            | 1024                 |
| Cohere               | embed-multilingual-v3.0       | 1024                 |
| Cohere               | embed-english-light-v3.0      | 384                  |
| Cohere               | embed-multilingual-light-v3.0 | 384                  |
| Cohere               | embed-english-v2.0            | 4096                 |
| Cohere               | embed-english-light-v2.0      | 1024                 |
| Cohere               | embed-multilingual-v2.0       | 768                  |
| Amazon Bedrock       | amazon.titan-embed-text-v1    | 1024                 |
| Amazon Bedrock       | amazon.titan-embed-text-v2:0  | 1024                 |