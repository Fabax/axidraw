import {
  ActionPanel,
  Action,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
  openCommandPreferences,
  getPreferenceValues,
  LocalStorage,
} from "@raycast/api";

import React from "react";
import { runInTerminal, getFiles, runBash } from "./utils";
import { FileList } from "./FileList";
import { PreferenceValues } from "./types";

const preferences = getPreferenceValues<PreferenceValues>();
const { axicliPath, model } = preferences;

const ITEMS = [
  {
    id: 0,
    icon: Icon.ArrowClockwise,
    title: "Toggle",
    subtitle: "Toggle pen up and down",
    accessory: "Command",
    action: () => {
      runBash(`${axicliPath} --mode toggle --model ${model} `).then((value) => {
        const message = value.toString();
        if (message.includes("Command failed")) {
          showToast({
            style: Toast.Style.Failure,
            title: "Error",
            message: message.split("\n")[1],
          });
        } else {
          showToast({
            style: Toast.Style.Success,
            title: "Toggle sucessful",
            message: message,
          });
        }
      });
    },
  },
  {
    id: 1,
    icon: Icon.House,
    title: "Send home",
    subtitle: "Rebase to the home position",
    accessory: "Command",
    action: () => {
      LocalStorage.getItem("currentFile").then((filePath) => {
        const file = filePath ? filePath : `${__dirname}/assets/a3-plot-calibration.svg`;

        runBash(`${axicliPath} ${file} --mode res_home --model ${model} `).then((value) => {
          const message = value.toString();

          if (message.includes("Command failed")) {
            showToast({
              style: Toast.Style.Failure,
              title: "Error",
              message: message.split("\n")[1],
            });
          } else {
            showToast({
              style: Toast.Style.Animated,
              title: "Sending gome",
              message: message,
            });
          }
        });
      });
    },
  },
  {
    id: 2,
    icon: Icon.Ruler,
    title: "Calibration",
    subtitle: "draw a calibration plot",
    accessory: "Command",
    action: () => {
      runInTerminal(
        `${axicliPath} ${__dirname}/assets/a3-plot-calibration.svg  --progress --report_time --model ${model}`,
      );
    },
  },
  {
    id: 3,
    icon: Icon.Folder,
    title: "List files",
    subtitle: "List plottables files",
    accessory: "List",
    action: () => {
      const files = getFiles();
      return <FileList files={files} />;
    },
  },
];

export default function Command() {
  const { push } = useNavigation();

  return (
    <List>
      {ITEMS.map((item) => (
        <List.Item
          key={item.id}
          icon={item.icon}
          title={item.title}
          subtitle={item.subtitle}
          accessories={[{ text: item.accessory }]}
          actions={
            <ActionPanel>
              <Action
                title="Run"
                onAction={async () => {
                  if (item.action) {
                    const action = item.action();

                    // navigate if the action returns a component
                    if (React.isValidElement(action)) {
                      push(action);
                    }
                  }
                }}
              />
              <Action title="Open Preferences" onAction={openCommandPreferences} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
