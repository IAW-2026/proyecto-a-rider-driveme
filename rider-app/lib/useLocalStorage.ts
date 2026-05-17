import { useSyncExternalStore } from "react"

export function useLocalStorageValue(key: string | null): string | null {
  return useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange)
      return () => window.removeEventListener("storage", onStoreChange)
    },
    () => (key ? localStorage.getItem(key) : null),
    () => null
  )
}
