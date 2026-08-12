import { useState, useEffect } from "react";
import { invoke } from "../utils/tauri";
import { toast } from "../utils/toast";

export default function useRecallConcepts() {
  const [concepts, setConcepts] = useState([]);

  const loadConcepts = async () => {
    try {
      const list = await invoke("get_recall_concepts");
      setConcepts(list || []);
    } catch (err) {
      console.error("Failed to load recall concepts", err);
      toast.error("Failed to load recall concepts.");
    }
  };

  useEffect(() => {
    loadConcepts();
  }, []);

  const handleImportJson = (file, onComplete) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = event.target.result;
        await invoke("import_recall_json", { jsonStr: jsonContent });
        toast.success("Recall cards imported and merged successfully!");
        loadConcepts();
      } catch (err) {
        console.error("Import failed", err);
        toast.error("Import failed: " + err);
      } finally {
        if (onComplete) onComplete();
      }
    };
    reader.readAsText(file);
  };

  const handleExportJson = async () => {
    try {
      const data = await invoke("export_recall_json");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `active_recall_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Recall cards exported successfully!");
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Export failed: " + err);
    }
  };

  const handleApplyRecallCards = async (jsonStr, onSuccess) => {
    try {
      await invoke("import_recall_json", { jsonStr });
      toast.success("Recall cards imported and merged successfully!");
      if (onSuccess) onSuccess();
      loadConcepts();
    } catch (err) {
      console.error("Import failed", err);
      toast.error("Import failed: " + err);
    }
  };

  return {
    concepts,
    loadConcepts,
    handleImportJson,
    handleExportJson,
    handleApplyRecallCards
  };
}
