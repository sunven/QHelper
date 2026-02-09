import React, { useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Ajv from 'ajv';
import { FileJson, Shield, Copy, Download, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ToolErrorBoundary } from '../../components/ToolErrorBoundary';
import { useToolHistory } from '../../hooks/useToolHistory';
import type { ToolHistoryItem } from '../../types';
import '../../index.css';
import { ToolNavigation } from '@/components/ToolNavigation';

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


    <>


      <ToolNavigation />
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              JSON Schema 验证器
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            使用 JSON Schema 验证 JSON 数据结构
          </p>
        </div>

        {/* 工具栏 */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleFormatJson}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-sm"
              >
                <FileJson className="w-4 h-4" />
                格式化
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                清空
              </button>
            </div>
            <div className="flex items-center gap-2">
              {state.jsonData && state.jsonSchema && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  state.isValid
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {state.isValid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      验证通过
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      验证失败
                    </>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                下载
              </button>
            </div>
          </div>
        </div>

        {/* 编辑器区域 */}
        <div className="grid grid-cols-2 gap-4">
          {/* JSON 数据输入 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
              <FileJson className="w-4 h-4 text-slate-600 dark:text-slate-400 mr-2" />
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">
                JSON 数据
              </h2>
            </div>
            <textarea
              value={state.jsonData}
              onChange={(e) => handleJsonDataChange(e.target.value)}
              className="w-full h-[500px] p-4 resize-none focus:outline-none font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              placeholder="输入要验证的 JSON 数据..."
              spellCheck={false}
            />
          </div>

          {/* JSON Schema 输入 */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b border-slate-200 dark:border-slate-600">
              <Shield className="w-4 h-4 text-slate-600 dark:text-slate-400 mr-2" />
              <h2 className="font-semibold text-slate-700 dark:text-slate-200">
                JSON Schema
              </h2>
            </div>
            <textarea
              value={state.jsonSchema}
              onChange={(e) => handleJsonSchemaChange(e.target.value)}
              className="w-full h-[500px] p-4 resize-none focus:outline-none font-mono text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              placeholder="输入 JSON Schema..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* 验证结果 */}
        {(state.errors.length > 0 || state.validationResults.length > 0) && (
          <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              验证结果
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.errors.map((error, index) => (
                <div
                  key={`error-${index}`}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-900 dark:text-red-200"
                >
                  <div className="text-sm font-mono">{error}</div>
                </div>
              ))}
              {state.validationResults.map((result, index) => (
                <div
                  key={`result-${index}`}
                  className="p-3 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-900 dark:text-red-200"
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

        {/* 统计信息 */}
        <div className="mt-4 flex gap-4 text-sm text-slate-600 dark:text-slate-400">
          <span>JSON 数据字符: {state.jsonData.length}</span>
          <span>Schema 字符: {state.jsonSchema.length}</span>
        </div>

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">历史记录</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {history.map((item, index) => {
                const historyState = item as JsonSchemaState;
                return (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer transition-colors"
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
    </div>
  


    </>);
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
