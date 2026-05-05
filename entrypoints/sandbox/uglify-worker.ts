import { minify } from 'uglify-js';

const UGLIFY_REQUEST_TYPE = 'QHELPER_UGLIFY_MINIFY';
const UGLIFY_RESULT_TYPE = 'QHELPER_UGLIFY_RESULT';
const UGLIFY_READY_TYPE = 'QHELPER_UGLIFY_READY';

interface UglifyOptions {
  compress?:
    | boolean
    | {
        drop_console?: boolean;
        drop_debugger?: boolean;
      };
  mangle?:
    | boolean
    | {
        reserved?: string[];
      };
  output?: {
    beautify?: boolean;
    comments?: boolean;
  };
}

interface UglifyRequestMessage {
  type: typeof UGLIFY_REQUEST_TYPE;
  requestId: string;
  source: string;
  options?: UglifyOptions;
}

function isUglifyRequestMessage(value: unknown): value is UglifyRequestMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Record<string, unknown>;
  return (
    message.type === UGLIFY_REQUEST_TYPE &&
    typeof message.requestId === 'string' &&
    typeof message.source === 'string'
  );
}

window.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (event.source !== window.parent || !isUglifyRequestMessage(event.data)) {
    return;
  }

  const { requestId, source, options } = event.data;
  const targetOrigin = event.origin === 'null' ? '*' : event.origin;

  try {
    const result = minify(source, options);

    window.parent.postMessage(
      {
        type: UGLIFY_RESULT_TYPE,
        requestId,
        code: result.code,
        error: result.error?.message,
      },
      targetOrigin,
    );
  } catch (error) {
    window.parent.postMessage(
      {
        type: UGLIFY_RESULT_TYPE,
        requestId,
        error: error instanceof Error ? error.message : '未知错误',
      },
      targetOrigin,
    );
  }
});

window.parent.postMessage({ type: UGLIFY_READY_TYPE }, '*');
