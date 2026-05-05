import * as sass from 'sass';

const SCSS_REQUEST_TYPE = 'QHELPER_SCSS_COMPILE';
const SCSS_RESULT_TYPE = 'QHELPER_SCSS_RESULT';

type ScssOutputStyle = 'expanded' | 'compressed';

interface ScssRequestMessage {
  type: typeof SCSS_REQUEST_TYPE;
  requestId: string;
  input: string;
  outputStyle: ScssOutputStyle;
}

function isScssRequestMessage(value: unknown): value is ScssRequestMessage {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const message = value as Record<string, unknown>;
  return (
    message.type === SCSS_REQUEST_TYPE &&
    typeof message.requestId === 'string' &&
    typeof message.input === 'string' &&
    (message.outputStyle === 'expanded' || message.outputStyle === 'compressed')
  );
}

window.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (event.source !== window.parent || !isScssRequestMessage(event.data)) {
    return;
  }

  const { requestId, input, outputStyle } = event.data;
  const targetOrigin = event.origin === 'null' ? '*' : event.origin;

  try {
    const result = sass.compileString(input, {
      style: outputStyle,
      syntax: 'scss',
    });

    window.parent.postMessage(
      {
        type: SCSS_RESULT_TYPE,
        requestId,
        css: result.css,
      },
      targetOrigin,
    );
  } catch (error) {
    window.parent.postMessage(
      {
        type: SCSS_RESULT_TYPE,
        requestId,
        error: error instanceof Error ? error.message : '未知错误',
      },
      targetOrigin,
    );
  }
});
