import {
  Text,
  Button,
  Group,
  NativeSelect,
  NumberInput,
  Switch,
  Divider,
  Container,
  Grid,
  Modal,
  Center,
  Stack,
  Badge,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { TbColorPicker } from "react-icons/tb";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { useDisclosure } from "@mantine/hooks";
import { getMinMaxScore } from "../../utils/selectionUtils";

interface VoiceFieldControlGroupProps {
  onStatChange: (selectedStat: string) => void;
}

const colorSchemes = [
  { label: "Sequential: Blues", value: "blues" },
  { label: "Sequential: Greens", value: "greens" },
  { label: "Sequential: Reds", value: "reds" },
  { label: "Sequential: Green->Blue", value: "green_blue" },
  { label: "Sequential: Blue->Green", value: "blue_green" },
  { label: "Sequential: Purple->Red", value: "purple_red" },
  {
    label: "Sequential: Yellow->Green->Blue",
    value: "yellow_green_blue",
  },
  { label: "Sequential: Yellow->Orange->Red", value: "yellow_orange_red" },
  { label: "Diverging: Spectral", value: "spectral" },
  { label: "Diverging: Red->Blue", value: "red_blue" },
  { label: "Diverging: Red->Grey", value: "red_grey" },
  { label: "Diverging: Red->Yellow->Green", value: "red_yellow_green" },
];

export default function VoiceFieldControlGroup({
  onStatChange,
}: VoiceFieldControlGroupProps) {
  const [stat, setStat] = useState<string>("score");
  const field = useAppSelector((state) => state.voicemap.values.field);
  const colorSettings = useAppSelector((state) => state.voicemap.values.color);
  const dispatch = useAppDispatch();

  const [opened, { open, close }] = useDisclosure(false);
  const minScore = useAppSelector((state) => state.settings.values.min_score);
  const [statColorSettings, setStatColorSettings] = useState<ColorSetting>(
    colorSettings[stat as keyof StatColorSettings]
  );
  const [colorMinMax, setColorMinMax] = useState<{
    min: number | undefined;
    max: number | undefined;
  }>({ min: undefined, max: undefined });
  const [dataMinMax, setDataMinMax] = useState<{ min: number; max: number }>({
    min: 0,
    max: 0,
  });
  const [colorDiverge, setColorDiverge] = useState<number>(0.5);
  const [autoMinMax, setAutoMinMax] = useState<boolean>(true);
  const [schemeType, setSchemeType] = useState<string>("");
  const [scheme, setScheme] = useState<string>("");

  const handleStatChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const stat: string = event.currentTarget.value;
    setStat(stat);
    onStatChange(stat);
  };

  useEffect(() => {
    const color = colorSettings[stat as keyof StatColorSettings];
    const { min, max } = getMinMaxScore(field, stat as keyof VoiceStats);
    // handle if scaling menu is shown per default for selected stat depending on min max values have been changed in the past
    if (color.min !== undefined || color.max !== undefined) {
      if (stat === "score" && minScore === color.min && color.max === 1) {
        setAutoMinMax(true);
      } else {
        setAutoMinMax(false);
      }
    } else {
      setAutoMinMax(true);
    }
    setSchemeType(color.type);
    setScheme(color.scheme);
    setColorMinMax({ min: color.min, max: color.max });
    setDataMinMax({ min: min, max: max });
    setStatColorSettings(color);
  }, [stat, field, statColorSettings.min, statColorSettings.max]);

  return (
    <Group align="flex-end">
      <NativeSelect
        variant="filled"
        label="Statistik"
        description="Wählen Sie die Statistik, die Sie visualisieren möchten."
        value={stat}
        onChange={handleStatChange}
        data={[
          "score",
          "meanF",
          "stdevF",
          "hnr",
          "localJitter",
          "localAbsoluteJitter",
          "rapJitter",
          "ppq5Jitter",
          "ddpJitter",
          "localShimmer",
          "localdbShimmer",
          "apq3Shimmer",
          "aqpq5Shimmer",
          "apq11Shimmer",
          "ddaShimmer",
        ]}
      />
      <Button leftSection={<TbColorPicker />} onClick={open}>
        Farbskalierung
      </Button>
      {!autoMinMax && (
        <Badge size="xs" variant="transparent" color="green" pl={0}>
          Angepasst
        </Badge>
      )}
      <Group>
        <Modal
          opened={opened}
          onClose={close}
          title={`Farbskalierung für ${stat}`}
        >
          <Group>
            <NativeSelect
              label="Typ"
              value={schemeType}
              onChange={(event) => setSchemeType(event.currentTarget.value)}
              data={[
                { label: "Diverging", value: "diverging" },
                { label: "Sequential", value: "sequential" },
                { label: "Quantize", value: "quantize" },
              ]}
            />
            <NativeSelect
              label="Schema"
              value={scheme}
              onChange={(event) => setScheme(event.currentTarget.value)}
              data={colorSchemes}
            />
          </Group>
          <Divider my="sm" />
          <Center>
            <Switch
              checked={autoMinMax}
              label="Automatisch Auswahl des Wertebereichs"
              onChange={(event) => setAutoMinMax(event.currentTarget.checked)}
            />
          </Center>
          {!autoMinMax && (
            <Stack mt={10} gap="xs">
              <Group>
                <Container>
                  <Text td="underline" fw={500}>
                    {" "}
                    Datenbestand
                  </Text>
                  <Text size="xs">
                    Min: {dataMinMax.min === Infinity ? "NaN" : dataMinMax.min}
                  </Text>
                  <Text size="xs">
                    Max: {dataMinMax.max === -Infinity ? "NaN" : dataMinMax.max}
                  </Text>
                </Container>
                <Container>
                  <Text td="underline" fw={500}>
                    {" "}
                    Ausgewählt
                  </Text>
                  <Text size="xs">
                    Min:{" "}
                    {statColorSettings.min ? statColorSettings.min : "Autom."}
                  </Text>
                  <Text size="xs">
                    Max:{" "}
                    {statColorSettings.max ? statColorSettings.max : "Autom."}
                  </Text>
                </Container>
              </Group>
              <Divider my="sm" />
              <NumberInput
                disabled={autoMinMax}
                label="Mindestwert"
                description="Geben Sie den minimalen Wert für die Farbskala ein."
                defaultValue={
                  colorMinMax.min ? colorMinMax.min : dataMinMax.min
                }
                onChange={(value) =>
                  setColorMinMax({ min: Number(value), max: colorMinMax.max })
                }
              />
              <NumberInput
                disabled={autoMinMax}
                label="Maximalwert"
                description="Geben Sie den maximalen Wert für die Farbskala ein."
                defaultValue={
                  colorMinMax.max ? colorMinMax.max : dataMinMax.max
                }
                onChange={(value) =>
                  setColorMinMax({ min: colorMinMax.min, max: Number(value) })
                }
              />
              {schemeType === "diverging" && (
                <NumberInput
                  disabled={autoMinMax}
                  label="Diverge at"
                  description="Geben Sie den Wert ein, bei dem die Farbskala divergieren soll. [0 <= Wert <= 1]"
                  defaultValue={colorDiverge}
                  onChange={(value) => setColorDiverge(Number(value))}
                  min={0}
                  max={1}
                />
              )}
            </Stack>
          )}
          <Grid mt={10}>
            <Grid.Col span={6}>
              <Button
                color="green"
                fullWidth
                onClick={() => {
                  dispatch({
                    type: "voicemap/SET_COLOR",
                    payload: {
                      stat: stat,
                      color: {
                        min: autoMinMax ? undefined : colorMinMax.min,
                        max: autoMinMax ? undefined : colorMinMax.max,
                        type: schemeType,
                        scheme: scheme,
                      },
                    },
                  });
                  close();
                }}
              >
                Anwenden
              </Button>
            </Grid.Col>
            <Grid.Col span={6}>
              <Button
                color="red"
                fullWidth
                onClick={() => {
                  dispatch({
                    type: "voicemap/SET_COLOR",
                    payload: {
                      stat: stat,
                      color: {
                        min: stat === "score" ? minScore : undefined,
                        max: stat === "score" ? 1 : undefined,
                        type: "diverging",
                        scheme: "blues",
                      },
                    },
                  });
                  setAutoMinMax(true);
                  setSchemeType("diverging");
                  setScheme("blues");
                  close();
                }}
              >
                Zurücksetzen
              </Button>
            </Grid.Col>
          </Grid>
        </Modal>
      </Group>
    </Group>
  );
}
