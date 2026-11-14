/** A new run id (docs/data-model.md §2): made by the host, never by the engine. */
export const newRunId = (cryptoApi: Pick<Crypto, 'getRandomValues'> = crypto): string => {
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
};
