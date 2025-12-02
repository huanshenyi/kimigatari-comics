// Types
export * from "./types";

// Canvas Manager
export {
  initializeCanvas,
  createCanvasManager,
  savePageState,
  loadPageState,
  addPage,
  deletePage,
  saveToUndo,
  undo,
  redo,
  setZoom,
  getZoom,
  exportToDataURL,
  exportAllPagesToDataURLs,
  clearCanvas,
  deleteSelectedObjects,
  bringToFront,
  sendToBack,
  setupKeyboardShortcuts,
  type CanvasManager,
} from "./canvas-manager";

// Panel Manager
export {
  createPanel,
  createPanelFromLayout,
  updatePanelPosition,
  getPanelPosition,
  findPanelById,
  getAllPanels,
  sortPanelsByOrder,
  deletePanel,
  createGutterLines,
} from "./panel-manager";

// Bubble Manager
export {
  createBubble,
  updateBubbleText,
  findBubbleById,
  getAllBubbles,
  deleteBubble,
  changeBubbleType,
} from "./bubble-manager";

// Text Manager
export {
  createText,
  convertToVerticalText,
  convertToHorizontalText,
  updateText,
  toggleTextOrientation,
  findTextById,
  getAllTexts,
  deleteText,
  applyTextStyle,
  convertPunctuationForVertical,
  JAPANESE_PUNCTUATION_MAP,
  type TextStyle,
} from "./text-manager";

// Image Loader
export {
  loadImageFromURL,
  loadImageFromFile,
  findImageById,
  deleteImage,
  fitImageToPanel,
  clipImageToPanel,
  applyGrayscaleFilter,
  applyContrastFilter,
  clearImageFilters,
  type LoadedImage,
} from "./image-loader";

// Eraser Manager
export {
  initializeEraser,
  startErasing,
  stopErasing,
  setEraserSize,
  setEraserInverted,
  setObjectErasable,
  setAllImagesErasable,
  EraserBrush,
} from "./eraser-manager";
