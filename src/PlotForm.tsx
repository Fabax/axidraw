import {
  Action,
  ActionPanel,
  Form,
  Icon,
  showToast,
  Toast,
  getPreferenceValues,
  LocalStorage,
  environment,
} from "@raycast/api";
import type { FileProps, PreferenceValues } from "./types";
import { getSVGLayers, runBash, runInTerminal } from "./utils";
import { useEffect, useState } from "react";

type PlotFormProps = {
  file: FileProps;
};

export default function PlotForm(props: PlotFormProps) {
  const { file } = props;

  const preferences = getPreferenceValues<PreferenceValues>();
  const { model: defaultModel, speed: defaultSpeed, printFolder, axicliPath } = preferences;

  const [speed, setSpeed] = useState<string>(defaultSpeed);
  const [model, setModel] = useState<string>(defaultModel);
  const [layer, setLayer] = useState<string>("0");
  const [preview, setPreview] = useState<boolean>(true);

  const layersData = getSVGLayers(file.path);
  const hasLayers = layersData[0].id === "no-layers" ? false : true;

  const [time, setTime] = useState<string[]>([]);
  const [command, setCommand] = useState<string>("");

  useEffect(() => {
    const fetchTime = async () => {
      function getTimes(value: string[]) {
        const message = value[1] ? value[1] : value[0];
        const messageLines = message.split("\n");

        const estimatedTime = messageLines[0].split(":").splice(1).join(":");
        return estimatedTime;
      }

      function handleError(error: string) {
        console.error("Error --- ", error);
        return "Error fetching time";
      }

      if (!hasLayers) {
        const times = await runBash(`${axicliPath} -v --report_time -s ${speed} --model 2 ${file.path}`)
          .then(getTimes)
          .catch(handleError);
        setTime([times]);
      } else {
        const times = await Promise.all(
          layersData.map(async (layer) => {
            return await runBash(
              `${axicliPath} -v --report_time -s ${speed} --model 2 --mode layers --layer ${layer.number}  ${file.path}`,
            )
              .then(getTimes)
              .catch(handleError);
          }),
        );
        setTime(times);
      }
    };

    fetchTime();
  }, [speed]);

  useEffect(() => {
    let cmd = `${axicliPath} ${preview ? "-v --report_time" : "--progress"} ${layer !== "0" ? `--mode layers --layer ${layer}` : ""} -s ${speed} --model ${model} `;
    setCommand(cmd.replace(/[^a-zA-Z0-9\-_.\/\s]/g, ""));
  }, [time, speed, model, layer, preview]);

  const handleSubmit = async () => {
    runInTerminal(`${command} ${file.path}`);
    LocalStorage.setItem("currentFile", file.path);

    showToast({
      style: Toast.Style.Success,
      title: "Yay!",
      message: `plot started`,
    });
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
      navigationTitle="Run Plot"
    >
      {hasLayers && (
        <Form.Dropdown id="layer" title="Layer" onChange={setLayer} value={layer}>
          <Form.Dropdown.Item value="0" title="Plot all layers" icon={{ source: Icon.Pencil, tintColor: "grey" }} />
          {layersData.map((layer) => {
            return (
              <Form.Dropdown.Item
                key={layer.id}
                value={layer.number}
                title={`Plot ${layer.color} Layer `}
                icon={{ source: Icon.Pencil, tintColor: layer.color }}
              />
            );
          })}
        </Form.Dropdown>
      )}
      <Form.Checkbox id="preview" label="Enable preview" value={preview} onChange={setPreview} />
      <Form.Dropdown id="speed" title="Pen down speed" onChange={setSpeed} value={speed}>
        <Form.Dropdown.Item key="5" value="5" title="Very slow" icon={"🐌"} />
        <Form.Dropdown.Item key="10" value="10" title="Slow" icon={"🐢"} />
        <Form.Dropdown.Item key="25" value="25" title="Default" icon={"🐕"} />
      </Form.Dropdown>
      <Form.Dropdown id="model" title="Axidraw model" onChange={setModel} value={model}>
        <Form.Dropdown.Item key={"1"} value="1" title="AxiDraw V2, V3, or SE/A4" />
        <Form.Dropdown.Item key={"2"} value="2" title="AxiDraw V3/A3 or SE/A3" />
        <Form.Dropdown.Item key={"3"} value="3" title="AxiDraw V3 XLX" />
        <Form.Dropdown.Item key={"4"} value="4" title="AxiDraw MiniKit" />
        <Form.Dropdown.Item key={"5"} value="5" title="AxiDraw SE/A1" />
        <Form.Dropdown.Item key={"6"} value="6" title="AxiDraw SE/A2" />
        <Form.Dropdown.Item key={"7"} value="7" title="AxiDraw V3/B6" />
      </Form.Dropdown>

      {time.map((t, index) => {
        return <Form.Description title={`${layersData[index].id}`} text={t} key={index} />;
      })}

      {environment.isDevelopment && (
        <>
          <Form.Separator />
          <Form.Description title="Command" text={command} />
        </>
      )}
    </Form>
  );
}
