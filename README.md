# ES|QL Composer

- ... provides a novel approach to building [ES|QL](https://www.elastic.co/guide/en/elasticsearch/reference/current/esql.html) queries.
- ... is not an official [Elastic](https://www.elastic.co/) project.
- ... is under construction.

## Usage

### Requirements

To take advantage of all ES|QL Composer features, you should have:

1. An Anthropic API key (since we use beta features, only direct access is supported).
1. An URL and key of an Elasticsearch cluster with some data (it should allow access from the browser.)

### Features

Core workflows:

1. Generate schema for your ES indices.
1. Edit ES|QL using natural language.
1. Compose ES|QL blocks visually.
1. Run queries against your data.

The following features help save your money, time and network bandwith:

- Cached prompts have lower pricing and latency.
- External requests provide visual indication with a loader.
- You can also edit the query text manually.
- The cheapest model is used by default.
- A `LIMIT` visual block is shown when fetching data.

It is especially useful for R&D of ES|QL-related tasks, as you can:

- Customize the provided ES|QL reference guide.
- Count the number of tokens in the guides.
- See the request statistics and export history.
- Run it locally.

In terms of the user experince, ES|QL Composer:

- Progressively discloses available actions.
- Can store configuration in `LocalStorage`.
- Neither tracks your nor uploads your data.

### Design Language

| Color             | Related to...                                                                |
| ----------------- | ------------------------------------------------------------------ |
| Orange | Anthropic API |
| Teal | Your Elasticsearch instance |
| Purple | ES\|QL concepts |
| Green | Simple action |
| Red | Destructive action |

| Shape             | Concept                 | Interaction                                |
| ----------------- | ------------------------| ----------------------------------------- |
| Solid Button | API request | Click to start, visual feedback |
| Outline Button | Free API request | Click to start, visual feedback |
| Ghost Button | Action |  Click to perform immediately |
| Outline Text | ES\|QL Field  | Drag to change order |
| 'Out' icon + text | External link | Click to open in a new tab |

### Feedback

A good way to provide feedback is through GitHub issues.

## Developer Stuff

### Tech Stack

This is a purely client-side app, built with:

- Typescript
- React
- Chakra UI
- Anthropic SDK
- other open-source libraries

Queries are run directly against Elasticsearch instance, without using an SDK, as it [does not support running in the browser](https://github.com/elastic/elasticsearch-js#browser).

We use some recently shipped and beta features of Anthropic API:

- Haiku 3.5 and the new Sonnet 3.5 (waiting for Opus 3.5!)
- [Token counting (beta)](https://docs.anthropic.com/en/docs/build-with-claude/token-counting)
- [Prompt caching (beta)](https://www.anthropic.com/news/prompt-caching)

### Local Installation

Just the regular frontend stuff, though I have not been able to fix dependencies yet:

```sh
git clone git@github.com:ilyannn/esql-composer.git && cd esql-composer
npm install --legacy-peer-deps
npm start
```

### Roadmap

Some features that I might (no promise) get to implement if I have time:

- Visual Composer support for more commands and actions.
- Better text editor with syntax highlighting and classic autocomplete.
- More examples of non-trivial queries and for ES|QL functions.
- Read [Prompt Engineering Text-to-QueryDSL Using Claude 3 Models](https://github.com/aws-samples/text-to-queryDSL/blob/main/text2ES_prompting_guide.ipynb).
- Healing queries with and without an LLM trip.
- More useful descriptions of user-provided indices.
- Modernize the dependencies.
- Improve the color palette.
- Additional demo datasets.

## Acknowledgements

- [My employer](https://www.elastic.co) and various colleagues (too many to mention).
