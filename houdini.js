function getProp(props, key) {
    // Polyfill doesn't provide an array
    return typeof props.get(key) !== 'string' ? props.get(key)[0] : props.get(key);
  }
  
  function roundRect(ctx, [x, y, w, h, r], clipVec4) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    if (clipVec4) {
      const region = new Path2D();
      const [x, y, w, h] = clipVec4;
      ctx.moveTo(x + r, y);
      region.rect(x, y, w, h);
      ctx.clip(region);
    }
    if (r >= 0) {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    return ctx;
  }
  
  /**
   * Calculate brightness value by RGB or HEX color.
   * @param color (String) The color value in RGB or HEX (for example: #000000 || #000 || rgb(0,0,0) || rgba(0,0,0,0))
   * @returns (Number) The brightness value (dark) 0 ... 255 (light)
   */
  function brightnessByColor(color) {
    color = String(color);
    const isHEX = color.indexOf('#') === 0;
    const isRGB = color.indexOf('rgb') === 0;
  
    let r, g, b;
    if (isHEX) {
      const m = color.substr(1).match(color.length === 7 ? /(\S{2})/g : /(\S{1})/g);
      if (m) {
        r = parseInt(m[0], 16);
        g = parseInt(m[1], 16);
        b = parseInt(m[2], 16);
      }
    }
    if (isRGB) {
      const m = color.match(/(\d+){3}/g);
      if (m) {
        r = m[0];
        g = m[1];
        b = m[2];
      }
    }
    if (typeof r !== 'undefined') return (r * 299 + g * 587 + b * 114) / 1000;
  }
  
  export function paint(ctx, { elemColor, wordPositions, wordClipPositions, sentencePositions }) {
    const useDarkColors = brightnessByColor(elemColor) > 160;
    const wordVec4s = !wordPositions
      ? []
      : new Array(wordPositions.length / 4)
          .fill(0)
          .map((_, i) => wordPositions.slice(i * 4, i * 4 + 4));
  
    const wordClipVec4s = !wordClipPositions
      ? []
      : new Array(wordClipPositions.length / 4)
          .fill(0)
          .map((_, i) => wordClipPositions.slice(i * 4, i * 4 + 4));
  
    const sentenceVec4s = new Array(sentencePositions.length / 4)
      .fill(0)
      .map((_, i) => sentencePositions.slice(i * 4, i * 4 + 4));
  
    ctx.fillStyle = useDarkColors ? '#374b64' : '#E6E8FF';
    for (const i in sentenceVec4s) {
      const sentenceVec4 = sentenceVec4s[i];
      ctx.save();
      roundRect(ctx, [...sentenceVec4, 6], sentenceVec4).fill();
      ctx.restore();
    }
  
    ctx.fillStyle = useDarkColors ? '#3a72e0' : '#B4BBFE';
    for (const i in wordVec4s) {
      const wordVec4 = wordVec4s[i];
      const wordClipVec4 = wordClipVec4s[i];
      ctx.save();
      roundRect(ctx, [...wordVec4, 6], wordClipVec4).fill();
      ctx.restore();
    }
  }
  
  // eslint-disable-next-line
  if ('registerPaint' in globalThis) {
    globalThis.registerPaint(
      'speechifyHighlight',
      class {
        static get inputProperties() {
          return [
            '--speechifyHighlightWordInfo',
            '--speechifyHighlightWordClipInfo',
            '--speechifyHighlightSentenceInfo',
            '--speechifyElemColor',
          ];
        }
  
        paint(ctx, _, props) {
          const elemColor = getProp(props, '--speechifyElemColor');
  
          const wordPositions = getProp(props, '--speechifyHighlightWordInfo')
            ?.split(',')
            .map(Number);
          const wordClipPositions = getProp(props, '--speechifyHighlightWordClipInfo')
            ?.split(',')
            .map(Number);
  
          const sentencePositions = getProp(props, '--speechifyHighlightSentenceInfo')
            .split(',')
            .map(Number);
  
          paint(ctx, { elemColor, wordPositions, wordClipPositions, sentencePositions });
        }
      },
    );
  }  