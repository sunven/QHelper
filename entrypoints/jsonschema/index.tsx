import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Ajv from 'ajv';
import { FileJson, Shield, Copy, Download, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import { ToolPageShell } from '@/components/tool/ToolPageShell';
import '../../index.css';

interface JsonSchemaState {
  jsonData: string;
  jsonSchema: string;
  isValid: boolean;
  errors: string[];
  validationResults: Array<{
    path: string;
    message: string;
  }>;
}

function JsonSchemaValidator() {
  const [state, setState] = useState<JsonSchemaState>({
    jsonData: `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com"
}`,
    jsonSchema: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 2
    },
    "age": {
      "type": "number",
      "minimum": 0,
      "maximum": 150
    },
    "email": {
      "type": "string",
      "format": "email"
    }
  },
  "required": ["name", "email"]
}`,
    isValid: false,
    errors: [],
    validationResults: [],
  });

  const { addToHistory, history } = useToolHistory<JsonSchemaState>('jsonschema', {
    maxSize: 10,
    key: 'jsonschema-state',
  });

  // 验证 JSON Schema
  useEffect(() => {
    if (!state.jsonData.trim() || !state.jsonSchema.trim()) {
      setState((prev) => ({ ...prev, isValid: false, errors: [], validationResults: [] }));
      return;
    }

    try {
      // 首先验证 JSON 数据格式
      const jsonData = JSON.parse(state.jsonData);

      // 验证 Schema 格式
      const schema = JSON.parse(state.jsonSchema);

      // 使用 Ajv 验证
      const ajv = new Ajv({ allErrors: true });
      const validate = ajv.compile(schema);
      const valid = validate(jsonData);

      if (valid) {
        setState((prev) => ({ ...prev, isValid: true, errors: [], validationResults: [] }));
      } else {
        const errors = validate.errors?.map((err) => ({
          path: err.instancePath || '/',
          message: err.message || 'Unknown error',
        })) || [];

        setState((prev) => ({
          ...prev,
          isValid: false,
          errors: [],
          validationResults: errors,
        }));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '解析错误';
      setState((prev) => ({
        ...prev,
        isValid: false,
        errors: [message],
        validationResults: [],
      }));
    }
  }, [state.jsonData, state.jsonSchema]);

  const handleJsonDataChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, jsonData: value }));
  }, []);

  const handleJsonSchemaChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, jsonSchema: value }));
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      const content = `JSON 数据:\n${state.jsonData}\n\nJSON Schema:\n${state.jsonSchema}`;
      await navigator.clipboard.writeText(content);
    } catch {
      console.error('复制失败');
    }
  }, [state.jsonData, state.jsonSchema]);

  const handleDownload = useCallback(() => {
    const content = `JSON 数据:\n${state.jsonData}\n\nJSON Schema:\n${state.jsonSchema}\n\n验证结果: ${state.isValid ? '通过' : '失败'}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `json-schema-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addToHistory({ ...state } as ToolHistoryItem);
  }, [state.jsonData, state.jsonSchema, state.isValid, addToHistory, state]);

  const handleClear = useCallback(() => {
    setState((prev) => ({ ...prev, jsonData: '', jsonSchema: '', isValid: false, errors: [], validationResults: [] }));
  }, []);

  const handleFormatJson = useCallback(() => {
    try {
      if (state.jsonData.trim()) {
        const parsed = JSON.parse(state.jsonData);
        setState((prev) => ({ ...prev, jsonData: JSON.stringify(parsed, null, 2) }));
      }
      if (state.jsonSchema.trim()) {
        const parsed = JSON.parse(state.jsonSchema);
        setState((prev) => ({ ...prev, jsonSchema: JSON.stringify(parsed, null, 2) }));
      }
    } catch {
      // 忽略格式化错误
    }
  }, [state.jsonData, state.jsonSchema]);

  return (
    <ToolPageShell toolId="jsonschema">
      <div className="mx-auto max-w-[1440px] space-y-2">
        <div className="rounded-lg border border-slate-200/80 bg-white/92 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFormatJson}
                className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <FileJson className="h-3.5 w-3.5" />
                格式化
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                <X className="h-3.5 w-3.5" />
                清空
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {state.jsonData && state.jsonSchema && (
                <div className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  state.isValid
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {state.isValid ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      验证通过
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" />
                      验证失败
                    </>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-700 text-white transition-colors hover:bg-slate-800"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs text-white transition-colors hover:bg-emerald-700"
              >
                <Download className="h-3.5 w-3.5" />
                下载
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white/92 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
            <div className="flex items-center border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900">
              <FileJson className="mr-1.5 h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                JSON 数据
              </h2>
            </div>
            <textarea
              value={state.jsonData}
              onChange={(e) => handleJsonDataChange(e.target.value)}
              className="h-[min(62vh,620px)] w-full resize-none bg-white p-2 font-mono text-sm text-slate-900 focus:outline-none dark:bg-slate-950 dark:text-slate-100"
              placeholder="输入要验证的 JSON 数据..."
              spellCheck={false}
            />
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white/92 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
            <div className="flex items-center border-b border-slate-200 bg-slate-100 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-900">
              <Shield className="mr-1.5 h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                JSON Schema
              </h2>
            </div>
            <textarea
              value={state.jsonSchema}
              onChange={(e) => handleJsonSchemaChange(e.target.value)}
              className="h-[min(62vh,620px)] w-full resize-none bg-white p-2 font-mono text-sm text-slate-900 focus:outline-none dark:bg-slate-950 dark:text-slate-100"
              placeholder="输入 JSON Schema..."
              spellCheck={false}
            />
          </div>
        </div>

        {(state.errors.length > 0 || state.validationResults.length > 0) && (
          <div className="rounded-lg border border-slate-200/80 bg-white/92 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
            <h3 className="mb-1.5 flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
              <AlertCircle className="h-4 w-4" />
              验证结果
            </h3>
            <div className="max-h-36 space-y-1 overflow-y-auto">
              {state.errors.map((error, index) => (
                <div
                  key={`error-${index}`}
                  className="border-l-4 border-red-500 bg-red-50 p-2 text-red-900 dark:bg-red-900/20 dark:text-red-200"
                >
                  <div className="text-sm font-mono">{error}</div>
                </div>
              ))}
              {state.validationResults.map((result, index) => (
                <div
                  key={`result-${index}`}
                  className="border-l-4 border-red-500 bg-red-50 p-2 text-red-900 dark:bg-red-900/20 dark:text-red-200"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{result.path}</span>
                    <span className="text-sm">{result.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span>JSON 数据字符: {state.jsonData.length}</span>
          <span>Schema 字符: {state.jsonSchema.length}</span>
        </div>

        {history.length > 0 && (
          <div className="rounded-lg border border-slate-200/80 bg-white/92 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950/78">
            <h3 className="mb-1.5 font-semibold text-slate-700 dark:text-slate-200">历史记录</h3>
            <div className="max-h-36 space-y-1 overflow-y-auto">
              {history.map((item, index) => {
                const historyState = item as JsonSchemaState;
                return (
                  <div
                    key={index}
                    className="cursor-pointer rounded-md bg-slate-50 p-2 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                    onClick={() => {
                      setState((prev) => ({
                        ...prev,
                        jsonData: historyState.jsonData,
                        jsonSchema: historyState.jsonSchema,
                      }));
                    }}
                  >
                    <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 font-mono">
                      {historyState.jsonData.slice(0, 100)}...
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
}

function App() {
  return (
    <ToolErrorBoundary>
      <JsonSchemaValidator />
    </ToolErrorBoundary>
  );
}

const root = createRoot(document.getElementById('app')!);
root.render(<App />);
