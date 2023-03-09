declare module '*.svg'
declare module '*.css' {
  var styles: { [key: string]: string }
  export = styles
}
