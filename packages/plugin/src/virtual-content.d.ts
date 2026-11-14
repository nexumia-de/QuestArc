// Built by view-content.mjs.
declare module 'virtual:questarc-style' {
  /** src/ui/style.css without whitespace. */
  const style: string;
  export default style;
}

declare module 'virtual:questarc-start-texts' {
  /** The texts the view shows before plugin.js answers, from content/i18n, by language. */
  const texts: {
    readonly en: Readonly<Record<string, string>>;
    readonly de: Readonly<Record<string, string>>;
  };
  export default texts;
}
