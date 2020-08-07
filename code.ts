// Helpers

function getSourceForPaintStyle(style, styles) {
  for (const currentStyle of styles) {
    if (style.description.includes(currentStyle.name)) return currentStyle;
  }
  return null;
}

function getReceiverSourcePairs(styles) {
  const stylesSorted = [...styles].sort(
    (a, b) => b.name.length - a.name.length
  );
  return styles.map((style) => ({
    receiver: style,
    source: getSourceForPaintStyle(style, stylesSorted),
  }));
}

function getPaintStyleByName(styleName, styles) {
  return styles.find((style) => style.name === styleName);
}

// Start point

figma.showUI(__html__, { width: 600, height: 360 });

const styles = figma.getLocalPaintStyles();
const receiverSourcePairs = getReceiverSourcePairs(styles);
receiverSourcePairs.forEach((pair) => {
  if (pair.source) {
    pair.receiver.paints = pair.source.paints;
  }
});
const receiverSourceData = receiverSourcePairs.map((pair, index) => ({
  receiver: {
    name: pair.receiver.name,
    idFigmaStyle: pair.receiver.id,
  },
  source: {
    name: pair.source ? pair.source.name : "",
    idDOMElement: `input-style-source-${index}`,
  },
}));
figma.ui.postMessage({
  type: "render",
  receiverSourceData: receiverSourceData,
});

// Events handler

function isPaintStyle(style: BaseStyle): style is PaintStyle {
  return "paints" in style;
}

figma.ui.onmessage = (msg) => {
  switch (msg.type) {
    case "update-name-in-description": {
      const paintStyle = figma.getStyleById(msg.idFigmaStyle);
      if (!paintStyle) return;
      paintStyle.description = msg.newName;
      figma.notify(`New source style: ${msg.newName}`);
      break;
    }

    case "assign-new-source": {
      const styleReceiver = figma.getStyleById(msg.idFigmaStyle);
      if (!styleReceiver || !isPaintStyle(styleReceiver)) return;
      const styleSource = getPaintStyleByName(msg.sourceName, styles);
      if (!styleSource) return;
      styleReceiver.paints = styleSource.paints;
    }

    default: {
      break;
    }
  }
};
