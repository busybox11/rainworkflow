import { Image, List } from "@vicinae/api";
import { useMemo } from "react";
import { SearchResultGroup } from "./components/SearchResultGroup";
import { useDiscordSearch } from "./hooks/useDiscordSearch";
import { groupSearchResults } from "./utils/search-results";

export default function ControlledList() {
  const { searchText, searchResultsObject, isLoading, handleSearchChange, ws } =
    useDiscordSearch();

  // Group results by header items
  const groupedResults = useMemo(
    () => groupSearchResults(searchResultsObject.results),
    [searchResultsObject.results]
  );
  const returnedUsers = useMemo(() => {
    const seen = new Set<string>();
    return (
      searchResultsObject.results
        ?.map((result) => result.metadata?.currentUser)
        .filter((user): user is { username: string; avatar: string } => {
          if (!user) return false;
          if (seen.has(user.username)) return false;
          seen.add(user.username);
          return true;
        }) ?? []
    );
  }, [searchResultsObject.results]);

  return (
    <List
      searchText={searchText}
      onSearchTextChange={handleSearchChange}
      searchBarPlaceholder={"Search Discord..."}
      isLoading={isLoading}
      searchBarAccessory={
        <List.Dropdown
          id="discord-user"
          placeholder="Select Discord User"
          defaultValue={undefined}
          filtering={true}
        >
          <List.Dropdown.Item title="all users" value="all-users" />
          {returnedUsers?.map((user) => (
            <List.Dropdown.Item
              key={user.username}
              title={user.username}
              value={user.username}
              icon={{
                source: user.avatar,
                mask: Image.Mask.Circle,
              }}
            />
          ))}
        </List.Dropdown>
      }
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
