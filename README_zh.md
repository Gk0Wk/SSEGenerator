# SSE Generator

`sse-generator` 是一个轻量级服务器发送事件（Server-Sent Events, SSE）请求库，旨在提供一种简便的方式在浏览器端异步调用实时数据流。

```typescript
for await (const { data, id, lastId } of sse({ ... })) {
  console.log(data, id, lastId);
}
```

开发背景：最近各种在线 LLM 服务广泛采用 SSE 格式作为流式 API 请求响应，相关前端对 SSE 请求的处理也越来越普遍。为了简化开发流程，我们开发了 `sse-generator`，它是一个轻量级的 SSE 请求库，可以帮助你快速实现 SSE 请求的处理。

特别感谢 `sse.js`，`sse-generator` 是在它的基础上进行开发的，扩展了它的功能以满足现代前端开发中对 SSE 流式调用的需求。

## 特性

- **零依赖**：保持了轻量级的特点，易于集成和部署。
- **易于使用**：简化了流式调用的处理，让你更专注于数据的处理而非通信机制。
- **高度可配置**：提供了丰富的配置选项，以适应不同的调用场景。

## 如何使用

### 直接在 HTML 页面中引入

你可以直接在 HTML 页面中引入 `sse-generator` 的 UMD 版本：

注意此时`sse`函数会被挂载在全局对象的`ssegenerator`中。

```html
<script src="https://cdn.jsdelivr.net/npm/sse-generator/dist/umd/index.js"></script>
<script>
  window.ssegenerator.sse({ ... })
</script>
```

### 使用模块化引入

你也可以通过模块化引入 `sse-generator`：

```bash
npm install sse-generator
```

```typescript
import { sse } from 'sse-generator';

// 使用 sse 函数
async function test() {
  for await (const { data } of sse({
    baseURL: 'https://api.openai.com',
    url: '/v1/chat/completions',
    data: {
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: 'Hi!' }],
      headers: {
        Authorization: 'Bearer YOUR_API_KEY',
      },
    },
    onError: (error, xhr) =>
      console.error(`Code: ${xhr?.status}, Error: ${error}`),
  })) {
    console.log(JSON.parse(data).choices[0].delta.content);
  }
}
```

以及，你可以使用 `getXMLHTTPRequest` 参数来获取 `XMLHTTPRequest` 对象，以实现更多的自定义功能，例如终止一个请求：

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

// 3s 后终止请求
test(terminate => setTimeout(terminate, 3000));
```

sse 默认只监听了默认的 `message` 事件，Server-Send Event 还支持[自定义的其他事件](https://html.spec.whatwg.org/multipage/server-sent-events.html#server-sent-events)，以 Claude API 为例：

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

此时我们需要指定监听额外的事件：

```typescript
for await (const { event, data } of sse({ listen: ['content_block_delta', ...], ... })) { ... }
```

`event` 会指明当前事件的名称。

## API 接口

以下表格列出了 `sse` 函数的主要接口参数、解析和使用方式。

| 参数                | 类型                | 描述                                               |
| ------------------- | ------------------- | -------------------------------------------------- |
| `baseURL`           | `string`            | 基础 URL，所有请求会基于这个 URL 进行              |
| `url`               | `string`            | 请求的 URL，若 `baseURL` 存在，则此 URL 为相对路径 |
| `data`              | `any`               | 请求的数据，非字符串会被 JSON 序列化               |
| `headers`           | `object`            | 自定义请求头                                       |
| `method`            | `string`            | 请求方法，默认为 `GET`，`data` 非空时为 `POST`     |
| `withCredentials`   | `boolean`           | 跨域请求是否携带凭证                               |
| `debug`             | `boolean`           | 是否开启调试模式，将信息打印至控制台               |
| `getXMLHTTPRequest` | `function`          | 连接后调用，用于获取 `XMLHTTPRequest` 对象         |
| `onError`           | `function`          | 错误回调，发生错误时调用                           |
| `listen`            | `string[] / string` | 需要监听的事件类型，默认为 `message`               |

## 生成器的负载类型说明

以下表格列出了 `sse` 函数生成器的负载类型，以及对应的解析方式。

| 负载类型 | 类型     | 描述                                         |
| -------- | -------- | -------------------------------------------- |
| `data`   | `string` | 消息内容(未解析)，一般可能是一个 JSON 字符串 |
| `id`     | `string` | 事件 ID(若存在)                              |
| `lastId` | `string` | 上一个事件 ID(若存在)                        |

## 开发

### 安装依赖

```bash
npm install
```

### 构建

```bash
npm run build
```

### 发布

```bash
npm publish
```

其他命令：

```bash
npm run lint         # Lint and fix source files
npm run change       # Add a new changeset
npm run bump         # Update version and changelog via changeset
npm run release      # Release the package
```
