import {
  Divider,
  Group,
  NativeSelect,
  ScrollArea,
  Stack,
  Title,
  Text,
} from "@mantine/core";
import Layout from "../components/Layout/Layout";
import { useEffect, useState } from "react";
import { TbRefresh } from "react-icons/tb";
import axios from "axios";

export default function Logs() {
  const [logs, setLogs] = useState("");
  const [selectedLog, setSelectedLog] = useState("server");
  const [reloadableSeed, setReloadableSeed] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5001/api/logs/${selectedLog}`
        );
        setLogs(response.data.text_content);
      } catch (error) {
        console.error(error);
      }
    };

    // setup interval to fetch logs
    const intervalTimer = setInterval(fetchLogs, 1000);
    setReloadableSeed(reloadableSeed + 1); // trigger re-render to update ScrollArea content (key change

    // function to clean up effect when component unmounts
    return () => clearInterval(intervalTimer);
  }, [selectedLog]); // empty dependency array to run when mounted

  return (
    <Layout>
      <Stack h={"100%"}>
        <Title order={2}>Logs</Title>
        <Divider />
        <Group align="flex-end">
          <NativeSelect
            label="Log-Datei"
            description="Auswahl der anzuzeigenden Log-Datei. Aufgeteilt in Logs der einzelnen Backendkomponenten."
            value={selectedLog}
            onChange={(event) => setSelectedLog(event.currentTarget.value)}
            data={["server", "client"]}
          />
        </Group>
        <ScrollArea
          key={reloadableSeed}
          h={450}
          type="auto"
          offsetScrollbars
          scrollbarSize={8}
          scrollHideDelay={1500}
        >
          <Text size="xs" style={{ whiteSpace: "pre-wrap" }}>
            {logs}
          </Text>
        </ScrollArea>
      </Stack>
    </Layout>
  );
}
