# SSE Generator

`sse-generator` is a lightweight Server-Sent Events (SSE) request library designed to provide an easy way for asynchronously invoking realtime data streams on the client side.

[中文文档](https://github.com/Gk0Wk/SSEGenerator/blob/main/README_zh.md)

```typescript
for await (const { data, id, lastId } of sse({ ... })) {
  console.log(data, id, lastId);
}
```

Background: Recently, various online LLM services have widely adopted the SSE format as the response to streaming API requests, and the handling of SSE requests on the frontend has become increasingly common. To simplify the development process, we developed `sse-generator`, a lightweight SSE request library that can help you quickly implement the handling of SSE requests.

Special thanks to `sse.js`, `sse-generator` is developed based on it, extending its functionality to meet the needs of modern frontend development in SSE streaming invocation.

## Features

- **Zero Dependencies**: Maintaining a lightweight characteristic, easy to integrate and deploy.
- **Ease of Use**: Simplified handling of streaming invocation allowing you to focus more on data processing than on the communication mechanism.
- **Highly Configurable**: Provides a wealth of configuration options to adapt to different invocation scenarios.

## How to Use

### Direct inclusion in the HTML page

You can directly include the UMD version of `sse-generator` in your HTML page:

Note that the `sse` function will be mounted on the global object `ssegenerator`.

```html
<script src="https://cdn.jsdelivr.net/npm/sse-generator/dist/umd/index.js"></script>
<script>
window.ssegenerator.sse({ ... })
</script>
```

### Using module import

You can also import `sse-generator` using module import:

```bash
npm install sse-generator
```

```typescript
import { sse } from 'sse-generator';

// Use the sse function
async function test() {
  for await (const { data } of sse({
    baseURL: 'https://api.openai.com',
    url: '/v1/chat/completions',
    data: {
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'user', content: 'Hi!' },
      ],
      headers: {
        Authorization: 'Bearer YOUR_API_KEY',
      }
    },
    onError: (error, xhr) => console.error(`Code: ${xhr?.status}, Error: ${error}`),
  })) {
    console.log(JSON.parse(data).choices[0].delta.content);
  }
}
```

Otherwise, you can use the `getXMLHTTPRequest` parameter to get the `XMLHTTPRequest` object to implement more custom features, such as terminating a request:

```javascript
import { sse } from 'sse-generator';

async function test(getTerminate) {
  for await (const { data } of sse({
    getXMLHTTPRequest: xhr => {
      getTerminate(() => xhr.abort());
    },
  })) {
    console.log(data);
  }
}

// Terminate the request after 3 seconds
test(terminate => setTimeout(terminate, 3000));
```

## API Interface

The table below lists the main interface parameters, parsing, and usage of the `sse` function.

| Parameter           | Type                     | Description                                      |
| ------------------- | ------------------------ | ------------------------------------------------ |
| `baseURL`           | `string`                 | Base URL, all requests will be based on this URL |
| `url`               | `string`                 | Request URL, if `baseURL` exists, this URL is relative |
| `data`              | `any`                    | Request data, non-string will be JSON serialized |
| `headers`           | `object`                 | Custom request headers                           |
| `method`            | `string`                 | Request method, defaults to `GET`, `data` not null changes to `POST` |
| `withCredentials`   | `boolean`                | Whether cross-origin requests should include credentials |
| `debug`             | `boolean`                | Whether to enable debug mode, printing information to the console |
| `getXMLHTTPRequest` | `function`               | Called after connection, used to get `XMLHTTPRequest` object |
| `onError`           | `function`               | Error callback, called when an error occurs       |

## Generator Payload Type Description

The table below lists the payload types of the `sse` function generator and their corresponding parsing.

| Payload Type    | Type                      | Description                                      |
| --------------- | ------------------------- | ------------------------------------------------ |
| `data`          | `string`                  | Unparsed message content, usually a JSON string  |
| `id`            | `string`                  | Event ID (if present)                            |
| `lastId`        | `string`                  | Previous event ID (if present)                   |

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Publish

```bash
npm publish
```

Other commands:

```bash
npm run lint         # Lint and fix source files
npm run change       # Add a new changeset
npm run bump         # Update version and changelog via changeset
npm run release      # Release the package
```
