import React from "react";
import "./styles.css";
import classnames from "classnames";

const Notifier = ({ offline }) => {
  const notifyClass = classnames("notify", {
    danger: offline,
  });

  const message = offline
    ? `Application is offline! Your images will be saved now and then uploaded to Library once your Internet connection is back up.`
    : `Take a picture and it will be uploaded to Library.`;

  return (
    <div className={notifyClass}>
      <p>
        <em>{message}</em>
      </p>
    </div>
  );
};

export default Notifier;