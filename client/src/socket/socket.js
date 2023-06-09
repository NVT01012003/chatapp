import { io } from "socket.io-client";
import variables from "../config/env.js";

const server_host = variables.SERVER_HOST;

export const socket = io(`ws://${server_host}`, {
    transports: ["websocket"],
});
socket.on("connect", () => {
    console.log(`socket id ${socket.id} connected`);
});
socket.on("disconnect", () => {
    console.log(`socket id ${socket.id} disconnected`);
});
