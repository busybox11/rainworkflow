import type { SearchResultItem } from "@rainworkflow/types/src/events";
import {
  Action,
  ActionPanel,
  closeMainWindow,
  Color,
  Image,
  List,
} from "@vicinae/api";
import { useMemo } from "react";
import { createOpenTargetEvent, sendEvent } from "../utils/events";
import {
  createResultItemEntry,
  getTargetName,
  type ResultItemEntry,
} from "../utils/search-results";

type SearchResultItemProps = {
  result: SearchResultItem;
  ws: WebSocket;
};

export function SearchResultItemComponent({
  result,
  ws,
}: SearchResultItemProps) {
  const itemEntry = useMemo<ResultItemEntry>(
    () => createResultItemEntry(result),
    [result]
  );

  const targetName = useMemo(() => getTargetName(result), [result]);

  const icon = useMemo(() => {
    if (itemEntry.icon) {
      return {
        source: itemEntry.icon,
        mask: Image.Mask.Circle,
      };
    }
    if (itemEntry.guildIcon && result.type === "GUILD") {
      return {
        source: itemEntry.guildIcon,
        mask: Image.Mask.RoundedRectangle,
      };
    }
    return undefined;
  }, [itemEntry.icon, itemEntry.guildIcon, result.type]);

  const accessories = useMemo(() => {
    const accs = [];
    if (itemEntry.guild) {
      accs.push({
        text: itemEntry.guild,
        icon: itemEntry.guildIcon
          ? {
              source: itemEntry.guildIcon,
              mask: Image.Mask.RoundedRectangle,
            }
          : undefined,
      });
    }
    if (itemEntry.isUnread) {
      accs.push({
        tag: {
          color: Color.SecondaryText,
          value: "Unread",
        },
      });
    }
    if (itemEntry.mentions) {
      accs.push({
        tag: {
          color: Color.Red,
          value: `🔔 ${itemEntry.mentions}`,
        },
      });
    }
    return accs;
  }, [
    itemEntry.guild,
    itemEntry.guildIcon,
    itemEntry.isUnread,
    itemEntry.mentions,
  ]);

  const handleOpenTarget = useMemo(
    () => () => {
      // close vicinae
      closeMainWindow({
        clearRootSearch: true,
      });

      // send focus event to workflow server
      sendEvent(ws, createOpenTargetEvent(result));
    },
    [ws, result]
  );

  return (
    <List.Item
      title={itemEntry.title}
      subtitle={itemEntry.subtitle}
      icon={icon}
      accessories={accessories}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action title={`Open ${targetName}`} onAction={handleOpenTarget} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
