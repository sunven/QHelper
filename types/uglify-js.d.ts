/**
 * uglify-js type declarations
 */
declare module 'uglify-js' {
  interface UglifyJSOptions {
    compress?: boolean | {
      drop_console?: boolean;
      drop_debugger?: boolean;
    };
    mangle?: boolean | {
      reserved?: string[];
    };
    output?: {
      beautify?: boolean;
      indent_level?: number;
      comments?: boolean;
    };
  }

  interface UglifyJSResult {
    code: string;
    error?: Error;
  }

  interface UglifyJS {
    (code: string, options?: UglifyJSOptions): UglifyJSResult;
    minify(code: string, options?: UglifyJSOptions): UglifyJSResult;
  }

  const uglify: UglifyJS;
  export default uglify;
}
