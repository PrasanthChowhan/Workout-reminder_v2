import React from "react";

export default function AboutTab({ parentStyles }) {
  return (
    <div className={parentStyles['tab-pane']}>
      <div className={parentStyles['settings-group']}>
        <h3 className={parentStyles['settings-group-title']}>Workout & Break Reminder</h3>
        <p className={parentStyles['settings-item-desc']}>
          A cognitive companion to help you stay physically active and mentally focused.
        </p>
      </div>

      <div className={parentStyles['settings-group']} style={{ marginTop: "1.5rem" }}>
        <h3 className={parentStyles['settings-group-title']}>Medical & Liability Waiver</h3>
        <p className={parentStyles['settings-item-desc']} style={{ fontSize: "0.75rem", lineHeight: "1.5", color: "var(--color-text-muted)" }}>
          <strong>NOTICE:</strong> The stretches and exercises suggested by this app are for informational/educational purposes only. They are not a substitute for professional medical advice. Consult a physician before performing them. By continuing, you agree that you participate at your own risk and release the creators from any liability.
        </p>
      </div>

      <div className={parentStyles['settings-group']} style={{ marginTop: "1.5rem" }}>
        <h3 className={parentStyles['settings-group-title']}>YouTube Content Attribution</h3>
        <p className={parentStyles['settings-item-desc']} style={{ fontSize: "0.75rem", lineHeight: "1.5", color: "var(--color-text-muted)" }}>
          All exercise demonstration videos are streamed directly from YouTube using the official embed API. All trademarks, copyrights, and intellectual property in these videos belong strictly to their respective creators. This app is not affiliated with or endorsed by YouTube or the original creators.
        </p>
      </div>
    </div>
  );
}
