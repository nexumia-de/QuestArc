// Minimal declaration of the GIO API the gjs wrapper uses. gjs provides
// the module at runtime; full typings (@girs) are not needed for this.
declare module 'gi://Gio' {
  interface File {
    load_contents(cancellable: null): [boolean, Uint8Array, string | null];
  }
  const Gio: {
    File: { new_for_path(path: string): File };
  };
  export default Gio;
}
