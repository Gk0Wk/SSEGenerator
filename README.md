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

sse by default only listens to the default `message` event. Server-Sent Event also supports [custom events](https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events), as an example of the Claude API:

```
event: message_start
data: {"type": "message_start", "message": {"id": "msg_1nZdL29xx5MUA1yADyHTEsnR8uuvGzszyY", "type": "message", "role": "assistant", "content": [], "model": "claude-3-opus-20240229", "stop_reason": null, "stop_sequence": null, "usage": {"input_tokens": 25, "output_tokens": 1}}}

event: content_block_start
data: {"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}}

event: ping
data: {"type": "ping"}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Hello"}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "!"}}

event: content_block_stop
data: {"type": "content_block_stop", "index": 0}

event: message_delta
data: {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence":null, "usage":{"output_tokens": 15}}}

event: message_stop
data: {"type": "message_stop"}
```

Therefore, we need to specify additional events to listen to:

```typescript
for await (const { event, data } of sse({ listen: ['content_block_delta', ...], ... })) { ... }
```

`event` will indicate the name of the current event.

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
