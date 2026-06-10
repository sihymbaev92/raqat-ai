import React from "react";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import type { QuranReadingThemeSpec } from "../../theme/quranComReadingTheme";

type Props = {
  page: number;
  theme: QuranReadingThemeSpec;
};

const W = 88;
const H = 28;

/** Quran.com: бет нөмірі — орталық оюлы капсула (сыртқы беттер). */
export function MushafQcomPageOrnament({ page, theme }: Props) {
  const stroke = theme.chromeInk;
  const ink = theme.titleInk;
  const fill = theme.pageFace;
  const cy = H / 2;
  const pillW = 40;
  const pillX = (W - pillW) / 2;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} accessibilityElementsHidden>
      <Circle cx={10} cy={cy} r={2.2} fill={stroke} />
      <Circle cx={14} cy={cy} r={1.4} fill={stroke} opacity={0.65} />
      <Path
        d={`M ${pillX} ${cy - 11} H ${pillX + pillW} A 11 11 0 0 1 ${pillX + pillW} ${cy + 11} H ${pillX} A 11 11 0 0 1 ${pillX} ${cy - 11} Z`}
        fill={fill}
        stroke={stroke}
        strokeWidth={0.9}
      />
      <SvgText
        x={W / 2}
        y={cy + 4}
        fontSize={10.5}
        fontWeight="600"
        fill={ink}
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        {String(page)}
      </SvgText>
      <Circle cx={W - 14} cy={cy} r={1.4} fill={stroke} opacity={0.65} />
      <Circle cx={W - 10} cy={cy} r={2.2} fill={stroke} />
    </Svg>
  );
}
