import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  receiveMessage,
  setTyping,
  updatePresence
} from "../features/chat/chatSlice.js";
import { receiveNotification } from "../features/notifications/notificationsSlice.js";
import { STATIC_DEMO } from "../lib/demo.js";
import { connectSocket, disconnectSocket } from "../lib/socket.js";

export function useSocketEvents() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (STATIC_DEMO) {
      return undefined;
    }

    if (!token) {
      disconnectSocket();
      return undefined;
    }

    const socket = connectSocket(token);

    const onMessage = (payload) => dispatch(receiveMessage(payload));
    const onNotification = (notification) => dispatch(receiveNotification(notification));
    const onTyping = (payload) => dispatch(setTyping(payload));
    const onPresence = (payload) => dispatch(updatePresence(payload));

    socket.on("message:new", onMessage);
    socket.on("notification:new", onNotification);
    socket.on("typing:update", onTyping);
    socket.on("presence:update", onPresence);

    return () => {
      socket.off("message:new", onMessage);
      socket.off("notification:new", onNotification);
      socket.off("typing:update", onTyping);
      socket.off("presence:update", onPresence);
    };
  }, [dispatch, token]);
}
