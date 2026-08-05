import React, { useState, useRef } from "react";
import useTrackSettings from "../../hooks/useTrackSettings";
import EmbeddedPlayer from "../EmbeddedPlayer";
import Modal from "../ui/Modal";
import TrackListView from "./tracks/TrackListView";
import TrackDetailView from "./tracks/TrackDetailView";
import AiWorkoutModal from "./tracks/AiWorkoutModal";

export default function TracksTab({ 
  appConfig, 
  setAppConfig, 
  settingsProgress, 
  setSettingsProgress,
  parentStyles = {}
}) {
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { message, onConfirm }
  const [showAiWorkoutModal, setShowAiWorkoutModal] = useState(false);
  const fileInputRef = useRef(null);

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ message, onConfirm });
  };

  const {
    viewedTrackId,
    setViewedTrackId,
    previewTier,
    setPreviewTier,
    filterMode,
    setFilterMode,
    sortedTracks,
    selectedTrack,
    isSelectedTrackActive,
    handleToggleExclude,
    handlePasteTrack,
    handleImportTrack,
    handleDeleteTrack,
    handleActivateTrack,
    handleDeactivateTrack
  } = useTrackSettings({
    appConfig,
    setAppConfig,
    settingsProgress,
    setSettingsProgress,
    showConfirm
  });

  return (
    <div className={parentStyles['tab-pane'] || "tab-pane"}>
      {viewedTrackId && selectedTrack ? (
        <TrackDetailView
          selectedTrack={selectedTrack}
          isActive={isSelectedTrackActive}
          completedSessions={settingsProgress.completed_sessions_count}
          progressPercent={Math.min(((settingsProgress.completed_sessions_count || 0) / 5) * 100, 100)}
          previewTier={previewTier}
          setPreviewTier={setPreviewTier}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          onBack={() => setViewedTrackId(null)}
          onDeactivate={handleDeactivateTrack}
          onActivateTrack={handleActivateTrack}
          onToggleExclude={handleToggleExclude}
          onWatchVideo={(url) => setActiveVideoUrl(url)}
          parentStyles={parentStyles}
        />
      ) : (
        <TrackListView
          sortedTracks={sortedTracks}
          settingsProgress={settingsProgress}
          onViewTrack={(id) => {
            setViewedTrackId(id);
            const active = settingsProgress.active_track_id === id;
            setPreviewTier(active ? (settingsProgress.onboarding_tier || "beginner") : "beginner");
          }}
          onDeleteTrack={handleDeleteTrack}
          onOpenAiWorkoutModal={() => setShowAiWorkoutModal(true)}
          onImportClick={() => fileInputRef.current?.click()}
          parentStyles={parentStyles}
        />
      )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".json"
        onChange={handleImportTrack}
      />

      {/* Custom AI Workout Modal */}
      {showAiWorkoutModal && (
        <AiWorkoutModal
          isOpen={showAiWorkoutModal}
          onClose={() => setShowAiWorkoutModal(false)}
          onApplyProgram={(jsonStr) => handlePasteTrack(jsonStr, () => setShowAiWorkoutModal(false))}
          parentStyles={parentStyles}
        />
      )}

      {/* Confirmation Dialog Overlay */}
      {confirmDialog && (
        <Modal 
          isOpen={!!confirmDialog} 
          onClose={() => setConfirmDialog(null)} 
          title="Confirm Action"
        >
          <p className={parentStyles['settings-item-desc']} style={{ marginBottom: "1.5rem" }}>
            {confirmDialog.message}
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
            <button 
              type="button" 
              className={parentStyles['settings-cancel-btn']} 
              style={{ margin: 0, padding: "0.5rem 1rem" }}
              onClick={() => setConfirmDialog(null)}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className={parentStyles['settings-save-btn']} 
              style={{ margin: 0, padding: "0.5rem 1rem" }}
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog(null);
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}

      {/* Video Demonstration Player Overlay */}
      {activeVideoUrl && (
        <Modal 
          isOpen={!!activeVideoUrl} 
          onClose={() => setActiveVideoUrl(null)} 
          title="Exercise Video Demo"
        >
          <EmbeddedPlayer 
            videoUrl={activeVideoUrl} 
            style={{ 
              width: "100%", 
              aspectRatio: "16 / 9", 
              height: "auto", 
              borderRadius: "0.75rem", 
              boxShadow: "none" 
            }} 
          />
        </Modal>
      )}
    </div>
  );
}
