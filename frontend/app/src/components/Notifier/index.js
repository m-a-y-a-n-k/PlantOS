import React from "react";
import "./styles.css";
import classnames from "classnames";

const Notifier = ({ offline }) => {
  const notifyClass = classnames("notify", {
    danger: offline,
  });

  const message = offline
    ? `Application is offline! Please connect to the internet.`
    : `We strive for a greener and healthier Planet for us and our future generations.`;

  return (
    <div className={notifyClass}>
      <h4>
        <em>{message}</em>
      </h4>
    </div>
  );
};

export default Notifier;
