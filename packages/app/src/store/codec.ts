/**
 * Plugin data as Super Productivity stores it: values of 1024 or more
 * characters are `GZ1:<base64 gzip>` (docs/super-productivity-facts.md
 * §2). The app reads both forms and writes values as they are.
 */
export const decodeData = async (data: string): Promise<string> => {
  if (!data.startsWith('GZ1:')) return data;
  const bytes = Uint8Array.from(atob(data.slice(4)), (char) => char.charCodeAt(0));
  const text = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(text).text();
};
