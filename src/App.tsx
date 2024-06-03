import React, { useContext, useEffect, useRef, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./redux/hooks";
import { persistor } from "./redux/store";
import SocketContext from "./context/SocketContext";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import Patient from "./pages/Patient";
import Dashboard from "./pages/Dashboard";
import { notifications } from "@mantine/notifications";
import { error } from "console";

export default function App() {
  const socket = useContext(SocketContext);
  const settingsSID = useRef("");
  // const settingsSID = useAppSelector((state) => state.settings.values.sid);
  const dispatch = useAppDispatch();
  const location = useLocation();

  // handles registering of web client to socketio backend and sets the audio client sid
  useEffect(() => {
    if (!socket) {
      console.error("Socket is not initialized");
      return;
    }
    socket.on("connect", () => {
      // need to specifically handle patient view -> should not register as web client
      // also in following event handlers
      if (location.pathname === "/dashboard/patient") {
        socket.emit("register", { type: "web_patient" });
      } else {
        socket.emit("register", { type: "web" });
      }
    });
    socket.on("connect_error", (error: Error) => {
      console.log("connect_error", error);
      if (location.pathname !== "/dashboard/patient") {
        persistor.purge();
        dispatch({ type: "settings/SET_CLIENT_SID", payload: { sid: "" } });
        dispatch({ type: "voicemap/INITIALIZE" });
      }
    });
    socket.on("client_error", (error_data) => {
      console.log("client_error", error_data.error);
      if (location.pathname !== "/dashboard/patient") {
        notifications.show({
          title: error_data.error,
          message: error_data.location,
          color: error_data.type === "warning" ? "yellow" : "red",
          autoClose: error_data.type === "warning" ? 4000 : false,
        });
        if (error_data.type === "error") {
          dispatch({ type: "settings/SET_CLIENT_SID", payload: { sid: "" } });
        }
      }
    });
    socket.on("disconnect", (data) => {
      if (location.pathname !== "/dashboard/patient") {
        persistor.purge();
        dispatch({ type: "settings/SET_CLIENT_SID", payload: { sid: "" } });
        settingsSID.current = "";
        dispatch({ type: "voicemap/INITIALIZE" });
        console.log(location.pathname);
        notifications.show({
          title: "Verbindung zum Backend fehlgeschlagen",
          message:
            "Das Backend ist aktuell nicht erreichbar. Entweder wurde das Backend beendet oder eine andere Webanwendung reserviert aktuell die Verbindung. Sollte eine BackendID angezeigt werden, kann diese Nachricht ignoriert werden.",
          color: "red",
          autoClose: false,
        });
      }
    });
    socket.on("clients", (clients: { sid: string; type: string }[]) => {
      console.log("clients", clients);
      // find audio client in clients array
      const audioClient = clients.find((item) => item.type === "audio");
      // if audio client is connected
      if (audioClient) {
        const { sid } = audioClient;
        if (location.pathname !== "/dashboard/patient") {
          console.log("location", location.pathname);
          console.log("settingsSID", settingsSID, "sid", sid);
          if (sid !== settingsSID.current) {
            // clear persisted state if sid of connected audio client changes
            persistor.purge();
            console.log("persistor.purge()");
            settingsSID.current = sid;
            dispatch({
              type: "settings/SET_CLIENT_SID",
              payload: { sid: sid },
            });
            dispatch({ type: "voicemap/INITIALIZE" });
            notifications.show({
              title: "Verbindung hergestellt",
              message: "Verbindung zum Backend mit ID " + sid + " hergestellt.",
              color: "green",
              autoClose: 2000,
            });
          }
        }
      }
    });

    return () => {
      if (location.pathname === "/dashboard/patient") {
        socket.off("connect_error");
        socket.off("disconnect");
      }
    };
  }, [socket]);

  // Careful  when using HashRouter: Different behaviour between NavLink in Layout and Link from react-router-dom. href in NavLink needs /#/pathname whereas Link works without prepending /# to /pathname
  return (
    <Routes>
      <Route path="/" element={<Settings />} />
      <Route path="/dashboard">
        <Route index element={<Dashboard />} />
        <Route path="patient" element={<Patient />} />
      </Route>
      <Route path="/logs" element={<Logs />} />
    </Routes>
  );
}
