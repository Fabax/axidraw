import { ActionPanel, Action, Icon, List, useNavigation, getPreferenceValues, PreferenceValues } from "@raycast/api";

import type { FileProps } from "./types";
import { getSVGLayers, runBash } from "./utils";
import { useEffect, useState } from "react";
import PlotForm from "./PlotForm";

import { LocalStorage } from "@raycast/api";

export function FileList(props: { files: FileProps[] }) {
  const { files } = props;

  const [searchText, setSearchText] = useState("");
  const [filteredList, filterList] = useState(files);
  const [printedFiles, setPrintedFiles] = useState<string[]>([]);
  const [currentFile, setCurrentFile] = useState("");
  const [storageUpdated, setStorageUpdated] = useState(false);

  useEffect(() => {
    LocalStorage.allItems().then((items) => {
      console.log("items", items);
      const printedFileNames = Object.keys(items).filter((key) => items[key] === "printed");
      const currentFileName =
        items["currentFile"] && Object.keys(items).includes("currentFile")
          ? items["currentFile"].split("/").pop()?.toString()
          : null;

      setCurrentFile(currentFileName);
      setPrintedFiles(printedFileNames);
    });

    filterList(files.filter((file) => file.name.includes(searchText)));
  }, [searchText, storageUpdated]);

  const updateLocalStorage = async (action: string, file: string) => {
    if (action === "set") {
      LocalStorage.setItem(file, "printed");
    } else if (action === "remove") {
      LocalStorage.removeItem(file);
    }

    setStorageUpdated((prev) => !prev);
  };

  return (
    <List
      onSearchTextChange={setSearchText}
      navigationTitle="List of SVG Files"
      searchBarPlaceholder="Search your SVG files"
      isShowingDetail
    >
      {filteredList.map((item) => {
        const isPrinted = printedFiles.includes(item.name);
        const isCurrentFile = currentFile === item.name;

        return (
          <ListItem
            item={item}
            key={item.id}
            isPrinted={isPrinted}
            isCurrentFile={isCurrentFile}
            updateLocalStorage={updateLocalStorage}
          />
        );
      })}
    </List>
  );
}

function ListItem(props: {
  item: FileProps;
  isPrinted: boolean;
  isCurrentFile: boolean;
  updateLocalStorage: (action: string, file: string) => Promise<void>;
}) {
  const { item, isPrinted, isCurrentFile, updateLocalStorage } = props;
  const { push } = useNavigation();

  return (
    <List.Item
      title={item.name}
      detail={<Detail item={item} key={item.id} />}
      icon={isPrinted ? Icon.CheckCircle : isCurrentFile ? Icon.CircleProgress : undefined}
      actions={
        <ActionPanel>
          <Action
            key={"Start plot"}
            title="Start plot"
            icon={Icon.Pencil}
            onAction={() => {
              push(<PlotForm file={item} />);
            }}
          />
          <Action
            key={"mark-as-printed"}
            title="Toggle print status"
            icon={Icon.Print}
            onAction={() => {
              if (isPrinted) {
                updateLocalStorage("remove", `${item.name}`);
              } else {
                updateLocalStorage("set", `${item.name}`);
              }
            }}
          />
          <Action.OpenWith title="Open with" path={item.path} />
        </ActionPanel>
      }
    />
  );
}

function Detail(props: { item: FileProps }) {
  const { item } = props;

  const preferences = getPreferenceValues<PreferenceValues>();
  const { model: defaultModel, speed: defaultSpeed, axicliPath } = preferences;

  const layersData = getSVGLayers(item.path);

  const [time, setTime] = useState<string[]>([]);

  useEffect(() => {
    const fetchTime = async () => {
      await runBash(`${axicliPath} -v --report_time -s ${defaultSpeed} --model ${defaultModel} ${item.path}`)
        .then((value) => {
          const message = value[1] ? value[1] : value[0];
          const lines = message.split("\n");

          setTime(lines);
        })
        .catch((error) => {
          console.error("Error --- ", error);
          setTime(["Error fetching time"]);
        });
    };

    fetchTime();
  }, [item.path]);

  return (
    <List.Item.Detail
      markdown={`<img src="file://${item.path}" width="190" height="190"  />`}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.TagList title="Layers">
            {layersData.map((layer) => (
              <List.Item.Detail.Metadata.TagList.Item text={layer.id} color={layer.color} key={layer.id} />
            ))}
          </List.Item.Detail.Metadata.TagList>
          <List.Item.Detail.Metadata.Label
            icon={Icon.Clock}
            title="Estimated print time"
            text={time.length > 0 ? time[0].split(":").slice(1).join(":") : "..."}
          />
          <List.Item.Detail.Metadata.Label
            icon={Icon.Ruler}
            title="Length of path to draw"
            text={time.length > 1 ? time[1].split(":").slice(1).join(":") : "..."}
          />
        </List.Item.Detail.Metadata>
      }
    ></List.Item.Detail>
  );
}
