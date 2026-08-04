import React from "react";
import { getYoutubeId, getYoutubeStart } from "../utils/youtube";
import styles from "./EmbeddedPlayer.module.css";

/**
 * Stateless EmbeddedPlayer component that renders a clean YouTube embed iframe
 * using YouTube's native controls, including native fullscreen capabilities.
 */
export default function EmbeddedPlayer({ videoUrl, title, style }) {
  const videoId = getYoutubeId(videoUrl);
  const startSecs = getYoutubeStart(videoUrl);

  if (!videoId) {
    return (
      <div className={styles["player-container"]} style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-brand-orange)", ...style }}>
        <p>Invalid or unsupported video URL</p>
      </div>
    );
  }

  // Embed URL with native controls and native fullscreen enabled (fs=1)
  let embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&fs=1&rel=0&modestbranding=1&iv_load_policy=3`;
  if (startSecs) {
    embedUrl += `&start=${startSecs}`;
  }

  return (
    <div className={styles["player-container"]} style={style}>
      <div className={styles["iframe-wrapper"]}>
        <iframe
          src={embedUrl}
          className={styles["iframe-el"]}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          title={title || "Video Player"}
        />
      </div>
    </div>
  );
}
