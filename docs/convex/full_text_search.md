# Full Text Search

Full text search allows you to find Convex documents that approximately match a search query.

Unlike normal [document queries](/database/reading-data/#querying-documents), search queries look _within_ a string field to find the keywords. Search queries are useful for building features like searching for messages that contain certain words.

Search queries are automatically reactive, consistent, transactional, and work seamlessly with pagination. They even include new documents created with a mutation!

**Example:** [Search App](https://github.com/get-convex/convex-demos/tree/main/search)

To use full text search you need to:

1.  Define a search index.
2.  Run a search query.

Search indexes are built and queried using Convex's multi-segment search algorithm on top of [Tantivy](https://github.com/quickwit-oss/tantivy), a powerful, open-source, full-text search library written in Rust.

## Defining search indexes[​](#defining-search-indexes "Direct link to Defining search indexes")

Like [database indexes](/database/reading-data/indexes/), search indexes are a data structure that is built in advance to enable efficient querying. Search indexes are defined as part of your Convex [schema](/database/schemas).

Every search index definition consists of:

1.  A name.
    *   Must be unique per table.
2.  A `searchField`
    *   This is the field which will be indexed for full text search.
    *   It must be of type `string`.
3.  \[Optional\] A list of `filterField`s
    *   These are additional fields that are indexed for fast equality filtering within your search index.

To add a search index onto a table, use the [`searchIndex`](/api/classes/server.TableDefinition#searchindex) method on your table's schema. For example, if you want an index which can search for messages matching a keyword in a channel, your schema could look like:

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    channel: v.string(),
  }).searchIndex("search_body", {
    searchField: "body",
    filterFields: ["channel"],
  }),
});
```

You can specify search and filter fields on nested documents by using a dot-separated path like `properties.name`.

## Running search queries[​](#running-search-queries "Direct link to Running search queries")

A query for "10 messages in channel '#general' that best match the query 'hello hi' in their body" would look like:

```typescript
const messages = await ctx.db
  .query("messages")
  .withSearchIndex("search_body", (q) =>
    q.search("body", "hello hi").eq("channel", "#general"),
  )
  .take(10);
```

This is just a normal [database read](/database/reading-data/) that begins by querying the search index!

The [`.withSearchIndex`](/api/interfaces/server.QueryInitializer#withsearchindex) method defines which search index to query and how Convex will use that search index to select documents. The first argument is the name of the index and the second is a _search filter expression_. A search filter expression is a description of which documents Convex should consider when running the query.

A search filter expression is always a chained list of:

1.  1 search expression against the index's search field defined with [`.search`](/api/interfaces/server.SearchFilterBuilder#search).
2.  0 or more equality expressions against the index's filter fields defined with [`.eq`](/api/interfaces/server.SearchFilterFinalizer#eq).

### Search expressions[​](#search-expressions "Direct link to Search expressions")

Search expressions are issued against a search index, filtering and ranking documents by their relevance to the search expression's query. Internally, Convex will break up the query into separate words (called _terms_) and approximately rank documents matching these terms.

In the example above, the expression `search("body", "hello hi")` would internally be split into `"hi"` and `"hello"` and matched against words in your document (ignoring case and punctuation).

The behavior of search incorporates [prefix matching rules](#search-behavior).

### Equality expressions[​](#equality-expressions "Direct link to Equality expressions")

Unlike search expressions, equality expressions will filter to only documents that have an exact match in the given field. In the example above, `eq("channel", "#general")` will only match documents that have exactly `"#general"` in their `channel` field.

Equality expressions support fields of any type (not just text).

To filter to documents that are missing a field, use `q.eq("fieldName", undefined)`.

### Other filtering[​](#other-filtering "Direct link to Other filtering")

Because search queries are normal database queries, you can also [filter results](/database/reading-data/#filtering) using the [`.filter` method](/api/interfaces/server.Query#filter)!

Here's a query for "messages containing 'hi' sent in the last 10 minutes":

```typescript
const messages = await ctx.db
  .query("messages")
  .withSearchIndex("search_body", (q) => q.search("body", "hi"))
  .filter((q) => q.gt(q.field("_creationTime"), Date.now() - 10 * 60000))
  .take(10);
