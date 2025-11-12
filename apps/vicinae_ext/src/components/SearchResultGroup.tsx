import type { SearchResultItem } from "@rainworkflow/types/src/events";
import { List } from "@vicinae/api";
import { createResultItemEntry } from "../utils/search-results";
import { SearchResultItemComponent } from "./SearchResultItem";

type SearchResultGroupProps = {
  group: {
    header?: string;
    items: SearchResultItem[];
  };
  groupIndex: number;
  ws: WebSocket;
};

export function SearchResultGroup({
  group,
  groupIndex,
  ws,
}: SearchResultGroupProps) {
  return (
    <List.Section
      key={group.header ?? `group-${groupIndex}`}
      title={group.header}
    >
      {group.items.map((result) => {
        const itemEntry = createResultItemEntry(result);
        return (
          <SearchResultItemComponent
            key={itemEntry.key}
            result={result}
            ws={ws}
          />
        );
      })}
    </List.Section>
  );
}
