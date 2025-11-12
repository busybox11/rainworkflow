import { List } from "@vicinae/api";
import { useMemo } from "react";
import { SearchResultGroup } from "./components/SearchResultGroup";
import { useDiscordSearch } from "./hooks/useDiscordSearch";
import { groupSearchResults } from "./utils/search-results";

export default function ControlledList() {
  const { searchText, searchResults, isLoading, handleSearchChange, ws } =
    useDiscordSearch();

  // Group results by header items
  const groupedResults = useMemo(
    () => groupSearchResults(searchResults),
    [searchResults]
  );

  return (
    <List
      searchText={searchText}
      onSearchTextChange={handleSearchChange}
      searchBarPlaceholder={"Search Discord..."}
      isLoading={isLoading}
      throttle
    >
      {groupedResults.map((group, groupIndex) => (
        <SearchResultGroup
          key={group.header ?? `group-${groupIndex}`}
          group={group}
          groupIndex={groupIndex}
          ws={ws}
        />
      ))}
    </List>
  );
}
