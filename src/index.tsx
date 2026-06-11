import {
  definePlugin,
  ServerAPI,
} from "decky-frontend-lib";
import React from "react";
import { FaBook } from "react-icons/fa";
import { Settings } from "./Settings";

export default definePlugin((serverApi: ServerAPI) => {
  return {
    title: <div className="title-class">OCR Learner</div>,
    name: "OCR Learner",
    icon: <FaBook />,
    content: <Settings serverApi={serverApi} />,
  };
});
