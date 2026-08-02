/**
 * Formats total seconds into MM:SS format.
 * @param {number} totalSecs 
 * @returns {string}
 */
export const formatTime = (totalSecs) => {
  if (typeof totalSecs !== "number" || isNaN(totalSecs) || totalSecs < 0) {
    return "00:00";
  }
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};
