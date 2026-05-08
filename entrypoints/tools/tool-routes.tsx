import type { ComponentType } from 'react';
import { App as CodeBeautifyTool } from '@/entrypoints/codebeautify';
import { App as ColorTransformTool } from '@/entrypoints/colorTransform';
import { App as ConvertTool } from '@/entrypoints/convert';
import { App as CronTool } from '@/entrypoints/cron';
import { App as Csv2JsonTool } from '@/entrypoints/csv2json';
import { App as CssTool } from '@/entrypoints/csstool';
import { App as DownloadsTool } from '@/entrypoints/downloads';
import { App as FileMergeTool } from '@/entrypoints/filemerge';
import { App as HtmlFormatTool } from '@/entrypoints/htmlformat';
import { App as ImageBase64Tool } from '@/entrypoints/imagebase64';
import { App as JsonTool } from '@/entrypoints/json';
import { App as JsonSchemaTool } from '@/entrypoints/jsonschema';
import { App as MarkdownTool } from '@/entrypoints/markdown';
import { App as PasswordTool } from '@/entrypoints/password';
import { App as PictureSplicingTool } from '@/entrypoints/pictureSplicing';
import { App as ScssTool } from '@/entrypoints/scss';
import { App as SvgOptimizerTool } from '@/entrypoints/svgoptimizer';
import { App as TimestampTool } from '@/entrypoints/timestamp';
import { App as TomlTool } from '@/entrypoints/toml';
import { App as TransRadixTool } from '@/entrypoints/trans-radix';
import { App as UglifyTool } from '@/entrypoints/uglify';
import { App as UrlParserTool } from '@/entrypoints/urlparser';
import { App as UuidTool } from '@/entrypoints/uuid';
import { App as XmlFormatterTool } from '@/entrypoints/xmlformatter';
import { App as YamlTool } from '@/entrypoints/yaml';
import { ORDINARY_TOOL_IDS } from '@/lib/tools-spa';

export type ToolRoute = {
  id: string;
  Component: ComponentType;
};

const componentByToolId: Record<string, ComponentType> = {
  json: JsonTool,
  'trans-radix': TransRadixTool,
  convert: ConvertTool,
  codebeautify: CodeBeautifyTool,
  uglify: UglifyTool,
  imagebase64: ImageBase64Tool,
  pictureSplicing: PictureSplicingTool,
  uuid: UuidTool,
  password: PasswordTool,
  markdown: MarkdownTool,
  htmlformat: HtmlFormatTool,
  urlparser: UrlParserTool,
  filemerge: FileMergeTool,
  csstool: CssTool,
  scss: ScssTool,
  svgoptimizer: SvgOptimizerTool,
  cron: CronTool,
  csv2json: Csv2JsonTool,
  yaml: YamlTool,
  toml: TomlTool,
  jsonschema: JsonSchemaTool,
  xmlformatter: XmlFormatterTool,
  timestamp: TimestampTool,
  colorTransform: ColorTransformTool,
  downloads: DownloadsTool,
};

export const toolRoutes: ToolRoute[] = ORDINARY_TOOL_IDS.map((id) => ({
  id,
  Component: componentByToolId[id],
}));