```

**For performance, always put as many of your filters as possible into `.withSearchIndex`.**

Every search query is executed by:

1.  First, querying the search index using the search filter expression in `withSearchIndex`.
2.  Then, filtering the results one-by-one using any additional `filter` expressions.

Having a very specific search filter expression will make your query faster and less likely to hit Convex's limits because Convex will use the search index to efficiently cut down on the number of results to consider.

### Retrieving results and paginating[​](#retrieving-results-and-paginating "Direct link to Retrieving results and paginating")

Just like ordinary database queries, you can [retrieve the results](/database/reading-data/#retrieving-results) using [`.collect()`](/api/interfaces/server.Query#collect), [`.take(n)`](/api/interfaces/server.Query#take), [`.first()`](/api/interfaces/server.Query#first), and [`.unique()`](/api/interfaces/server.Query#unique).

Additionally, search results can be [paginated](/database/pagination) using [`.paginate(paginationOpts)`](/api/interfaces/server.OrderedQuery#paginate).

Note that `collect()` will throw an exception if it attempts to collect more than the limit of 1024 documents. It is often better to pick a smaller limit and use `take(n)` or paginate the results.

### Ordering[​](#ordering "Direct link to Ordering")

Search queries always return results in [relevance order](#relevance-order) based on how well the document matches the search query. Different ordering of results are not supported.

## Search Behavior[​](#search-behavior "Direct link to Search Behavior")

### Typeahead Search[​](#typeahead-search "Direct link to Typeahead Search")

Convex full-text search is designed to power as-you-type search experiences. In your search queries, the final search term has _prefix search_ enabled, matching any term that is a prefix of the original term. For example, the expression `search("body", "r")` would match the documents:

*   `"rabbit"`
*   `"send request"`

Fuzzy search matches are deprecated. After January 15, 2025, search results will not include `"snake"` for a typo like `"stake"`.

### Relevance order[​](#relevance-order "Direct link to Relevance order")

**Relevance order is subject to change.** The relevance of search results and the exact typo-tolerance rules Convex applies is subject to change to improve the quality of search results.

Search queries return results in relevance order. Internally, Convex ranks the relevance of a document based on a combination of its [BM25 score](https://en.wikipedia.org/wiki/Okapi_BM25) and several other criteria such as the number of typos of matched terms in the document, the proximity of matches, the number of exact matches, and more. The BM25 score takes into account:

*   How many words in the search query appear in the field?
*   How many times do they appear?
*   How long is the text field?

If multiple documents have the same score, the newest documents are returned first.

## Limits[​](#limits "Direct link to Limits")

Search indexes work best with English or other Latin-script languages. Text is tokenized using Tantivy's [`SimpleTokenizer`](https://docs.rs/tantivy/latest/tantivy/tokenizer/struct.SimpleTokenizer.html), which splits on whitespace and punctuation. We also limit terms to 32 characters in length and lowercase them.

Search indexes must have:

*   Exactly 1 search field.
*   Up to 16 filter fields.

Search indexes count against the [limit of 32 indexes per table](/database/reading-data/indexes/#limits).

Search queries can have:

*   Up to 16 terms (words) in the search expression.
*   Up to 8 filter expressions.

Additionally, search queries can scan up to 1024 results from the search index.



```typescript
// Constants
use tantivy::tokenizer::{
    LowerCaser,
    RemoveLongFilter,
    SimpleTokenizer,
    TextAnalyzer,
};

/// How many words (after stemming) can be in a text query?
pub const MAX_QUERY_TERMS: usize = 16;

/// What is the maximum length of a single text term? We will silently drop
/// terms that exceed this length.
///
/// TODO: Or should we truncate these to a prefix?
pub const MAX_TEXT_TERM_LENGTH: usize = 32;

/// What is the maximum number candidate revisions will we load into memory?
pub const MAX_CANDIDATE_REVISIONS: usize = 1024;

/// How many filter conditions can be on a query?
pub const MAX_FILTER_CONDITIONS: usize = 8;

/// Name of the Convex English tokenizer passed to Tantivy.
pub const CONVEX_EN_TOKENIZER: &str = "convex_en";

/// Max word-length in characters for exact search in typo-tolerance
pub const EXACT_SEARCH_MAX_WORD_LENGTH: usize = 4;

/// Max word-length in characters for 1-typo search in typo-tolerance
pub const SINGLE_TYPO_SEARCH_MAX_WORD_LENGTH: usize = 8;

/// The max number of term matches that can occur for each prefix query term
pub const MAX_PREFIX_MATCHES_PER_QUERY_TERM: usize = 16;

/// The max number of positions we return for each term matched by a query term
pub const MAX_POSITIONS_PER_MATCHED_TERM: usize = 16;

pub const MAX_EDIT_DISTANCE: u32 = 2;

/// The maximum terms we'll return from QueryTokens. This corresponds to the
/// maximum number of posting lists we'll want to consider in a single query.
pub const MAX_UNIQUE_QUERY_TERMS: usize = 64;

pub fn convex_en() -> TextAnalyzer {
    TextAnalyzer::from(SimpleTokenizer)
        .filter(RemoveLongFilter::limit(MAX_TEXT_TERM_LENGTH))
        .filter(LowerCaser)
}
```