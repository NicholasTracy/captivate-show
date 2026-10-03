declare module 'multicast-dns' {
  interface Mdns {
    on(event: 'response', cb: (packet: { answers?: unknown[]; additionals?: unknown[] }) => void): void
    removeListener(event: 'response', cb: (...args: unknown[]) => void): void
    query(name: string, type: string): void
    destroy(): void
  }
  export default function mdns(): Mdns
}