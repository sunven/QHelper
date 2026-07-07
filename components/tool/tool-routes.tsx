import type { ComponentType } from 'react';
import { App as AesGcmTool } from '@/components/tool/aes-gcm';
import { App as BcryptHashTool } from '@/components/tool/bcrypt-hash';
import { App as ColorTransformTool } from '@/components/tool/colorTransform';
import { App as ContextHubTool } from '@/components/tool/context-hub';
import { App as ConvertTool } from '@/components/tool/convert';
import { App as CronTool } from '@/components/tool/cron';
import { App as Csv2JsonTool } from '@/components/tool/csv2json';
import { App as CssTool } from '@/components/tool/csstool';
import { App as DownloadsTool } from '@/components/tool/downloads';
import { App as FileMergeTool } from '@/components/tool/filemerge';
import { App as HtmlFormatTool } from '@/components/tool/htmlformat';
import { App as ImageBase64Tool } from '@/components/tool/imagebase64';
import { App as JsonTool } from '@/components/tool/json';
import { App as JsonSchemaTool } from '@/components/tool/jsonschema';
import { App as MarkdownTool } from '@/components/tool/markdown';
import { App as OcrTool } from '@/components/tool/ocr';
import { App as PasswordTool } from '@/components/tool/password';
import { App as PictureSplicingTool } from '@/components/tool/pictureSplicing';
import { App as QrCodeTool } from '@/components/tool/qrcode';
import { App as SvgOptimizerTool } from '@/components/tool/svgoptimizer';
import { App as TimestampTool } from '@/components/tool/timestamp';
import { App as TextPreviewTool } from '@/components/tool/text-preview';
import { App as TomlTool } from '@/components/tool/toml';
import { App as TransRadixTool } from '@/components/tool/trans-radix';
import { App as UglifyTool } from '@/components/tool/uglify';
import { App as UrlParserTool } from '@/components/tool/urlparser';
import { App as UuidTool } from '@/components/tool/uuid';
import { App as XmlFormatterTool } from '@/components/tool/xmlformatter';
import { App as YamlTool } from '@/components/tool/yaml';
import {
  createOrdinaryToolRoutes,
  type ToolRoute,
} from '@/lib/tool-catalog';

const componentByToolId: Record<string, ComponentType> = {
  json: JsonTool,
  'context-hub': ContextHubTool,
  'trans-radix': TransRadixTool,
  convert: ConvertTool,
  uglify: UglifyTool,
  imagebase64: ImageBase64Tool,
  pictureSplicing: PictureSplicingTool,
  ocr: OcrTool,
  qrcode: QrCodeTool,
  uuid: UuidTool,
  password: PasswordTool,
  'aes-gcm': AesGcmTool,
  'bcrypt-hash': BcryptHashTool,
  markdown: MarkdownTool,
  htmlformat: HtmlFormatTool,
  urlparser: UrlParserTool,
  filemerge: FileMergeTool,
  csstool: CssTool,
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
  'text-preview': TextPreviewTool,
};

export const toolRoutes: ToolRoute<ComponentType>[] =
  createOrdinaryToolRoutes(componentByToolId);
