import {
  Card,
  Container,
  Image,
  Flex,
  Text,
  Button,
  Group,
  Modal,
  Alert,
} from "@mantine/core";
import { useMemo } from "react";
import { TbCheck, TbInfoCircle, TbTrashX } from "react-icons/tb";
import { generateLowerBounds } from "../../utils/voicemapUtils";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { Socket } from "socket.io-client";
import { useDisclosure } from "@mantine/hooks";

export default function Recording({
  socket,
  freqBin,
  dbaBin,
  qScore,
  saveLocation,
  timestamp,
  acceptable = true,
}: {
  socket: Socket;
  freqBin: number;
  dbaBin: number;
  qScore: string;
  saveLocation: string;
  timestamp: string;
  acceptable: boolean;
}) {
  const settingsDb = useAppSelector((state) => state.settings.values.db);
  const settingsFreq = useAppSelector(
    (state) => state.settings.values.frequency
  );
  const dispatch = useAppDispatch();
  const lowerBounds = useMemo(() => {
    const bounds = generateLowerBounds(settingsDb, settingsFreq);
    // we need to reverse the arrays to match the order of the heatmap (generateLowerBounds is a helper function for the heatmap)
    bounds.dba = bounds.dba.reverse();
    return bounds;
  }, [settingsDb, settingsFreq]);
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <Card
      radius="md"
      mb={8}
      shadow="sm"
      withBorder
      h={150}
      pt={0}
      pl={0}
      pr={0}
    >
      <Flex>
        <Image src="/temp/TEST_C001H001S0002000001.jpg" h={150} w={150} />
        <Container ml={0} mt={10} h={"100%"}>
          <Group>
            <Text fw={700}>Frequenz-Bin [Hz]:</Text>
            <Text>
              {lowerBounds.freq[freqBin].slice(0, -2) +
                "." +
                lowerBounds.freq[freqBin].slice(-2)}
            </Text>
          </Group>
          <Group>
            <Text fw={700}>Dezibel-Bin [db(A)]:</Text>
            <Text>{lowerBounds.dba[dbaBin]}</Text>
          </Group>
          <Group>
            <Text fw={700}>Q-Score:</Text>
            <Text>{qScore}</Text>
          </Group>
          <Group>
            <Text fw={700}>Speicherort:</Text>
            <Text>{saveLocation}</Text>
          </Group>
          <Group>
            <Text fw={700}>Zeitstempel:</Text>
            {timestamp}
          </Group>
        </Container>
        {acceptable ? (
          <Button
            h="100%"
            color="green"
            rightSection={<TbCheck size={30} />}
            pr={25}
            radius={0}
            onClick={() => {
              dispatch({
                type: "voicemap/ACCEPT_RECORDING",
                payload: { freqBin: freqBin, dbaBin: dbaBin },
              });
            }}
          />
        ) : (
          <></>
        )}
        <Modal opened={opened} onClose={close} centered title="Löschen">
          <Alert
            variant="light"
            color="red"
            title="Soll die Aufnahme wirklisch gelöscht werden?"
            icon={<TbInfoCircle size={"25"} />}
          >
            Diese Aktion wird die ausgewählte Aufnahme dauerhaft entfernen und
            das Stimmfeld aktualisieren.
          </Alert>
          <Group mt={15} grow>
            <Button variant="light" onClick={close}>
              Abbrechen
            </Button>
            <Button
              color="red"
              onClick={() => {
                dispatch({
                  type: "voicemap/REMOVE_RECORDING",
                  payload: { freqBin: freqBin, dbaBin: dbaBin },
                });
                close();
              }}
            >
              Löschen
            </Button>
          </Group>
        </Modal>
        <Button
          h="100%"
          color="red"
          rightSection={<TbTrashX size={30} />}
          pr={25}
          radius={0}
          onClick={open}
        />
      </Flex>
    </Card>
  );
}
