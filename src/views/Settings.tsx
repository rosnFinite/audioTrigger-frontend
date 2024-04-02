import React, { useEffect, useState } from "react";
import "@mantine/core/styles.css";
import {
  Accordion,
  Blockquote,
  Button,
  Checkbox,
  Container,
  Divider,
  FileInput,
  Group,
  NativeSelect,
  NumberInput,
  Stack,
  Title,
  Text,
} from "@mantine/core";
import {
  TbInfoCircle,
  TbMicrophone2,
  TbFlagExclamation,
  TbArrowBackUp,
  TbCheck,
  TbJson,
} from "react-icons/tb";
import axios from "axios";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { notifications } from "@mantine/notifications";
import Layout from "../components/Layout/Layout";
import { SocketProp } from "../types/SocketProp.types";
import { initialSettings } from "../utils/initializer";

const initialDevices = [{ label: "Automatisch erkennen", value: "-1" }];

export default function Settings({ socket }: SocketProp) {
  const [devices, setDevices] = useState(initialDevices);
  const [settings, setSettings] = useState(
    useAppSelector((state) => state.settings.values)
  );
  const dispatch = useAppDispatch();

  // update internal settings state when audio client emitted a statusChanged event
  useEffect(() => {
    socket.on("settingsChanged", (data) => {
      dispatch({ type: "settings/UPDATE_SETTINGS", payload: data });
      setSettings(data);
    });
  }, [socket, dispatch]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/audio-client/devices"
        );
        const data = response.data;
        // transform data to match the format of the NativeSelect component
        const transformed = data.devices.map((device: any) => {
          return {
            label: device.name,
            value: device.id,
          };
        });
        // reset to initial devices state on first component render, then add the loaded devices
        setDevices([...initialDevices, ...transformed]);
      } catch (error: any) {
        console.log(
          "Fehler beim Laden der angeschlossenen Geräte: " + error.message
        );
      }
    };

    fetchDevices();
  }, []);

  return (
    <Layout>
      <Stack h="100%">
        <Title order={2}>Einstellungen</Title>
        <Divider my="md" />
        <Accordion
          multiple
          defaultValue={["Audioaufnahme"]}
          variant="separated"
        >
          <Accordion.Item value="Audioaufnahme">
            <Accordion.Control icon={<TbMicrophone2 />}>
              Audioaufnahme
            </Accordion.Control>
            <Accordion.Panel>
              <Stack>
                <NativeSelect
                  label="Aufnahmegerät"
                  description="Falls angeschlossen wird standardmäßig das EGG-Gerät (iMic) ausgewählt, sont muss hier ein Eingabegerät ausgewählt werden."
                  data={devices}
                  onChange={(event) => {
                    setSettings({
                      ...settings,
                      device: Number(event.currentTarget.value),
                    });
                  }}
                />
                <Group grow>
                  <NumberInput
                    label="Abtastrate"
                    defaultValue={16000}
                    value={settings.sampleRate}
                    placeholder="16000"
                    suffix=" Hz"
                    hideControls
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        sampleRate: Number(event.value),
                      });
                    }}
                  />
                  <NumberInput
                    label="Buffergröße"
                    defaultValue={0.2}
                    value={settings.bufferSize}
                    placeholder="0.2"
                    suffix=" Sek."
                    hideControls
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        bufferSize: Number(event.value),
                      });
                    }}
                  />
                  <NumberInput
                    label="Chunksize"
                    defaultValue={1024}
                    value={settings.chunkSize}
                    placeholder="1024"
                    hideControls
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        chunkSize: Number(event.value),
                      });
                    }}
                  />
                </Group>
                <Blockquote
                  color="red"
                  icon={<TbInfoCircle size={"25"} />}
                  mt="xs"
                  pt={10}
                  pb={10}
                >
                  Beim Aktivieren des Monosignals werden keine EGG-Daten
                  aufgezeichnet.
                </Blockquote>
                <Checkbox
                  label="Monosignal (1 Kanal)"
                  checked={settings.mono}
                  size="md"
                  onChange={(event) => {
                    setSettings({
                      ...settings,
                      mono: event.currentTarget.checked,
                    });
                  }}
                />
                <Blockquote
                  color="yellow"
                  icon={<TbInfoCircle size={"25"} />}
                  mt="xs"
                  pt={10}
                  pb={10}
                >
                  Soll das Mikrofon zusätzlich als Dezibelmessgerät verwendet
                  werden, muss zur Gewährleistung einer möglichst hohen
                  Messgenauigkeit eine zugehörige Kalibrierungdatei beigefügt
                  werden.
                </Blockquote>
                <Container ml={0} pl={0}>
                  <FileInput
                    label="Kalibrierungsdatei"
                    accept=".json"
                    description="Kalibrierungsdatei für das Mikrofon (.json)"
                    placeholder="Datei auswählen"
                    rightSection={<TbJson size={"20"} />}
                  />
                </Container>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="Trigger">
            <Accordion.Control icon={<TbFlagExclamation />}>
              Trigger
            </Accordion.Control>
            <Accordion.Panel>
              <Stack>
                <Text fw={700}>Stimmfeld</Text>
                <Divider />
                <Blockquote
                  color="blue"
                  icon={<TbInfoCircle size={"25"} />}
                  mt="xs"
                  pt={10}
                  pb={10}
                >
                  Definition des zu erfassenden Stimmfeldes. Hieraus resultiert
                  die Größe der unter "Stimmfeld" dargestellten Heatmap.
                </Blockquote>
                <Group grow>
                  <NumberInput
                    label="Untere Frequenzgrenze"
                    description="Untere Grenze des relevanten Frequenzbereichs"
                    defaultValue={55}
                    value={settings.frequency.lower}
                    placeholder="55"
                    suffix=" Hz"
                    hideControls
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        frequency: {
                          ...settings.frequency,
                          lower: Number(event.value),
                        },
                      });
                    }}
                  />
                  <NumberInput
                    label="Obere Frequenzgrenze"
                    description="Obere Grenze des relevanten Frequenzbereichs"
                    defaultValue={1600}
                    value={settings.frequency.upper}
                    placeholder="1600"
                    suffix=" Hz"
                    hideControls
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        frequency: {
                          ...settings.frequency,
                          upper: Number(event.value),
                        },
                      });
                    }}
                  />
                  <NumberInput
                    label="Halbtonschritte"
                    description="Größe der zusammengefassten Frequenzbereiche"
                    defaultValue={2}
                    value={settings.frequency.steps}
                    placeholder="2"
                    hideControls
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        frequency: {
                          ...settings.frequency,
                          steps: Number(event.value),
                        },
                      });
                    }}
                  />
                </Group>
                <Group grow>
                  <NumberInput
                    label="Untere Dezibelgrenze"
                    description="Untere Grenze des relevanten Schalldruckpegels"
                    defaultValue={35}
                    value={settings.db.lower}
                    placeholder="35"
                    suffix=" dB"
                    hideControls
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        db: { ...settings.db, lower: Number(event.value) },
                      });
                    }}
                  />
                  <NumberInput
                    label="Obere Dezibelgrenze"
                    description="Obere Grenze des relevanten Schalldruckpegels"
                    defaultValue={115}
                    value={settings.db.upper}
                    placeholder="115"
                    suffix=" dB"
                    hideControls
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        db: { ...settings.db, upper: Number(event.value) },
                      });
                    }}
                  />
                  <NumberInput
                    label="Dezibelschritte"
                    description="Größe der zusammengefassten Schalldruckpegelbereiche"
                    defaultValue={5}
                    value={settings.db.steps}
                    placeholder="5"
                    suffix=" dB"
                    hideControls
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        db: { ...settings.db, steps: Number(event.value) },
                      });
                    }}
                  />
                </Group>
                <Text fw={700}>Triggerschwelle</Text>
                <Divider />
                <Group ml={0} pl={0} justify="space-between" grow>
                  <NumberInput
                    label="Mindest-Qualitäts-Score"
                    description="Zu erreichender Qualitäts-Score für die Triggerung eines Events. Wertebereich: 0.0 - 1.0. "
                    defaultValue={0.7}
                    value={settings.minScore}
                    placeholder="0.7"
                    hideControls
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        minScore: Number(event.value),
                      });
                    }}
                  />
                  <NumberInput
                    label="Retrigger Scoreverbesserung [%]"
                    description="Prozentuale Verbesserung eine bereits hinterlegten Q-Scores, um ein erneutes Triggern zu ermöglichen."
                    defaultValue={10}
                    placeholder="10"
                    suffix="%"
                    min={10}
                    max={90}
                    onValueChange={(event) => {
                      setSettings({
                        ...settings,
                        retriggerPercentageImprovement:
                          Number(event.value) / 100,
                      });
                    }}
                  />
                </Group>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        <Group justify="center">
          <Button
            color="green"
            rightSection={<TbCheck size={"20"} />}
            onClick={() => {
              socket.emit("changeSettings", settings);
              notifications.show({
                title: "Einstellungen angewendet",
                message: "Die Einstellungen wurden erforlgreich angewendet.",
                color: "green",
                autoClose: 3000,
                icon: <TbCheck size={"20"} />,
              });
            }}
          >
            Speichern
          </Button>
          <Button
            color="red"
            rightSection={<TbArrowBackUp size={"20"} />}
            onClick={() => {
              socket.emit("changeSettings", initialSettings);
              notifications.show({
                title: "Einstellungen zurückgesetzt",
                message:
                  "Die Einstellungen wurden auf die Standardeinstellungen zurückgesetzt.",
                color: "red",
                autoClose: 3000,
                icon: <TbArrowBackUp size={"20"} />,
              });
            }}
          >
            Zurücksetzen
          </Button>
        </Group>
      </Stack>
    </Layout>
  );
}
