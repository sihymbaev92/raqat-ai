import type { ThemeColors } from "../../theme/colors";
import { SettingsQuranHub } from "./SettingsQuranHub";

type Props = { colors: ThemeColors };

/** @deprecated Құран баптаулары экранында SettingsQuranHub қолданылады. */
export function SettingsQuranSection({ colors }: Props) {
  return <SettingsQuranHub colors={colors} />;
}
