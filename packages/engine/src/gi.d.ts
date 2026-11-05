// Minimal declaration of the GIO API the gjs wrapper uses. gjs provides
// the module at runtime (GLib 2.80 or newer); full typings (@girs) are not
// needed for this.
declare module 'gi://GioUnix' {
  interface Bytes {
    get_size(): number;
    toArray(): Uint8Array;
  }
  interface InputStream {
    read_bytes(count: number, cancellable: null): Bytes;
  }
  const GioUnix: {
    InputStream: new (props: { fd: number; close_fd: boolean }) => InputStream;
  };
  export default GioUnix;
}
