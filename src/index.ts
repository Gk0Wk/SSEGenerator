import { SSE, SSEOptions as BaseSSEOptions, SSEvent } from 'sse.js';

export interface ISSEMessage {
  /**
   * 消息内容(未解析)，一般可能是一个JSON字符串
   *
   * Message content(unparsed), generally it may be a JSON string
   */
  data: string;
  /**
   * 事件ID(若存在)
   *
   * Event ID(if exists)
   */
  id: string | null;
  /**
   * 上一个事件ID(若存在)
   *
   * Last event ID(if exists)
   */
  lastId: string | null;
  /**
   * 事件类型，默认是 message
   *
   * Event type, default is message
   */
  event: string;
}

export interface SSEProps {
  /**
   * 基础URL
   *
   * Base URL
   */
  baseURL?: string;
  /**
   * 请求URL, 如果baseURL不为空，则相对路径
   *
   * Request URL, if baseURL is not empty, it is a relative path
   */
  url: string;
  /**
   * 请求数据，如果不是字符串，则会被JSON序列化
   *
   * Request data, if it is not a string, it will be serialized as JSON
   */
  data?: any;
  /**
   * 请求头，可以设置自定义的请求头
   *
   * Request header, you can set custom request headers
   */
  headers?: Record<string, string>;
  /**
   * 请求方法, 在 data 不为空时默认为 POST，为空时默认为 GET
   *
   * Request method, default to POST when data is not empty, and GET when it is empty
   */
  method?: BaseSSEOptions['method'];
  /**
   * 跨域请求是否携带凭证
   *
   * Whether to carry credentials with cross-domain requests
   */
  withCredentials?: BaseSSEOptions['withCredentials'];
  /**
   * 是否开启调试模式，将中间事件打印在控制台
   *
   * Whether to enable debug mode, print intermediate events to the console
   */
  debug?: BaseSSEOptions['debug'];
  /**
   * 在请求连接后调用，可以用于获取XMLHTTPRequest对象
   *
   * Called after the request is connected, can be used to get the XMLHTTPRequest object
   */
  getXMLHTTPRequest?: (xhr: XMLHttpRequest) => void;
  /**
   * 错误回调，当发生错误时调用
   *
   * Error callback, called when an error occurs
   */
  onError?: (error: string, xhr: XMLHttpRequest | null) => void;
  /**
   * 监听的事件类型，默认为 message，这是 event-stream 默认的事件类型
   *
   * The event type to listen to, default is message, which is the default event type of event-stream
   */
  listen?: string | string[];
}

/**
 * 发送 Server-Sent Events 请求，返回一个异步可迭代对象，可以用于接收服务器推送的消息
 * 可以获取到 XMLHTTPRequest 对象，用于获取额外信息
 * 可以使用 onError 回调捕获异常
 *
 * Send a Server-Sent Events request, return an asynchronous iterable object, which can be used to receive messages pushed by the server
 * You can get the XMLHTTPRequest object to get additional information
 * You can use the onError callback to catch exceptions
 *
 * @example
 * ```ts
 * async function test() {
 *   for await (const { data } of sse({
 *     baseURL: 'https://api.openai.com',
 *     url: '/v1/chat/completions',
 *     data: {
 *       model: 'gpt-4-turbo-preview',
 *       messages: [
 *         { role: 'user', content: 'Hi!' },
 *       ],
 *       headers: {
 *         Authorization: 'Bearer YOUR_API_KEY',
 *       }
 *     },
 *     onError: (error, xhr) => console.error(`Code: ${xhr?.status}, Error: ${error}`),
 *   })) {
 *     console.log(JSON.parse(data).choices[0].delta.content);
 *   }
 * }
 * ```
 */
export async function* sse(props: SSEProps) {
  let { data } = props;
  const headers = props.headers ?? {};
  if (data && typeof data !== 'string') {
    data = JSON.stringify(data);
    headers['Content-Type'] = 'application/json; charset=utf-8';
  }
  headers.Accept = 'text/event-stream';
  // remove '/' from the end of baseURL and add '/' to the beginning of url
  const url = `${props.baseURL?.replace?.(/[/]+$/, '') ?? ''}${
    props.url.startsWith('/') ? props.url : `/${props.url}`
  }`;
  const source = new SSE(url, {
    ...props,
    payload: data,
    start: false,
    headers,
  });
  const queue: ISSEMessage[] = [];
  let next: ((t: ISSEMessage) => void) | undefined;
  const eventTypes = Array.isArray(props.listen)
    ? props.listen
    : [props.listen ?? 'message'];
  for (const event of eventTypes) {
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    source.addEventListener(event, (e: SSEvent) => {
      const payload = { data: e.data, id: e.id, lastId: e.id, event };
      if (next) {
        next(payload);
        next = undefined;
      } else {
        queue.push(payload);
      }
    });
  }
  source.onerror = (e: SSEvent) => props.onError?.(e.data, source.xhr);
  source.onopen = () => props.getXMLHTTPRequest?.(source.xhr!);
  try {
    source.stream();
    while (queue.length > 0 || source.readyState !== source.CLOSED) {
      if (queue.length > 0) {
        const t = queue.shift()!;
        if (t.data === '[DONE]') {
          break;
        }
        yield t;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        queue.push(await new Promise<ISSEMessage>(resolve => (next = resolve)));
      }
    }
  } finally {
    // 确保清理资源，例如关闭SSE连接
    if (source.readyState !== source.CLOSED) {
      source.close();
    }
  }
  return source.xhr;
}

export default sse;
