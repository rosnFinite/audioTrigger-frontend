import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Settings from "./views/Settings";
import VoiceField from "./views/VoiceField";
import Patient from "./views/Patient";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { persistor } from "./redux/store";
import { socket } from "./socket";

export default function App() {
  const settings = useAppSelector((state) => state.settings.values);
  const dispatch = useAppDispatch();

  // handles registering of web client to socketio backend and sets the audio client sid
  useEffect(() => {
    console.log("useEffect");
    socket.on("connect", () => {
      console.log("connected to socketio server");
      socket.emit("registerClient", { type: "web" });
    });
    socket.on("connect_error", (error: Error) => {
      console.log("connect_error", error);
      persistor.purge();
      dispatch({ type: "settings/SET_CLIENT_SID", payload: { sid: "" } });
      dispatch({ type: "voicemap/INITIALIZE" });
    });
    socket.on("clients", (clients: { sid: string; type: string }[]) => {
      console.log("clients event", clients);
      // find audio client in clients array
      const audioClient = clients.find((item) => item.type === "audio");
      // if audio client is connected
      if (audioClient) {
        const { sid } = audioClient;
        if (sid !== settings.sid) {
          // clear persisted state if sid of connected audio client changes
          persistor.purge();
          dispatch({ type: "settings/SET_CLIENT_SID", payload: { sid } });
          dispatch({ type: "voicemap/INITIALIZE" });
        }
      } else {
        // clear persisted state if audio client is disconnected or not found
        dispatch({ type: "settings/SET_CLIENT_SID", payload: { sid: "" } });
        dispatch({ type: "voicemap/INITIALIZE" });
      }
    });
  }, []);

  // Careful  when using HashRouter: Different behaviour between NavLink in Layout and Link from react-router-dom. href in NavLink needs /#/pathname whereas Link works without prepending /# to /pathname
  return (
    <Routes>
      <Route path="/" element={<Settings socket={socket} />} />
      <Route path="/stimmfeld" element={<VoiceField socket={socket} />} />
      <Route path="/patientenansicht" element={<Patient socket={socket} />} />
    </Routes>
  );
}
