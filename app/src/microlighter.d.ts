/** MicroLighter ships as plain ESM with JSDoc and no bundled types, so the surface the studio uses is declared here */
declare module 'microlighter' {
  export interface HighlightAllOptions {
    /** Element or document to search. Defaults to `document` */
    root?: Document | Element
    /** Selector used to find code blocks. Defaults to `"pre > code"` */
    selector?: string
    /** Extra aliases mapped to bundled grammar names */
    languageAliases?: Record<string, string>
  }

  export function highlightAll(options?: HighlightAllOptions): Promise<Element[]>
}
