// Helpers

function getSourceForStyle(style, styles) {
  const stylesSorted = [...styles].sort(
    (a, b) => b.name.length - a.name.length
  );
  for (const currentStyle of stylesSorted) {
    if (style.description.includes(currentStyle.name)) return currentStyle;
  }
  return null;
}

function getReceiverSourcePairs(styles) {
  return styles.map((style) => ({
    receiver: style,
    source: getSourceForStyle(style, styles),
  }));
}

function getStyleByName(styleName, styles) {
  return styles.find((style) => style.name === styleName);
}

function assignStylesAndComposeDataForUI(styles) {
  return styles.map((receiver, index) => {
    const source = getSourceForStyle(receiver, styles);
    if (source) receiver.paints = source.paints;
    return {
      receiver: {
        name: receiver.name,
        idFigmaStyle: receiver.id,
      },
      source: {
        name: source ? source.name : "",
        idDOMElement: `input-style-source-${index}`,
      },
    };
  });
}

// Start point

figma.showUI(__html__, { width: 600, height: 360 });

const styles = figma.getLocalPaintStyles();
const dataForUI = assignStylesAndComposeDataForUI(styles);
figma.ui.postMessage({
  type: "render",
  dataForUI,
});

// Events handler

function isPaintStyle(style: BaseStyle): style is PaintStyle {
  return "paints" in style;
}

figma.ui.onmessage = (msg) => {
  switch (msg.type) {
    case "update-name-in-description": {
      const style = figma.getStyleById(msg.idFigmaStyle);
      if (!style) return;
      style.description = msg.newName;
      figma.notify(`New source style: ${msg.newName}`);
      break;
    }

    case "assign-new-source": {
      const styleReceiver = figma.getStyleById(msg.idFigmaStyle);
      if (!styleReceiver || !isPaintStyle(styleReceiver)) return;
      const styleSource = getStyleByName(msg.sourceName, styles);
      if (!styleSource) return;
      styleReceiver.paints = styleSource.paints;
    }

    default: {
      break;
    }
  }
};
