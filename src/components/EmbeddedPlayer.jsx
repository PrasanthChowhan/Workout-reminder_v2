import React from "react";
import styles from "./EmbeddedPlayer.module.css";

/**
 * Extracts the YouTube 11-character video ID from various YouTube URL formats.
 */
function getYoutubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Stateless EmbeddedPlayer component that renders a clean YouTube embed iframe
 * using YouTube's native controls, including native fullscreen capabilities.
 */
export default function EmbeddedPlayer({ videoUrl, title }) {
  const videoId = getYoutubeId(videoUrl);

  if (!videoId) {
    return (
      <div className={styles["player-container"]} style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-brand-orange)" }}>
        <p>Invalid or unsupported video URL</p>
      </div>
    );
  }

  // Embed URL with native controls and native fullscreen enabled (fs=1)
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&fs=1&rel=0&modestbranding=1&iv_load_policy=3`;

  return (
    <div className={styles["player-container"]}>
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
