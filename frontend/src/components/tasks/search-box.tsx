import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

export function SearchBox({
  query,
  onQueryChange,
}: {
  query: string
  onQueryChange: (value: string) => void
}) {
  return (
    <label className="search-box">
      <Search className="size-4" />
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search tasks"
      />
    </label>
  )
}
