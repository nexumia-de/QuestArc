// Built by view-content.mjs.
declare module 'virtual:questarc-style' {
  /** src/ui/style.css without whitespace. */
  const style: string;
  export default style;
}

declare module 'virtual:questarc-start-texts' {
  /** The texts of content/i18n/en.json the view shows before plugin.js answers. */
  const texts: Readonly<Record<string, string>>;
  export default texts;
}
